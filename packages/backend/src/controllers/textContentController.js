const TextContent = require("../models/TextContent");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject } = require("./projectController");

const upsertTextContent = asyncHandler(async (req, res) => {
  const { project, content = "" } = req.body;

  if (!project) {
    throw httpError(400, "Project is required");
  }

  await findAccessibleProject(project, req.user.id);

  const textContent = await TextContent.findOneAndUpdate(
    { project },
    { content, lastUpdatedBy: req.user.id },
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json(textContent);
});

const getTextContent = asyncHandler(async (req, res) => {
  await findAccessibleProject(req.params.projectId, req.user.id);

  const textContent = await TextContent.findOne({ project: req.params.projectId }).populate("lastUpdatedBy", "name email");

  if (!textContent) {
    throw httpError(404, "Text content not found");
  }

  res.json(textContent);
});

module.exports = {
  getTextContent,
  upsertTextContent
};
