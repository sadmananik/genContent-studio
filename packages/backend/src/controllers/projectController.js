const Project = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");

const createProject = asyncHandler(async (req, res) => {
  const { title, type, category = "Other", description = "", collaborators = [] } = req.body;

  if (!title || !type) {
    throw httpError(400, "Project title and type are required");
  }

  if (!["text", "image"].includes(type)) {
    throw httpError(400, "Project type must be text or image");
  }

  const project = await Project.create({
    title: title.trim(),
    type,
    category,
    description,
    owner: req.user.id,
    collaborators
  });

  res.status(201).json(project);
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
    if (req.body[field] !== undefined) {
      project[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  });

  await project.save();
  res.json(project);
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!project) {
    throw httpError(404, "Project not found or only owners can delete projects");
  }

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

module.exports = {
  createProject,
  deleteProject,
  findAccessibleProject,
  getProjectById,
  listProjects,
  updateProject
};
