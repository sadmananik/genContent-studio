const ImageCanvasSnapshot = require("../models/ImageCanvasSnapshot");
const AIChat = require("../models/AIChat");
const mongoose = require("mongoose");
const ImageContent = require("../models/ImageContent");
const { PROJECT_MESSAGES, PROJECT_TYPES } = require("../constants/projects");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject, requireProjectEditAccess } = require("./projectController");

const upsertImageContent = asyncHandler(async (req, res) => {
  const { project, imageUrl, generationPrompt, canvasState = {}, responseId = null } = req.body;

  if (!project) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_REQUIRED);
  }

  const accessibleProject = await findAccessibleProject(project, req.user.id);
  requireProjectEditAccess(accessibleProject, req.user.id);

  if (accessibleProject.type !== PROJECT_TYPES.IMAGE) {
    throw httpError(400, PROJECT_MESSAGES.IMAGE_CONTENT_TYPE_SAVE_REQUIRED);
  }

  if (responseId) {
    if (
      !mongoose.isValidObjectId(responseId) ||
      !(await AIChat.exists({ _id: responseId, project, contentType: "image" }))
    ) {
      throw httpError(400, "Image history entry does not belong to this project");
    }
    await ImageCanvasSnapshot.findOneAndUpdate(
      { project, responseId },
      { $set: { canvasState, generationPrompt } },
      { upsert: true, runValidators: true }
    );
  }

  const imageContent = await ImageContent.findOneAndUpdate(
    { project },
    { imageUrl, generationPrompt, canvasState, responseId, lastUpdatedBy: req.user.id },
    { new: true, runValidators: true, upsert: true }
  );

  res
    .status(200)
    .json(
      req.body.summaryOnly
        ? { id: imageContent.id, updatedAt: imageContent.updatedAt, responseId }
        : imageContent
    );
});

const getImageContent = asyncHandler(async (req, res) => {
  const accessibleProject = await findAccessibleProject(req.params.projectId, req.user.id);

  if (accessibleProject.type !== PROJECT_TYPES.IMAGE) {
    throw httpError(400, PROJECT_MESSAGES.IMAGE_CONTENT_TYPE_REQUIRED);
  }

  if (req.query.responseId) {
    const snapshot = await ImageCanvasSnapshot.findOne({
      project: req.params.projectId,
      responseId: req.query.responseId
    });
    if (snapshot) return res.json(snapshot);
    const legacy = await ImageContent.findOne({
      project: req.params.projectId,
      responseId: req.query.responseId
    });
    if (legacy) return res.json(legacy);
    throw httpError(404, PROJECT_MESSAGES.IMAGE_CONTENT_NOT_FOUND);
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
