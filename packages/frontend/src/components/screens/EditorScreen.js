"use client";

import { useMemo, useState } from "react";
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
    text: mockTextProject.content
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [prompt, setPrompt] = useState(
    "Write an introduction about how AI tools help small businesses."
  );
  const [selectedHistoryId, setSelectedHistoryId] = useState(mockAIHistory[0]?.id || null);
  const wordCount = useMemo(() => countWords(editorContent.text), [editorContent.text]);
  const savePayload = useMemo(
    () => ({
      projectId: mockTextProject.id,
      content: editorContent.html
    }),
    [editorContent.html]
  );

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
    }, 900);
  }

  function handleQuickAction(action) {
    setPrompt(`${action}: ${prompt}`.slice(0, 1200));
  }

  function handleEditorChange(content) {
    setEditorContent(content);
    setHasUnsavedChanges(true);
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader project={mockTextProject} />

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <AIHistorySidebar
          history={mockAIHistory}
          isCollapsed={isHistoryCollapsed}
          onSelectHistory={setSelectedHistoryId}
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
                initialContent={mockTextProject.content}
                onContentChange={handleEditorChange}
                onEditorReady={setEditor}
              />
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Save payload prepared for project {savePayload.projectId}:{" "}
                {savePayload.content.length} HTML characters
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
              {mockAIResponses.map((response) => (
                <AIResponseCard key={response.id} response={response} />
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
