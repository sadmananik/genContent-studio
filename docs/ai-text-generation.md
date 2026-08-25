# AI Text Generation (Text Workspace)

Secure OpenAI Chat Completions integration for GenContent Studio text projects.

## Environment (backend only)

In `packages/backend/.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-4o-mini
```

Never put `OPENAI_API_KEY` in frontend env vars (`NEXT_PUBLIC_*`).

## Endpoint

```http
POST /api/ai/generate-text
Authorization: Bearer <token>
Content-Type: application/json
```

### Request

```json
{
  "prompt": "Write a short blog intro about AI for small businesses."
}
```

### Success response

```json
{
  "text": "Generated content...",
  "model": "gpt-4o-mini-2024-07-18",
  "finishReason": "stop",
  "usage": { "prompt_tokens": 20, "completion_tokens": 80, "total_tokens": 100 },
  "id": "chatcmpl-..."
}
```

### Error response

```json
{
  "message": "prompt is required."
}
```

## Flow

Text Project → TipTap workspace prompt → Zustand `generateTextFromPrompt` → `POST /api/ai/generate-text` → OpenAI → response appears in the editor and is stored in AI history for real projects.

## Local demo note

When `DEV_ALLOW_NO_DB=true`, the AI route accepts the local skip-login bypass token so UI demos can call OpenAI without Mongo auth. Turn that off for real deployments.
