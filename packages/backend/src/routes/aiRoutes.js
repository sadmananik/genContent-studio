const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const requireUser = require("../middleware/auth");
const { generateText } = require("../services/openaiService");

const router = express.Router();

/**
 * Allow local UI demos (DEV_ALLOW_NO_DB) to call AI without a real JWT.
 * Production / normal mode still requires requireUser.
 * The OpenAI API key always stays on the server either way.
 */
function requireUserOrLocalAi(req, res, next) {
  if (process.env.DEV_ALLOW_NO_DB === "true") {
    const authorizationHeader = req.header("Authorization") || "";
    const [, token] = authorizationHeader.split(" ");

    if (!token || token === "dev-bypass-token") {
      req.user = { id: "dev-local" };
      return next();
    }
  }

  return requireUser(req, res, next);
}

router.post(
  "/generate-text",
  requireUserOrLocalAi,
  asyncHandler(async (req, res) => {
    const { prompt, systemPrompt, model } = req.body || {};
    const result = await generateText({ prompt, systemPrompt, model });
    res.json(result);
  })
);

module.exports = router;
