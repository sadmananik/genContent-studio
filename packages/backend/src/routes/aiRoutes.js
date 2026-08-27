const express = require("express");
const { Types } = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const requireUser = require("../middleware/auth");
const { generateImage, generateText } = require("../services/openaiService");
const {
  findAccessibleProject,
  requireProjectEditAccess
} = require("../controllers/projectController");
const { AI_CONTENT_TYPES, AUDIT_ACTION_TYPES, AUDIT_WORKSPACES } = require("../constants/projects");
const { recordAuditEvent } = require("../services/auditService");

const router = express.Router();

router.post(
  "/generate-image",
  requireUser,
  asyncHandler(async (req, res) => {
    const { project, prompt } = req.body || {};
    let accessibleProject;

    if (project && Types.ObjectId.isValid(project)) {
      accessibleProject = await findAccessibleProject(project, req.user.id);
      requireProjectEditAccess(accessibleProject, req.user.id);
      await recordAuditEvent({
        actionType: AUDIT_ACTION_TYPES.AI_PROMPT_SUBMITTED,
        actor: req.user.id,
        metadata: { contentType: AI_CONTENT_TYPES.IMAGE, prompt },
        project,
        workspace: AUDIT_WORKSPACES.IMAGE
      });
    }

    const result = await generateImage({ prompt });
    res.json(result);
  })
);

router.post(
  "/generate-text",
  requireUser,
  asyncHandler(async (req, res) => {
    const { project, prompt } = req.body || {};
    let accessibleProject;

    if (project && Types.ObjectId.isValid(project)) {
      accessibleProject = await findAccessibleProject(project, req.user.id);
      requireProjectEditAccess(accessibleProject, req.user.id);
      await recordAuditEvent({
        actionType: AUDIT_ACTION_TYPES.AI_PROMPT_SUBMITTED,
        actor: req.user.id,
        metadata: { contentType: AI_CONTENT_TYPES.TEXT, prompt },
        project,
        workspace: AUDIT_WORKSPACES.TEXT
      });
    }

    const result = await generateText({ prompt });
    res.json(result);
  })
);

module.exports = router;
