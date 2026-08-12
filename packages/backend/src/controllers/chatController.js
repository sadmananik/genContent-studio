const AIChat = require("../models/AIChat");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject } = require("./projectController");

const createChat = asyncHandler(async (req, res) => {
  const { project, prompt, response, contentType } = req.body;

  if (!project || !prompt || !response) {
    throw httpError(400, "Project, prompt, and response are required");
  }

  await findAccessibleProject(project, req.user.id);

  const chat = await AIChat.create({
    project,
    user: req.user.id,
    prompt,
    response,
    contentType
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
  toggleFavourite
};
