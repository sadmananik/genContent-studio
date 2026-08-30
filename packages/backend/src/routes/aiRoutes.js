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
    const { project, prompt, action, imageData } = req.body || {};
    let accessibleProject;

    if (project && Types.ObjectId.isValid(project)) {
      accessibleProject = await findAccessibleProject(project, req.user.id);
      requireProjectEditAccess(accessibleProject, req.user.id);
      await recordAuditEvent({
        actionType: AUDIT_ACTION_TYPES.AI_PROMPT_SUBMITTED,
        actor: req.user.id,
        metadata: {
          action: action || "generate",
          contentType: AI_CONTENT_TYPES.IMAGE,
          hasImageInput: Boolean(imageData),
          prompt
        },
        project,
        workspace: AUDIT_WORKSPACES.IMAGE
      });
    }

    const result = await generateImage({ action, imageData, prompt });
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

    if (process.env.NODE_ENV === "e2e" && process.env.OPENAI_TEST_MODE === "true") {
      return res.json({
        text: "This is a deterministic Cypress test AI response.",
        model: "e2e-mock",
        finishReason: "stop",
        usage: null,
        id: "e2e-mock-response"
      });
    }

    const result = await generateText({ prompt });
    res.json(result);
  })
);

module.exports = router;
