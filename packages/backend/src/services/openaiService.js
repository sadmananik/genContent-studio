const OpenAI = require("openai");

// dall-e-3 was retired by OpenAI (May 2026). Use GPT Image models instead.
function getTextModel() {
  return process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
}

function getImageModel() {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
}

function requireApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    const error = new Error(
      "OPENAI_API_KEY is missing. Copy packages/backend/.env.example to .env and add your key."
    );
    error.statusCode = 500;
    error.code = "MISSING_API_KEY";
    throw error;
  }

  return apiKey.trim();
}

function createClient() {
  return new OpenAI({ apiKey: requireApiKey() });
}

function mapOpenAiError(error) {
  const statusCode = error.status || error.statusCode || 502;
  const mapped = new Error(
    error.message || "OpenAI API request failed."
  );
  mapped.statusCode = statusCode;
  mapped.code = error.code || "OPENAI_ERROR";
  mapped.details = error.error || undefined;
  return mapped;
}

async function verifyAuthentication() {
  try {
    const client = createClient();
    const modelsPage = await client.models.list();
    const models = [];

    for await (const model of modelsPage) {
      models.push(model.id);
      if (models.length >= 5) {
        break;
      }
    }

    return {
      authenticated: true,
      message: "OpenAI API authentication succeeded.",
      sampleModels: models
    };
  } catch (error) {
    throw mapOpenAiError(error);
  }
}

async function generateSampleText({
  prompt,
  systemPrompt = "You are a helpful content writing assistant for GenContent Studio.",
  model
} = {}) {
  if (!prompt || !String(prompt).trim()) {
    const error = new Error("prompt is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const selectedModel = model || getTextModel();

  try {
    const client = createClient();
    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(prompt).trim() }
      ]
    });

    const choice = completion.choices?.[0];

    return {
      model: completion.model,
      text: choice?.message?.content || "",
      finishReason: choice?.finish_reason || null,
      usage: completion.usage || null,
      id: completion.id
    };
  } catch (error) {
    throw mapOpenAiError(error);
  }
}

async function generateSampleImage({
  prompt,
  model,
  size = "1024x1024",
  quality = "low"
} = {}) {
  if (!prompt || !String(prompt).trim()) {
    const error = new Error("prompt is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const selectedModel = model || getImageModel();

  try {
    const client = createClient();
    const response = await client.images.generate({
      model: selectedModel,
      prompt: String(prompt).trim(),
      n: 1,
      size,
      quality
    });

    const image = response.data?.[0] || {};
    const b64Json = image.b64_json || null;
    const url =
      image.url ||
      (b64Json ? `data:image/png;base64,${b64Json}` : null);

    return {
      model: selectedModel,
      revisedPrompt: image.revised_prompt || null,
      url,
      b64Json
    };
  } catch (error) {
    throw mapOpenAiError(error);
  }
}

module.exports = {
  getTextModel,
  getImageModel,
  verifyAuthentication,
  generateSampleText,
  generateSampleImage
};
