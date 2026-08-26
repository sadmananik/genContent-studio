const AIChat = require("../models/AIChat");
const Project = require("../models/Project");
const User = require("../models/User");
const {
  AI_CONTENT_TYPES,
  AI_CONTENT_TYPE_VALUES,
  PROJECT_FIELD_LABELS,
  PROJECT_MESSAGES
} = require("../constants/projects");
const { AUDIT_ACTION_TYPES, AUDIT_WORKSPACES } = require("../constants/projects");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { findAccessibleProject, requireProjectEditAccess } = require("./projectController");
const { normalizeString, requireTrimmedString } = require("../utils/validation");
const { emitProjectEvent } = require("../services/collaborationServer");
const {
  hasRecentPromptSubmission,
  preview,
  recordAuditEvent
} = require("../services/auditService");

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

  const accessibleProject = await findAccessibleProject(project, req.user.id);
  requireProjectEditAccess(accessibleProject, req.user.id);

  const chat = await AIChat.create({
    project,
    user: req.user.id,
    prompt: normalizedPrompt,
    response: normalizedResponse,
    contentType: normalizedContentType
  });

  const workspace =
    normalizedContentType === AI_CONTENT_TYPES.IMAGE
      ? AUDIT_WORKSPACES.IMAGE
      : AUDIT_WORKSPACES.TEXT;
  const promptAlreadySubmitted = await hasRecentPromptSubmission({
    actor: req.user.id,
    contentType: normalizedContentType,
    project,
    prompt: normalizedPrompt,
    workspace
  });

  if (!promptAlreadySubmitted) {
    await recordAuditEvent({
      actionType: AUDIT_ACTION_TYPES.AI_PROMPT_SUBMITTED,
      actor: req.user.id,
      metadata: {
        aiChatId: String(chat._id),
        prompt: normalizedPrompt,
        contentType: normalizedContentType
      },
      project,
      workspace
    });
  }

  await recordAuditEvent({
    actionType: AUDIT_ACTION_TYPES.AI_RESPONSE_GENERATED,
    actor: req.user.id,
    metadata: {
      aiChatId: String(chat._id),
      prompt: normalizedPrompt,
      contentType: normalizedContentType,
      promptAlreadySubmitted
    },
    project,
    workspace
  });

  emitProjectEvent(
    project,
    "ai:response-created",
    { projectId: String(project), chat },
    { excludeUserId: req.user.id }
  );

  res.status(201).json(chat);
});

const listProjectChats = asyncHandler(async (req, res) => {
  await findAccessibleProject(req.params.projectId, req.user.id);

  const chats = await AIChat.find({ project: req.params.projectId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(chats);
});

const listFavouriteChats = asyncHandler(async (req, res) => {
  const accessibleProjectIds = await Project.find({
    $or: [{ owner: req.user.id }, { collaborators: req.user.id }]
  }).distinct("_id");

  const chats = await AIChat.find({
    isFavourite: true,
    project: { $in: accessibleProjectIds }
  })
    .populate(
      "project",
      "title type category owner collaborators collaboratorPermissions updatedAt"
    )
    .populate("user", "name email")
    .sort({ updatedAt: -1, createdAt: -1 });

  res.json(chats);
});

const toggleFavourite = asyncHandler(async (req, res) => {
  const chat = await AIChat.findById(req.params.id);

  if (!chat) {
    throw httpError(404, PROJECT_MESSAGES.CHAT_NOT_FOUND);
  }

  const accessibleProject = await findAccessibleProject(chat.project, req.user.id);
  requireProjectEditAccess(accessibleProject, req.user.id);

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

  const accessibleProject = await findAccessibleProject(chat.project, req.user.id);
  requireProjectEditAccess(accessibleProject, req.user.id);
  const previousPrompt = chat.prompt;
  const previousResponse = chat.response;

  ["prompt", "response"].forEach((field) => {
    if (req.body[field] !== undefined) {
      chat[field] =
        field === "prompt"
          ? requireTrimmedString(req.body[field], PROJECT_FIELD_LABELS.PROMPT)
          : requireTrimmedString(req.body[field], PROJECT_FIELD_LABELS.RESPONSE);
    }
  });

  await chat.save();
  const workspace =
    chat.contentType === AI_CONTENT_TYPES.IMAGE ? AUDIT_WORKSPACES.IMAGE : AUDIT_WORKSPACES.TEXT;

  if (chat.prompt !== previousPrompt) {
    await recordAuditEvent({
      actionType: AUDIT_ACTION_TYPES.AI_PROMPT_UPDATED,
      actor: req.user.id,
      metadata: {
        aiChatId: String(chat._id),
        contentType: chat.contentType,
        newPrompt: chat.prompt,
        previousPrompt
      },
      project: chat.project,
      workspace
    });
  }

  if (chat.response !== previousResponse) {
    await recordAuditEvent({
      actionType: AUDIT_ACTION_TYPES.AI_RESPONSE_UPDATED,
      actor: req.user.id,
      metadata: {
        aiChatId: String(chat._id),
        contentType: chat.contentType,
        newResponsePreview: preview(chat.response),
        previousResponsePreview: preview(previousResponse),
        prompt: chat.prompt
      },
      project: chat.project,
      workspace
    });
  }
  emitProjectEvent(chat.project, "ai:response-updated", { projectId: String(chat.project), chat });
  res.json(chat);
});

const deleteChat = asyncHandler(async (req, res) => {
  const chat = await AIChat.findById(req.params.id);

  if (!chat) {
    throw httpError(404, PROJECT_MESSAGES.CHAT_NOT_FOUND);
  }

  const accessibleProject = await findAccessibleProject(chat.project, req.user.id);
  requireProjectEditAccess(accessibleProject, req.user.id);
  const actor = await User.findById(req.user.id).select("name email");
  const workspace =
    chat.contentType === AI_CONTENT_TYPES.IMAGE ? AUDIT_WORKSPACES.IMAGE : AUDIT_WORKSPACES.TEXT;
  const auditMetadata = {
    aiChatId: String(chat._id),
    contentType: chat.contentType,
    deletedPrompt: chat.prompt,
    deletedResponsePreview: preview(chat.response),
    prompt: chat.prompt
  };

  await recordAuditEvent({
    actionType: AUDIT_ACTION_TYPES.AI_PROMPT_DELETED,
    actor: req.user.id,
    metadata: auditMetadata,
    project: chat.project,
    workspace
  });
  await recordAuditEvent({
    actionType: AUDIT_ACTION_TYPES.AI_RESPONSE_DELETED,
    actor: req.user.id,
    metadata: auditMetadata,
    project: chat.project,
    workspace
  });
  await chat.deleteOne();

  emitProjectEvent(
    chat.project,
    "ai:response-deleted",
    {
      chatId: String(chat._id),
      projectId: String(chat.project),
      prompt: chat.prompt,
      user: actor ? { id: String(actor._id), name: actor.name, email: actor.email } : null
    },
    { excludeUserId: req.user.id }
  );

  res.status(204).send();
});

module.exports = {
  createChat,
  deleteChat,
  listFavouriteChats,
  listProjectChats,
  toggleFavourite,
  updateChat
};
