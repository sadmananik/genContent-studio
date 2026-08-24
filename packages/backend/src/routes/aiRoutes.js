const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const requireUser = require("../middleware/auth");
const { generateText } = require("../services/openaiService");

const router = express.Router();

router.post(
  "/generate-text",
  requireUser,
  asyncHandler(async (req, res) => {
    const { prompt, systemPrompt, model } = req.body || {};
    const result = await generateText({ prompt, systemPrompt, model });
    res.json(result);
  })
);

module.exports = router;
