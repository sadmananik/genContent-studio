"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "../common/Button";
import EditorChrome from "../common/EditorChrome";
import { PROJECT_TYPES } from "../../constants/content";
import { useAppStore } from "../../store";

export default function EditorScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const projectType = searchParams.get("type");
  const currentProject = useAppStore((state) => state.projectState.currentProject);
  const projectError = useAppStore((state) => state.projectState.error);
  const projectLoading = useAppStore((state) => state.projectState.loading);
  const fetchProjectById = useAppStore((state) => state.fetchProjectById);
  const [draftTitle, setDraftTitle] = useState("Untitled Project");
  const [draftContent, setDraftContent] = useState("");
  const [tone, setTone] = useState("Balanced");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId).catch(() => {});
    }
  }, [fetchProjectById, projectId]);

  const displayProject =
    currentProject?._id === projectId || currentProject?.id === projectId ? currentProject : null;
  const title = displayProject?.title || "Untitled Project";
  const typeLabel =
    displayProject?.type === "image" || projectType === "image"
      ? PROJECT_TYPES.IMAGE
      : PROJECT_TYPES.TEXT;
  const fallbackContent =
    displayProject?.description ||
    "Start drafting here. This temporary workspace keeps the project page interactive until the rich text editor library is added.";
  const wordCount = useMemo(() => countWords(draftContent), [draftContent]);
  const characterCount = draftContent.length;

  useEffect(() => {
    setDraftTitle(title);
    setDraftContent(fallbackContent);
  }, [fallbackContent, title]);

  function applySuggestion(suggestion) {
    setDraftContent((currentContent) =>
      currentContent.trim() ? `${currentContent.trim()}\n\n${suggestion}` : suggestion
    );
  }

  return (
    <section className="screen">
      <EditorChrome
        title={draftTitle}
        aside={<AssistantPanel onApplySuggestion={applySuggestion} />}
      >
        <article className="document-card">
          {projectLoading && projectId ? (
            <>
              <h2>Loading project...</h2>
              <p>Your workspace is opening.</p>
            </>
          ) : projectError && projectId ? (
            <>
              <h2>Project could not be opened</h2>
              <p>{projectError}</p>
            </>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{displayProject?.category || "Content"}</span>
                <span>{typeLabel} Project</span>
                <span>{tone}</span>
              </div>
              <input
                className="mb-5 w-full border-0 bg-transparent p-0 text-3xl font-bold text-slate-950 outline-none"
                onChange={(event) => setDraftTitle(event.target.value)}
                value={draftTitle}
              />
              <div className="mb-4 flex flex-wrap gap-2">
                {["Balanced", "Concise", "Creative"].map((option) => (
                  <button
                    className={`min-h-9 rounded-md border px-3 text-sm font-semibold ${
                      tone === option
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                    key={option}
                    onClick={() => setTone(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <textarea
                className="min-h-96 w-full resize-y rounded-lg border border-slate-200 bg-white p-5 text-base leading-8 text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                onChange={(event) => setDraftContent(event.target.value)}
                style={{ fontSize: `${zoom}%` }}
                value={draftContent}
              />
            </>
          )}
        </article>
        <footer className="editor-status">
          <span>{typeLabel} Workspace</span>
          <span>{displayProject?.category || "No category"}</span>
          <span>{wordCount} words</span>
          <span>{characterCount} chars</span>
          <span>{zoom}%</span>
          <input
            aria-label="Editor zoom"
            max="125"
            min="85"
            onChange={(event) => setZoom(Number(event.target.value))}
            type="range"
            value={zoom}
          />
        </footer>
      </EditorChrome>
    </section>
  );
}

function AssistantPanel({ onApplySuggestion }) {
  const suggestions = [
    "Improve clarity",
    "Make it more engaging",
    "Shorten this paragraph",
    "Expand this paragraph"
  ];

  return (
    <aside className="assistant-panel">
      <h4>AI Assistant</h4>
      <textarea defaultValue="Improve this content" />
      <Button className="full-width">Generate</Button>
      <h4>Suggestions</h4>
      {suggestions.map((item) => (
        <button
          className="suggestion"
          key={item}
          onClick={() => onApplySuggestion(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </aside>
  );
}

function countWords(value) {
  const words = value.trim().match(/\S+/g);
  return words ? words.length : 0;
}
