const Project = require("../models/Project");
const AIChat = require("../models/AIChat");
const ImageContent = require("../models/ImageContent");
const ProjectInvite = require("../models/ProjectInvite");
const TextContent = require("../models/TextContent");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const {
  ACCESS_LEVELS,
  ACCESS_LEVEL_VALUES,
  PROJECT_FIELD_LABELS,
  PROJECT_MESSAGES,
  PROJECT_ROLES,
  PROJECT_TYPE_VALUES
} = require("../constants/projects");
const {
  normalizeObjectIdList,
  normalizeString,
  requireTrimmedString
} = require("../utils/validation");
const {
  sendExistingUserProjectInviteEmail,
  sendNewUserProjectInviteEmail
} = require("../utils/email");

const createProject = asyncHandler(async (req, res) => {
  const { title, type, category = "Other", description = "", collaborators = [] } = req.body;
  const normalizedTitle = requireTrimmedString(title, PROJECT_FIELD_LABELS.PROJECT_TITLE);

  if (!type) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_TYPE_REQUIRED);
  }

  if (!PROJECT_TYPE_VALUES.includes(type)) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_TYPE_INVALID);
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
      accessLevel: ACCESS_LEVELS.EDITOR
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
  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.id
  });
  const allowedUpdates = ["title", "type", "category", "description", "collaborators"];

  if (!project) {
    throw httpError(404, PROJECT_MESSAGES.PROJECT_UPDATE_OWNER_ONLY);
  }

  if (req.body.type !== undefined && !PROJECT_TYPE_VALUES.includes(req.body.type)) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_TYPE_INVALID);
  }

  allowedUpdates.forEach((field) => {
    if (field !== "collaborators" && req.body[field] !== undefined) {
      project[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  });

  if (req.body.title !== undefined && !project.title) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_TITLE_REQUIRED);
  }

  if (req.body.category !== undefined && !project.category) {
    project.category = "Other";
  }

  if (req.body.collaborators !== undefined) {
    const collaborators = await validateCollaborators(
      req.body.collaborators,
      getObjectIdString(project.owner)
    );
    const requestedPermissions = Array.isArray(req.body.collaboratorPermissions)
      ? req.body.collaboratorPermissions
      : [];
    project.collaborators = collaborators;
    project.collaboratorPermissions = collaborators.map((userId) => {
      const requestedPermission = requestedPermissions.find(
        (permission) => getObjectIdString(permission.user) === String(userId)
      );
      const existingPermission = project.collaboratorPermissions.find(
        (permission) => getObjectIdString(permission.user) === String(userId)
      );

      return {
        user: userId,
        accessLevel: ACCESS_LEVEL_VALUES.includes(requestedPermission?.accessLevel)
          ? requestedPermission.accessLevel
          : existingPermission?.accessLevel || ACCESS_LEVELS.EDITOR
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
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const accessLevel = ACCESS_LEVEL_VALUES.includes(req.body.accessLevel)
    ? req.body.accessLevel
    : ACCESS_LEVELS.EDITOR;

  if (!email) {
    throw httpError(400, PROJECT_MESSAGES.INVITE_EMAIL_REQUIRED);
  }

  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!project) {
    throw httpError(404, PROJECT_MESSAGES.INVITE_OWNER_ONLY);
  }

  const inviter = await User.findById(req.user.id).select("name email");
  const user = await User.findOne({ email });

  if (user && String(user._id) === String(project.owner)) {
    throw httpError(400, PROJECT_MESSAGES.INVITE_OWNER_ALREADY_COLLABORATOR);
  }

  if (user) {
    const alreadyCollaborator = project.collaborators.some(
      (collaboratorId) => String(collaboratorId) === String(user._id)
    );
    const existingPermission = project.collaboratorPermissions.find(
      (permission) => String(permission.user) === String(user._id)
    );
    const shouldUpdatePermission =
      existingPermission && existingPermission.accessLevel !== accessLevel;

    if (!alreadyCollaborator) {
      project.collaborators.push(user._id);
    }

    if (existingPermission) {
      existingPermission.accessLevel = accessLevel;
    } else {
      project.collaboratorPermissions.push({ accessLevel, user: user._id });
    }

    if (!alreadyCollaborator || shouldUpdatePermission || !existingPermission) {
      await project.save();
    }

    await ProjectInvite.deleteOne({ email, project: project._id });

    sendExistingUserProjectInviteEmail({
      email,
      inviterName: inviter?.name || "A teammate",
      projectTitle: project.title,
      sharedUrl: buildSharedProjectsUrl()
    }).catch((error) => {
      console.error("Failed to send project invite email", error.message);
    });
  } else {
    await ProjectInvite.findOneAndUpdate(
      { email, project: project._id },
      {
        $set: {
          accessLevel,
          invitedBy: req.user.id
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    sendNewUserProjectInviteEmail({
      email,
      inviterName: inviter?.name || "A teammate",
      projectTitle: project.title,
      registerUrl: buildRegisterUrl(email)
    }).catch((error) => {
      console.error("Failed to send project invite email", error.message);
    });
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
    throw httpError(404, PROJECT_MESSAGES.LEAVE_SHARED_NOT_FOUND);
  }

  project.collaborators = project.collaborators.filter(
    (collaboratorId) => String(collaboratorId) !== String(req.user.id)
  );
  project.collaboratorPermissions = project.collaboratorPermissions.filter(
    (permission) => String(permission.user) !== String(req.user.id)
  );

  await project.save();

  res.json({ message: PROJECT_MESSAGES.LEAVE_SHARED_SUCCESS });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!project) {
    throw httpError(404, PROJECT_MESSAGES.PROJECT_DELETE_OWNER_ONLY);
  }

  await Promise.all([
    AIChat.deleteMany({ project: project._id }),
    ImageContent.deleteMany({ project: project._id }),
    ProjectInvite.deleteMany({ project: project._id }),
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
    throw httpError(404, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
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
    throw httpError(400, PROJECT_MESSAGES.COLLABORATORS_MISSING_USERS);
  }

  return collaboratorIds;
}

function getObjectIdString(value) {
  return String(value?._id || value);
}

function buildFrontendUrl(pathname, params = {}) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const url = new URL(pathname, frontendOrigin);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function buildRegisterUrl(email) {
  return buildFrontendUrl("/register", { email });
}

function buildSharedProjectsUrl() {
  return buildFrontendUrl("/shared");
}

function serializeProjectForUser(project, userId) {
  const projectObject = project.toObject ? project.toObject() : project;
  const userIdString = String(userId);
  const ownerIdString = getObjectIdString(projectObject.owner);
  const collaboratorIds = (projectObject.collaborators || []).map(getObjectIdString);
  const accessLevel = getAccessLevelForUser(projectObject, userIdString);

  return {
    ...projectObject,
    currentUserRole:
      ownerIdString === userIdString ? PROJECT_ROLES.OWNER : PROJECT_ROLES.COLLABORATOR,
    accessLevel,
    canEdit: ownerIdString === userIdString || accessLevel === ACCESS_LEVELS.EDITOR,
    canManageSharing: ownerIdString === userIdString,
    canDelete: ownerIdString === userIdString,
    isSharedWithCurrentUser:
      ownerIdString !== userIdString && collaboratorIds.includes(userIdString)
  };
}

function getAccessLevelForUser(project, userId) {
  if (getObjectIdString(project.owner) === userId) {
    return ACCESS_LEVELS.EDITOR;
  }

  const permission = (project.collaboratorPermissions || []).find(
    (item) => getObjectIdString(item.user) === userId
  );

  if (permission?.accessLevel === ACCESS_LEVELS.VIEWER) {
    return ACCESS_LEVELS.VIEWER;
  }

  return (project.collaborators || []).some(
    (collaboratorId) => getObjectIdString(collaboratorId) === userId
  )
    ? ACCESS_LEVELS.EDITOR
    : null;
}

function requireProjectEditAccess(project, userId) {
  const projectObject = project.toObject ? project.toObject() : project;

  if (getAccessLevelForUser(projectObject, String(userId)) !== ACCESS_LEVELS.EDITOR) {
    throw httpError(403, PROJECT_MESSAGES.PROJECT_EDIT_FORBIDDEN);
  }
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
  requireProjectEditAccess,
  updateProject
};
