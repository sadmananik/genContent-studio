const OpenAI = require("openai");
const httpError = require("../utils/httpError");

const DEFAULT_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";
const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful content writing assistant for GenContent Studio. Write clear, useful content the user can edit.";
const MAX_PROMPT_LENGTH = 4000;
const MAX_COMPLETION_TOKENS = 900;

let openAiClient;

function getTextModel() {
  return String(process.env.OPENAI_TEXT_MODEL || DEFAULT_TEXT_MODEL).trim();
}

function getImageModel() {
  return String(process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL).trim();
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
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: requireApiKey() });
  }

  return openAiClient;
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
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  model = getTextModel()
} = {}) {
  const trimmedPrompt = String(prompt || "").trim();

  if (!trimmedPrompt) {
    throw httpError(400, "prompt is required.");
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    throw httpError(400, `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  }

  try {
    const client = createClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: trimmedPrompt }
      ],
      max_tokens: MAX_COMPLETION_TOKENS
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

async function generateImage({ prompt, model = getImageModel() } = {}) {
  const trimmedPrompt = String(prompt || "").trim();

  if (!trimmedPrompt) {
    throw httpError(400, "prompt is required.");
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    throw httpError(400, `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  }

  try {
    const response = await createClient().images.generate({
      model,
      prompt: trimmedPrompt,
      size: "1024x1024"
    });
    const image = response.data?.[0];
    const imageUrl = image?.b64_json
      ? `data:image/png;base64,${image.b64_json}`
      : await fetchImageDataUrl(image?.url);

    if (!imageUrl) {
      throw httpError(502, "OpenAI returned no image data.");
    }

    return {
      created: response.created || null,
      imageUrl,
      model: response.model || model,
      revisedPrompt: image.revised_prompt || null
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw mapOpenAiError(error);
  }
}

async function fetchImageDataUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw httpError(502, "Generated image could not be downloaded.");
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${imageBuffer.toString("base64")}`;
}

module.exports = {
  generateImage,
  generateText,
  getImageModel,
  getTextModel
};
