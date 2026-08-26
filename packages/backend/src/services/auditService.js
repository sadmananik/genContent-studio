const AuditLog = require("../models/AuditLog");

const MAX_PREVIEW_LENGTH = 500;

async function recordAuditEvent({ project, actor, actionType, workspace, metadata = {} }) {
  return AuditLog.create({
    project,
    actor,
    actionType,
    workspace,
    metadata: snapshotMetadata(metadata)
  });
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

module.exports = { preview, recordAuditEvent, snapshotMetadata };
