const express = require("express");
const { Types } = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const requireUser = require("../middleware/auth");
const { generateText } = require("../services/openaiService");
const {
  findAccessibleProject,
  requireProjectEditAccess
} = require("../controllers/projectController");

const router = express.Router();

router.post(
  "/generate-text",
  requireUser,
  asyncHandler(async (req, res) => {
    const { project, prompt } = req.body || {};

    if (project && Types.ObjectId.isValid(project)) {
      const accessibleProject = await findAccessibleProject(project, req.user.id);
      requireProjectEditAccess(accessibleProject, req.user.id);
    }

    const result = await generateText({ prompt });
    res.json(result);
  })
);

module.exports = router;
