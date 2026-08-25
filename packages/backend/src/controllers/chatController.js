const AIChat = require("../models/AIChat");
const {
  AI_CONTENT_TYPES,
  AI_CONTENT_TYPE_VALUES,
  PROJECT_FIELD_LABELS,
  PROJECT_MESSAGES
} = require("../constants/projects");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject } = require("./projectController");
const { normalizeString, requireTrimmedString } = require("../utils/validation");

const createChat = asyncHandler(async (req, res) => {
  const { project, prompt, response, contentType = AI_CONTENT_TYPES.TEXT } = req.body;

  if (!project) {
    throw httpError(400, PROJECT_MESSAGES.PROJECT_REQUIRED);
  }

  const normalizedPrompt = requireTrimmedString(prompt, PROJECT_FIELD_LABELS.PROMPT);
  const normalizedResponse = requireTrimmedString(response, PROJECT_FIELD_LABELS.RESPONSE);
  const normalizedContentType =
    normalizeString(contentType, AI_CONTENT_TYPES.TEXT) || AI_CONTENT_TYPES.TEXT;

  if (!AI_CONTENT_TYPE_VALUES.includes(normalizedContentType)) {
    throw httpError(400, PROJECT_MESSAGES.CONTENT_TYPE_INVALID);
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
    throw httpError(404, PROJECT_MESSAGES.CHAT_NOT_FOUND);
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
    throw httpError(404, PROJECT_MESSAGES.CHAT_NOT_FOUND);
  }

  await findAccessibleProject(chat.project, req.user.id);

  ["prompt", "response"].forEach((field) => {
    if (req.body[field] !== undefined) {
      chat[field] =
        field === "prompt"
          ? requireTrimmedString(req.body[field], PROJECT_FIELD_LABELS.PROMPT)
          : requireTrimmedString(req.body[field], PROJECT_FIELD_LABELS.RESPONSE);
    }
  });

  await chat.save();
  res.json(chat);
});

const deleteChat = asyncHandler(async (req, res) => {
  const chat = await AIChat.findById(req.params.id);

  if (!chat) {
    throw httpError(404, PROJECT_MESSAGES.CHAT_NOT_FOUND);
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
