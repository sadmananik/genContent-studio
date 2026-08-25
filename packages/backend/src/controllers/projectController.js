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
    collaborators: normalizedCollaborators
  });

  const createdProject = await Project.findById(project._id)
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  res.status(201).json(createdProject);
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user.id }, { collaborators: req.user.id }]
  })
    .populate("owner", "name email")
    .populate("collaborators", "name email")
    .sort({ updatedAt: -1 });

  res.json(projects);
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.params.id, req.user.id);
  res.json(project);
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
    project.collaborators = await validateCollaborators(
      req.body.collaborators,
      getObjectIdString(project.owner)
    );
  }

  await project.save();
  const updatedProject = await Project.findById(project._id)
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  res.json(updatedProject);
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
    await project.save();
  }

  const updatedProject = await Project.findById(project._id)
    .populate("owner", "name email")
    .populate("collaborators", "name email");

  res.json(updatedProject);
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

module.exports = {
  createProject,
  deleteProject,
  findAccessibleProject,
  getProjectById,
  inviteProjectCollaborator,
  listProjects,
  updateProject
};
