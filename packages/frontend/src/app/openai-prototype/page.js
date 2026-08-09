"use client";

import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || `Request failed (${response.status})`);
  }

  return data;
}

export default function OpenAiPrototypePage() {
  const [authResult, setAuthResult] = useState(null);
  const [textPrompt, setTextPrompt] = useState(
    "Write a 2-sentence product blurb for GenContent Studio."
  );
  const [textResult, setTextResult] = useState(null);
  const [imagePrompt, setImagePrompt] = useState(
    "Minimal flat illustration of a content studio dashboard on a laptop, soft teal accents"
  );
  const [imageResult, setImageResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(action, fn) {
    setBusy(action);
    setError("");

    try {
      await fn();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="page-shell">
      <section className="workspace prototype">
        <div className="intro">
          <p className="eyebrow">Sprint prototype</p>
          <h1>OpenAI API check</h1>
          <p>
            Verify authentication, generate sample text with Chat Completions,
            and generate a sample image. API key stays on the backend only.
          </p>
          <p className="prototype-meta">Backend: {API_BASE_URL}</p>
        </div>

        {error ? <p className="prototype-error">{error}</p> : null}

        <div className="prototype-panels">
          <article>
            <h2>1. Authentication</h2>
            <p>Calls <code>GET /api/openai/auth</code> and lists a few models.</p>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() =>
                run("auth", async () => {
                  const data = await requestJson("/api/openai/auth");
                  setAuthResult(data);
                })
              }
            >
              {busy === "auth" ? "Checking..." : "Test authentication"}
            </button>
            {authResult ? (
              <pre>{JSON.stringify(authResult, null, 2)}</pre>
            ) : null}
          </article>

          <article>
            <h2>2. Sample text</h2>
            <label htmlFor="text-prompt">Prompt</label>
            <textarea
              id="text-prompt"
              rows={4}
              value={textPrompt}
              onChange={(event) => setTextPrompt(event.target.value)}
            />
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() =>
                run("text", async () => {
                  const data = await requestJson("/api/openai/text", {
                    method: "POST",
                    body: JSON.stringify({ prompt: textPrompt })
                  });
                  setTextResult(data);
                })
              }
            >
              {busy === "text" ? "Generating..." : "Generate sample text"}
            </button>
            {textResult ? (
              <div className="prototype-output">
                <p>{textResult.text}</p>
                <pre>{JSON.stringify(textResult, null, 2)}</pre>
              </div>
            ) : null}
          </article>

          <article>
            <h2>3. Sample image</h2>
            <label htmlFor="image-prompt">Prompt</label>
            <textarea
              id="image-prompt"
              rows={4}
              value={imagePrompt}
              onChange={(event) => setImagePrompt(event.target.value)}
            />
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() =>
                run("image", async () => {
                  const data = await requestJson("/api/openai/image", {
                    method: "POST",
                    body: JSON.stringify({ prompt: imagePrompt })
                  });
                  setImageResult(data);
                })
              }
            >
              {busy === "image" ? "Generating..." : "Generate sample image"}
            </button>
            {imageResult ? (
              <div className="prototype-output">
                {imageResult.url ? (
                  <img src={imageResult.url} alt="Generated sample" />
                ) : null}
                <pre>{JSON.stringify(imageResult, null, 2)}</pre>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
