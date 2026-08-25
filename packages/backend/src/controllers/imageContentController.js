const ImageContent = require("../models/ImageContent");
const { PROJECT_MESSAGES, PROJECT_TYPES } = require("../constants/projects");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject, requireProjectEditAccess } = require("./projectController");

const upsertImageContent = asyncHandler(async (req, res) => {
  const { project, imageUrl, generationPrompt, canvasState = {} } = req.body;

  if (!project) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_REQUIRED);
  }

  const accessibleProject = await findAccessibleProject(project, req.user.id);
  requireProjectEditAccess(accessibleProject, req.user.id);

  if (accessibleProject.type !== PROJECT_TYPES.IMAGE) {
    throw httpError(400, PROJECT_MESSAGES.IMAGE_CONTENT_TYPE_SAVE_REQUIRED);
  }

  const imageContent = await ImageContent.findOneAndUpdate(
    { project },
    { imageUrl, generationPrompt, canvasState, lastUpdatedBy: req.user.id },
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json(imageContent);
});

const getImageContent = asyncHandler(async (req, res) => {
  const accessibleProject = await findAccessibleProject(req.params.projectId, req.user.id);

  if (accessibleProject.type !== PROJECT_TYPES.IMAGE) {
    throw httpError(400, PROJECT_MESSAGES.IMAGE_CONTENT_TYPE_REQUIRED);
  }

  const imageContent = await ImageContent.findOne({ project: req.params.projectId }).populate(
    "lastUpdatedBy",
    "name email"
  );

  if (!imageContent) {
    throw httpError(404, PROJECT_MESSAGES.IMAGE_CONTENT_NOT_FOUND);
  }

  res.json(imageContent);
});

module.exports = {
  getImageContent,
  upsertImageContent
};
