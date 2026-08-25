const ImageContent = require("../models/ImageContent");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject } = require("./projectController");

const upsertImageContent = asyncHandler(async (req, res) => {
  const { project, imageUrl, generationPrompt, canvasState = {} } = req.body;

  if (!project) {
    throw httpError(400, "Project is required");
  }

  const accessibleProject = await findAccessibleProject(project, req.user.id);

  if (accessibleProject.type !== "image") {
    throw httpError(400, "Image content can only be saved for image projects");
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

  if (accessibleProject.type !== "image") {
    throw httpError(400, "Image content is only available for image projects");
  }

  const imageContent = await ImageContent.findOne({ project: req.params.projectId }).populate(
    "lastUpdatedBy",
    "name email"
  );

  if (!imageContent) {
    throw httpError(404, "Image content not found");
  }

  res.json(imageContent);
});

module.exports = {
  getImageContent,
  upsertImageContent
};
