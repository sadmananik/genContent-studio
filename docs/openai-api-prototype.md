# OpenAI API Integration Prototype

Sprint investigation for GenContent Studio: authenticate with OpenAI, generate sample text (Chat Completions), and generate a sample image (Images API).

Official docs:

- [OpenAI Quickstart](https://platform.openai.com/docs/quickstart)
- [Chat Completions](https://platform.openai.com/docs/api-reference/chat)
- [Image Generation](https://platform.openai.com/docs/api-reference/images)

## Setup

1. Create an API key in the [OpenAI Platform](https://platform.openai.com/api-keys).
2. Copy the backend env file and paste your key:

```bash
cp packages/backend/.env.example packages/backend/.env
```

3. Install dependencies from the repo root (`yarn install`).
4. Start the stack (`yarn dev`) or only the backend (`yarn workspace @gencontent/backend dev`).

Never commit `.env` or the API key.

## Authentication

OpenAI authenticates with a Bearer token:

```http
Authorization: Bearer YOUR_OPENAI_API_KEY
```

Our backend reads `OPENAI_API_KEY` and uses the official Node SDK (`openai`). The key stays on the server; the browser never sees it.

### Verify connectivity

```http
GET http://localhost:4000/api/openai/auth
```

Successful response:

```json
{
  "authenticated": true,
  "message": "OpenAI API authentication succeeded.",
  "sampleModels": ["gpt-4o-mini", "gpt-image-1-mini"]
}
```

Failed response (missing/invalid key):

```json
{
  "error": {
    "message": "Incorrect API key provided: ...",
    "code": "invalid_api_key",
    "details": {}
  }
}
```

## Sample text generation (Chat Completions)

Endpoint used by the prototype:

```http
POST http://localhost:4000/api/openai/text
Content-Type: application/json
```

### Request body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `prompt` | string | yes | User content to generate from |
| `systemPrompt` | string | no | Assistant behaviour instructions |
| `model` | string | no | Defaults to `OPENAI_TEXT_MODEL` / `gpt-4o-mini` |

Example:

```json
{
  "prompt": "Write a short LinkedIn post about AI content tools.",
  "systemPrompt": "You are a concise marketing copywriter.",
  "model": "gpt-4o-mini"
}
```

### Upstream OpenAI request shape

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a concise marketing copywriter."
    },
    {
      "role": "user",
      "content": "Write a short LinkedIn post about AI content tools."
    }
  ]
}
```

### Prototype response

```json
{
  "model": "gpt-4o-mini",
  "text": "AI content tools help teams draft faster...",
  "finishReason": "stop",
  "usage": {
    "prompt_tokens": 28,
    "completion_tokens": 64,
    "total_tokens": 92
  },
  "id": "chatcmpl-..."
}
```

## Sample image generation (Images API)

Endpoint used by the prototype:

```http
POST http://localhost:4000/api/openai/image
Content-Type: application/json
```

### Request body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `prompt` | string | yes | Image description |
| `model` | string | no | Defaults to `OPENAI_IMAGE_MODEL` / `gpt-image-1-mini` |
| `size` | string | no | Default `1024x1024` |
| `quality` | string | no | Default `low` (`low`, `medium`, `high`, or `auto`) |

Example:

```json
{
  "prompt": "A clean workspace desk with a laptop showing a content editor, soft daylight, flat illustration",
  "model": "gpt-image-1-mini",
  "size": "1024x1024",
  "quality": "low"
}
```

### Upstream OpenAI request shape

```json
{
  "model": "gpt-image-1-mini",
  "prompt": "A clean workspace desk with a laptop showing a content editor, soft daylight, flat illustration",
  "n": 1,
  "size": "1024x1024",
  "quality": "low"
}
```

### Prototype response

GPT Image models usually return base64 instead of a hosted URL. The prototype maps that into a data URL for the UI:

```json
{
  "model": "gpt-image-1-mini",
  "revisedPrompt": null,
  "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "b64Json": "iVBORw0KGgoAAAANSUhEUg..."
}
```

Note: `dall-e-3` was retired by OpenAI in May 2026. Use `gpt-image-1-mini`, `gpt-image-1`, or `gpt-image-2`. Later sprints should store generated images with project data.

If you still see `The model 'dall-e-3' does not exist`, check Windows environment variables for an old `OPENAI_IMAGE_MODEL=dall-e-3` value. The backend `.env` is configured to override that for local development.

## Manual test checklist

1. `GET /health` returns `{ "status": "ok" }`.
2. `GET /api/openai/auth` returns `authenticated: true`.
3. `POST /api/openai/text` returns non-empty `text`.
4. `POST /api/openai/image` returns an image `url`.
5. Open the frontend prototype page at `/openai-prototype` and run the same flows in the UI.

## Notes for later sprints

- Keep AI calls inside `packages/backend/src/services` so providers can change without rewriting the UI.
- Persist prompts/responses against projects (Sprint AI text / image backlog items).
- Prefer cheaper models (`gpt-4o-mini`) during development to control API spend.
- Add rate limiting and user-facing error messages before demo day.
