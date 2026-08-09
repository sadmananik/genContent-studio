const express = require("express");
const {
  verifyAuthentication,
  generateSampleText,
  generateSampleImage
} = require("../services/openaiService");

const router = express.Router();

function sendError(res, error) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: error.message,
      code: error.code || "INTERNAL_ERROR",
      details: error.details
    }
  });
}

router.get("/auth", async (req, res) => {
  try {
    const result = await verifyAuthentication();
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/text", async (req, res) => {
  try {
    const { prompt, systemPrompt, model } = req.body || {};
    const result = await generateSampleText({ prompt, systemPrompt, model });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/image", async (req, res) => {
  try {
    const { prompt, model, size, quality } = req.body || {};
    const result = await generateSampleImage({ prompt, model, size, quality });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
