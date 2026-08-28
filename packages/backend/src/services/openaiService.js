const OpenAI = require("openai");
const { toFile } = require("openai");
const httpError = require("../utils/httpError");

const DEFAULT_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";
const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful content writing assistant for GenContent Studio. Write clear, useful content the user can edit.";
const MAX_PROMPT_LENGTH = 4000;
const MAX_COMPLETION_TOKENS = 900;
const MAX_IMAGE_DATA_BYTES = 8 * 1024 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,/i;

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

function parseImageDataUrl(imageData) {
  const trimmed = String(imageData || "").trim();

  if (!trimmed) {
    return null;
  }

  if (!IMAGE_DATA_URL_PATTERN.test(trimmed)) {
    throw httpError(400, "imageData must be a PNG, JPEG, or WebP data URL.");
  }

  const [header, base64Payload = ""] = trimmed.split(",");
  const mimeMatch = header.match(/^data:(image\/[a-z0-9.+-]+);base64$/i);
  const mimeType = (mimeMatch?.[1] || "image/png").toLowerCase();
  const normalizedMime = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
  const buffer = Buffer.from(base64Payload, "base64");

  if (!buffer.length) {
    throw httpError(400, "imageData is empty or invalid.");
  }

  if (buffer.length > MAX_IMAGE_DATA_BYTES) {
    throw httpError(400, "imageData exceeds the maximum allowed size of 8MB.");
  }

  const extension = normalizedMime.split("/")[1] || "png";

  return {
    buffer,
    filename: `canvas.${extension === "jpeg" ? "jpg" : extension}`,
    mimeType: normalizedMime
  };
}

function shouldFallbackToPromptOnly(error) {
  const statusCode = error.status || error.statusCode || 0;
  const message = String(error?.error?.message || error.message || "").toLowerCase();

  if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    return false;
  }

  return (
    statusCode === 400 ||
    statusCode === 404 ||
    statusCode === 422 ||
    message.includes("unsupported") ||
    message.includes("invalid value") ||
    message.includes("not support") ||
    message.includes("does not support") ||
    message.includes("image edit") ||
    message.includes("mimetype")
  );
}

function buildImageResult(response, model) {
  const image = response.data?.[0];
  return {
    created: response.created || null,
    image,
    model: response.model || model,
    revisedPrompt: image?.revised_prompt || null
  };
}

async function resolveImageUrl(image) {
  const imageUrl = image?.b64_json
    ? `data:image/png;base64,${image.b64_json}`
    : await fetchImageDataUrl(image?.url);

  if (!imageUrl) {
    throw httpError(502, "OpenAI returned no image data.");
  }

  return imageUrl;
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

async function generateImageFromPrompt({ prompt, model }) {
  const response = await createClient().images.generate({
    model,
    prompt,
    size: "1024x1024"
  });
  const { image, ...meta } = buildImageResult(response, model);
  const imageUrl = await resolveImageUrl(image);

  return {
    ...meta,
    imageUrl,
    usedImageInput: false
  };
}

async function editImageFromPrompt({ prompt, imageData, model, action = "generate" }) {
  const parsedImage = parseImageDataUrl(imageData);

  if (!parsedImage) {
    throw httpError(400, "imageData is required for image-assisted generation.");
  }

  const imageFile = await toFile(parsedImage.buffer, parsedImage.filename, {
    type: parsedImage.mimeType
  });
  const lowFidelityActions = new Set(["regenerate", "variation", "change-style"]);
  const editPayload = {
    model,
    image: imageFile,
    prompt,
    size: "1024x1024"
  };

  if (String(model || "").startsWith("gpt-image")) {
    editPayload.input_fidelity = lowFidelityActions.has(String(action || "")) ? "low" : "high";
  }

  const response = await createClient().images.edit(editPayload);
  const { image, ...meta } = buildImageResult(response, model);
  const imageUrl = await resolveImageUrl(image);

  return {
    ...meta,
    imageUrl,
    usedImageInput: true
  };
}

async function generateImage({
  prompt,
  model = getImageModel(),
  imageData,
  action = "generate"
} = {}) {
  const trimmedPrompt = String(prompt || "").trim();
  const normalizedAction = String(action || "generate").trim() || "generate";

  if (!trimmedPrompt) {
    throw httpError(400, "prompt is required.");
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    throw httpError(400, `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  }

  const hasImageInput = Boolean(String(imageData || "").trim());

  if (hasImageInput) {
    parseImageDataUrl(imageData);
  }

  try {
    if (hasImageInput) {
      try {
        const result = await editImageFromPrompt({
          action: normalizedAction,
          prompt: trimmedPrompt,
          imageData,
          model
        });

        return {
          ...result,
          action: normalizedAction
        };
      } catch (error) {
        if (!shouldFallbackToPromptOnly(error)) {
          if (error.statusCode) {
            throw error;
          }

          throw mapOpenAiError(error);
        }

        const result = await generateImageFromPrompt({
          prompt: trimmedPrompt,
          model
        });

        return {
          ...result,
          action: normalizedAction,
          imageInputFallback: true
        };
      }
    }

    const result = await generateImageFromPrompt({
      prompt: trimmedPrompt,
      model
    });

    return {
      ...result,
      action: normalizedAction
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
