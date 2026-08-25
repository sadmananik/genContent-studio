const AIChat = require("../models/AIChat");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject } = require("./projectController");
const { normalizeString, requireTrimmedString } = require("../utils/validation");

const VALID_CONTENT_TYPES = ["text", "image", "other"];

const createChat = asyncHandler(async (req, res) => {
  const { project, prompt, response, contentType = "text" } = req.body;

  if (!project) {
    throw httpError(400, "Project is required");
  }

  const normalizedPrompt = requireTrimmedString(prompt, "Prompt");
  const normalizedResponse = requireTrimmedString(response, "Response");
  const normalizedContentType = normalizeString(contentType, "text") || "text";

  if (!VALID_CONTENT_TYPES.includes(normalizedContentType)) {
    throw httpError(400, "Content type must be text, image, or other");
  }

  await findAccessibleProject(project, req.user.id);

  const chat = await AIChat.create({
    project,
    user: req.user.id,
    prompt: normalizedPrompt,
    response: normalizedResponse,
    contentType: normalizedContentType
  });

  res.status(201).json(chat);
});

const listProjectChats = asyncHandler(async (req, res) => {
  await findAccessibleProject(req.params.projectId, req.user.id);

  const chats = await AIChat.find({ project: req.params.projectId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(chats);
});

const toggleFavourite = asyncHandler(async (req, res) => {
  const chat = await AIChat.findById(req.params.id);

  if (!chat) {
    throw httpError(404, "Chat not found");
  }

  await findAccessibleProject(chat.project, req.user.id);

  chat.isFavourite =
    req.body.isFavourite === undefined ? !chat.isFavourite : Boolean(req.body.isFavourite);
  await chat.save();

  res.json(chat);
});

const updateChat = asyncHandler(async (req, res) => {
  const chat = await AIChat.findById(req.params.id);

  if (!chat) {
    throw httpError(404, "Chat not found");
  }

  await findAccessibleProject(chat.project, req.user.id);

  ["prompt", "response"].forEach((field) => {
    if (req.body[field] !== undefined) {
      chat[field] =
        field === "prompt"
          ? requireTrimmedString(req.body[field], "Prompt")
          : requireTrimmedString(req.body[field], "Response");
    }
  });

  await chat.save();
  res.json(chat);
});

const deleteChat = asyncHandler(async (req, res) => {
  const chat = await AIChat.findById(req.params.id);

  if (!chat) {
    throw httpError(404, "Chat not found");
  }

  await findAccessibleProject(chat.project, req.user.id);
  await chat.deleteOne();

  res.status(204).send();
});

module.exports = {
  createChat,
  deleteChat,
  listProjectChats,
  toggleFavourite,
  updateChat
};
