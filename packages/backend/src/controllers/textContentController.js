const TextContent = require("../models/TextContent");
const { PROJECT_MESSAGES, PROJECT_TYPES } = require("../constants/projects");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject } = require("./projectController");

const upsertTextContent = asyncHandler(async (req, res) => {
  const { project, content = "" } = req.body;

  if (!project) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_REQUIRED);
  }

  const accessibleProject = await findAccessibleProject(project, req.user.id);

  if (accessibleProject.type !== PROJECT_TYPES.TEXT) {
    throw httpError(400, PROJECT_MESSAGES.TEXT_CONTENT_TYPE_SAVE_REQUIRED);
  }

  const textContent = await TextContent.findOneAndUpdate(
    { project },
    { content, lastUpdatedBy: req.user.id },
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json(textContent);
});

const getTextContent = asyncHandler(async (req, res) => {
  const accessibleProject = await findAccessibleProject(req.params.projectId, req.user.id);

  if (accessibleProject.type !== PROJECT_TYPES.TEXT) {
    throw httpError(400, PROJECT_MESSAGES.TEXT_CONTENT_TYPE_REQUIRED);
  }

  const textContent = await TextContent.findOne({ project: req.params.projectId }).populate(
    "lastUpdatedBy",
    "name email"
  );

  if (!textContent) {
    throw httpError(404, PROJECT_MESSAGES.TEXT_CONTENT_NOT_FOUND);
  }

  res.json(textContent);
});

module.exports = {
  getTextContent,
  upsertTextContent
};
