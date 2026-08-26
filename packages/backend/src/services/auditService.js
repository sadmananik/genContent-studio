const AuditLog = require("../models/AuditLog");
const { AUDIT_ACTION_TYPES } = require("../constants/projects");

const MAX_PREVIEW_LENGTH = 500;
const DUPLICATE_PROMPT_WINDOW_MS = 2 * 60 * 1000;

async function recordAuditEvent({ project, actor, actionType, workspace, metadata = {} }) {
  return AuditLog.create({
    project,
    actor,
    actionType,
    workspace,
    metadata: snapshotMetadata(metadata)
  });
}

async function hasRecentPromptSubmission({ project, actor, workspace, prompt, contentType }) {
  const recentThreshold = new Date(Date.now() - DUPLICATE_PROMPT_WINDOW_MS);

  return Boolean(
    await AuditLog.exists({
      actionType: AUDIT_ACTION_TYPES.AI_PROMPT_SUBMITTED,
      actor,
      createdAt: { $gte: recentThreshold },
      "metadata.contentType": contentType,
      "metadata.prompt": preview(prompt),
      project,
      workspace
    })
  );
}

function preview(value) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > MAX_PREVIEW_LENGTH
    ? `${normalized.slice(0, MAX_PREVIEW_LENGTH - 3)}...`
    : normalized;
}

function snapshotMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      typeof value === "string" ? preview(value) : value
    ])
  );
}

module.exports = { hasRecentPromptSubmission, preview, recordAuditEvent, snapshotMetadata };
