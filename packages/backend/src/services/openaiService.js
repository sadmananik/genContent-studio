const OpenAI = require("openai");
const httpError = require("../utils/httpError");

function getTextModel() {
  return process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
}

function requireApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !String(apiKey).trim()) {
    throw httpError(
      500,
      "OPENAI_API_KEY is not configured on the server. Add it to packages/backend/.env."
    );
  }

  return String(apiKey).trim();
}

function createClient() {
  return new OpenAI({ apiKey: requireApiKey() });
}

function mapOpenAiError(error) {
  const statusCode = error.status || error.statusCode || 502;
  const message = error?.error?.message || error.message || "OpenAI API request failed.";
  const mapped = httpError(statusCode >= 400 && statusCode < 600 ? statusCode : 502, message);
  mapped.code = error.code || "OPENAI_ERROR";
  return mapped;
}

async function generateText({
  prompt,
  systemPrompt = "You are a helpful content writing assistant for GenContent Studio. Write clear, useful content the user can edit.",
  model = getTextModel()
} = {}) {
  const trimmedPrompt = String(prompt || "").trim();

  if (!trimmedPrompt) {
    throw httpError(400, "prompt is required.");
  }

  if (trimmedPrompt.length > 4000) {
    throw httpError(400, "prompt must be 4000 characters or fewer.");
  }

  try {
    const client = createClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: trimmedPrompt }
      ]
    });

    const choice = completion.choices?.[0];
    const text = choice?.message?.content?.trim() || "";

    if (!text) {
      throw httpError(502, "OpenAI returned an empty response.");
    }

    return {
      text,
      model: completion.model || model,
      finishReason: choice?.finish_reason || null,
      usage: completion.usage || null,
      id: completion.id || null
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw mapOpenAiError(error);
  }
}

module.exports = {
  generateText,
  getTextModel
};
