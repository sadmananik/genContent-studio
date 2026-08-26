const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../middleware/asyncHandler");
const { AUDIT_ACTION_TYPES, AUDIT_WORKSPACES } = require("../constants/projects");
const {
  findAccessibleProject,
  findProjectOwnedByUser,
  requireProjectEditAccess
} = require("./projectController");
const { snapshotMetadata } = require("../services/auditService");

const listProjectAuditHistory = asyncHandler(async (req, res) => {
  await findProjectOwnedByUser(req.params.projectId, req.user.id);

  const auditLogs = await AuditLog.find({ project: req.params.projectId })
    .populate("actor", "name email")
    .sort({ createdAt: -1 });

  res.json(auditLogs);
});

const createProjectAuditEvent = asyncHandler(async (req, res) => {
  const { actionType, metadata = {}, workspace } = req.body || {};

  if (!Object.values(AUDIT_ACTION_TYPES).includes(actionType)) {
    return res.status(400).json({ message: "Invalid audit action type." });
  }

  if (!Object.values(AUDIT_WORKSPACES).includes(workspace)) {
    return res.status(400).json({ message: "Invalid audit workspace." });
  }

  const project = await findAccessibleProject(req.params.projectId, req.user.id);
  requireProjectEditAccess(project, req.user.id);
  const auditLog = await AuditLog.create({
    actionType,
    actor: req.user.id,
    metadata: snapshotMetadata(metadata),
    project: project._id,
    workspace
  });

  res.status(201).json(auditLog);
});

module.exports = { createProjectAuditEvent, listProjectAuditHistory };
