"use client";

import { useCallback, useMemo, useState } from "react";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import AIResponseCard from "../text-workspace/AIResponseCard";
import EditorToolbar from "../text-workspace/EditorToolbar";
import TipTapEditor from "../text-workspace/TipTapEditor";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import {
  mockAIHistory,
  mockAIResponses,
  mockPromptActions,
  mockTextProject
} from "../text-workspace/mockTextWorkspaceData";

export default function EditorScreen() {
  const [editor, setEditor] = useState(null);
  const [editorContent, setEditorContent] = useState({
    html: mockTextProject.content,
    text: stripHtml(mockTextProject.content)
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [prompt, setPrompt] = useState(
    "Write an introduction about how AI tools help small businesses."
  );
  const [responses, setResponses] = useState(mockAIResponses);
  const [history, setHistory] = useState(mockAIHistory);
  const [copiedResponseId, setCopiedResponseId] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(mockAIHistory[0]?.id || null);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const wordCount = useMemo(() => countWords(editorContent.text), [editorContent.text]);
  const savePayload = useMemo(
    () => ({
      projectId: mockTextProject.id,
      content: editorContent.html
    }),
    [editorContent.html]
  );
  const statusLabel = hasUnsavedChanges
    ? "Unsaved changes"
    : lastSavedAt
      ? `Saved ${formatTime(lastSavedAt)}`
      : mockTextProject.lastUpdated;

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(() => {
      const response = {
        id: `response-${Date.now()}`,
        prompt,
        response: buildDemoResponse(prompt),
        timestamp: "Just now",
        favourite: false
      };

      setResponses((currentResponses) => [response, ...currentResponses]);
      setHistory((currentHistory) => [
        {
          id: `history-${Date.now()}`,
          prompt: prompt.slice(0, 72),
          timestamp: "Just now",
          favourite: false
        },
        ...currentHistory
      ]);
      setSelectedHistoryId(response.id);
      setWorkspaceMessage("Demo response generated.");
      setIsGenerating(false);
    }, 900);
  }

  function handleQuickAction(action) {
    setPrompt(`${action}: ${prompt}`.slice(0, 1200));
  }

  const handleEditorChange = useCallback((content) => {
    setEditorContent(content);
    setHasUnsavedChanges(true);
    setWorkspaceMessage("");
  }, []);

  function handleSave() {
    setIsSaving(true);
    window.localStorage.setItem("gencontent-demo-text-workspace", JSON.stringify(savePayload));
    window.setTimeout(() => {
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      setHistory((currentHistory) => [
        {
          id: `save-${Date.now()}`,
          prompt: `Saved ${mockTextProject.title}`,
          timestamp: "Just now",
          favourite: false
        },
        ...currentHistory
      ]);
      setWorkspaceMessage("Project saved in this browser.");
      setIsSaving(false);
    }, 450);
  }

  async function handleShare() {
    const shareText = `${mockTextProject.title}\n\n${editorContent.text}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: mockTextProject.title,
          text: shareText
        });
        setWorkspaceMessage("Share sheet opened.");
        return;
      }

      await copyText(shareText);
      setWorkspaceMessage("Share text copied.");
    } catch (error) {
      setWorkspaceMessage("Share cancelled.");
    }
  }

  async function handleCopyResponse(response) {
    await copyText(response.response);
    setCopiedResponseId(response.id);
    setWorkspaceMessage("Response copied.");
    window.setTimeout(() => setCopiedResponseId(null), 1400);
  }

  function handleFavouriteResponse(responseId) {
    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, favourite: !response.favourite } : response
      )
    );
  }

  function handleInsertResponse(response) {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent(`<p>${escapeHtml(response.response)}</p>`)
      .run();
    setWorkspaceMessage("Response inserted into editor.");
  }

  function handleUpdateResponse(responseId, updatedResponse) {
    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, response: updatedResponse } : response
      )
    );
    setWorkspaceMessage("Response updated.");
  }

  function handleSelectHistory(historyId) {
    setSelectedHistoryId(historyId);
    const historyItem = history.find((item) => item.id === historyId);

    if (historyItem) {
      setPrompt(historyItem.prompt);
    }
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader
        isSaving={isSaving}
        onSave={handleSave}
        onShare={handleShare}
        project={mockTextProject}
        statusLabel={statusLabel}
      />

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <AIHistorySidebar
          history={history}
          isCollapsed={isHistoryCollapsed}
          onSelectHistory={handleSelectHistory}
          onToggleCollapsed={() => setIsHistoryCollapsed((currentValue) => !currentValue)}
          selectedHistoryId={selectedHistoryId}
        />

        <main className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:p-7">
          <section className="grid min-w-0 gap-5">
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
              <EditorToolbar editor={editor} />
              <div
                className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                  hasUnsavedChanges ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {hasUnsavedChanges ? "Unsaved changes" : mockTextProject.saveStatus} • {wordCount}{" "}
                words
              </div>
              <TipTapEditor
                editorKey={mockTextProject.id}
                initialContent={mockTextProject.content}
                onContentChange={handleEditorChange}
                onEditorReady={setEditor}
              />
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                {workspaceMessage || "Changes are saved locally in this demo workspace."}
              </div>
            </article>
          </section>

          <aside className="grid min-w-0 content-start gap-5">
            <AIPromptPanel
              actions={mockPromptActions}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              onPromptChange={setPrompt}
              onQuickAction={handleQuickAction}
              prompt={prompt}
            />

            <section className="grid gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-950">AI Responses</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mock generated responses for this project.
                </p>
              </div>
              {responses.map((response) => (
                <AIResponseCard
                  copied={copiedResponseId === response.id}
                  key={response.id}
                  onCopy={handleCopyResponse}
                  onFavourite={handleFavouriteResponse}
                  onInsert={handleInsertResponse}
                  onUpdate={handleUpdateResponse}
                  response={response}
                />
              ))}
            </section>
          </aside>
        </main>
      </div>
    </section>
  );
}

function countWords(value) {
  const words = value.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function buildDemoResponse(prompt) {
  return `Demo response for: ${prompt}\n\nAI tools help small businesses create clearer content, save production time, and test stronger campaign ideas without needing a large team. This response is editable, copyable, and can be inserted into the editor.`;
}

async function copyText(value) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function formatTime(value) {
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, " ");
}
