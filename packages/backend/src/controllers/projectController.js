const Project = require("../models/Project");
const AIChat = require("../models/AIChat");
const ImageContent = require("../models/ImageContent");
const TextContent = require("../models/TextContent");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const {
  normalizeObjectIdList,
  normalizeString,
  requireTrimmedString
} = require("../utils/validation");

const createProject = asyncHandler(async (req, res) => {
  const { title, type, category = "Other", description = "", collaborators = [] } = req.body;
  const normalizedTitle = requireTrimmedString(title, "Project title");

  if (!type) {
    throw httpError(400, "Project type is required");
  }

  if (!["text", "image"].includes(type)) {
    throw httpError(400, "Project type must be text or image");
  }

  const normalizedCollaborators = await validateCollaborators(collaborators, req.user.id);

  const project = await Project.create({
    title: normalizedTitle,
    type,
    category: normalizeString(category, "Other") || "Other",
    description: normalizeString(description),
    owner: req.user.id,
    collaborators: normalizedCollaborators,
    collaboratorPermissions: normalizedCollaborators.map((userId) => ({
      user: userId,
      accessLevel: "editor"
    }))
  });

  const createdProject = await Project.findById(project._id)
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  res.status(201).json(serializeProjectForUser(createdProject, req.user.id));
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user.id }, { collaborators: req.user.id }]
  })
    .populate("owner", "name email")
    .populate("collaborators", "name email")
    .sort({ updatedAt: -1 });

  res.json(projects.map((project) => serializeProjectForUser(project, req.user.id)));
});

const listSharedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    owner: { $ne: req.user.id },
    collaborators: req.user.id
  })
    .populate("owner", "name email")
    .populate("collaborators", "name email")
    .sort({ updatedAt: -1 });

  res.json(projects.map((project) => serializeProjectForUser(project, req.user.id)));
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.params.id, req.user.id);
  res.json(serializeProjectForUser(project, req.user.id));
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.params.id, req.user.id);
  const allowedUpdates = ["title", "type", "category", "description", "collaborators"];

  if (req.body.type !== undefined && !["text", "image"].includes(req.body.type)) {
    throw httpError(400, "Project type must be text or image");
  }

  allowedUpdates.forEach((field) => {
    if (field !== "collaborators" && req.body[field] !== undefined) {
      project[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  });

  if (req.body.title !== undefined && !project.title) {
    throw httpError(400, "Project title is required");
  }

  if (req.body.category !== undefined && !project.category) {
    project.category = "Other";
  }

  if (req.body.collaborators !== undefined) {
    const collaborators = await validateCollaborators(
      req.body.collaborators,
      getObjectIdString(project.owner)
    );
    project.collaborators = collaborators;
    project.collaboratorPermissions = collaborators.map((userId) => {
      const existingPermission = project.collaboratorPermissions.find(
        (permission) => getObjectIdString(permission.user) === String(userId)
      );

      return {
        user: userId,
        accessLevel: existingPermission?.accessLevel || "editor"
      };
    });
  }

  await project.save();
  const updatedProject = await Project.findById(project._id)
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  res.json(serializeProjectForUser(updatedProject, req.user.id));
});

const inviteProjectCollaborator = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw httpError(400, "Invite email is required");
  }

  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!project) {
    throw httpError(404, "Project not found or only owners can invite collaborators");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    throw httpError(404, "No user account exists for this email");
  }

  if (String(user._id) === String(project.owner)) {
    throw httpError(400, "Project owner is already a collaborator");
  }

  if (
    !project.collaborators.some((collaboratorId) => String(collaboratorId) === String(user._id))
  ) {
    project.collaborators.push(user._id);
    project.collaboratorPermissions.push({ user: user._id, accessLevel: "editor" });
    await project.save();
  }

  const updatedProject = await Project.findById(project._id)
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  res.json(serializeProjectForUser(updatedProject, req.user.id));
});

const leaveProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    owner: { $ne: req.user.id },
    collaborators: req.user.id
  });

  if (!project) {
    throw httpError(404, "Shared project not found");
  }

  project.collaborators = project.collaborators.filter(
    (collaboratorId) => String(collaboratorId) !== String(req.user.id)
  );
  project.collaboratorPermissions = project.collaboratorPermissions.filter(
    (permission) => String(permission.user) !== String(req.user.id)
  );

  await project.save();

  res.json({ message: "You left this shared project." });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!project) {
    throw httpError(404, "Project not found or only owners can delete projects");
  }

  await Promise.all([
    AIChat.deleteMany({ project: project._id }),
    ImageContent.deleteMany({ project: project._id }),
    TextContent.deleteMany({ project: project._id })
  ]);
  await project.deleteOne();
  res.status(204).send();
});

async function findAccessibleProject(projectId, userId) {
  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { collaborators: userId }]
  })
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  if (!project) {
    throw httpError(404, "Project not found");
  }

  return project;
}

async function validateCollaborators(collaborators, ownerId) {
  const normalizedIds = normalizeObjectIdList(collaborators, "Collaborators") || [];
  const ownerIdString = getObjectIdString(ownerId);
  const collaboratorIds = normalizedIds.filter((id) => id !== ownerIdString);

  if (collaboratorIds.length === 0) {
    return [];
  }

  const existingUsers = await User.find({ _id: { $in: collaboratorIds } }).select("_id");

  if (existingUsers.length !== collaboratorIds.length) {
    throw httpError(400, "One or more collaborators do not exist");
  }

  return collaboratorIds;
}

function getObjectIdString(value) {
  return String(value?._id || value);
}

function serializeProjectForUser(project, userId) {
  const projectObject = project.toObject ? project.toObject() : project;
  const userIdString = String(userId);
  const ownerIdString = getObjectIdString(projectObject.owner);
  const collaboratorIds = (projectObject.collaborators || []).map(getObjectIdString);
  const accessLevel = getAccessLevelForUser(projectObject, userIdString);

  return {
    ...projectObject,
    currentUserRole: ownerIdString === userIdString ? "owner" : "collaborator",
    accessLevel,
    canEdit: ownerIdString === userIdString || accessLevel === "editor",
    canManageSharing: ownerIdString === userIdString,
    canDelete: ownerIdString === userIdString,
    isSharedWithCurrentUser:
      ownerIdString !== userIdString && collaboratorIds.includes(userIdString)
  };
}

function getAccessLevelForUser(project, userId) {
  if (getObjectIdString(project.owner) === userId) {
    return "editor";
  }

  const permission = (project.collaboratorPermissions || []).find(
    (item) => getObjectIdString(item.user) === userId
  );

  if (permission?.accessLevel === "viewer") {
    return "viewer";
  }

  return (project.collaborators || []).some(
    (collaboratorId) => getObjectIdString(collaboratorId) === userId
  )
    ? "editor"
    : null;
}

module.exports = {
  createProject,
  deleteProject,
  findAccessibleProject,
  getProjectById,
  inviteProjectCollaborator,
  leaveProject,
  listProjects,
  listSharedProjects,
  updateProject
};
