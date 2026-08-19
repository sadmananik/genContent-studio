"use client";

import { useMemo, useState } from "react";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import AIResponseCard from "../text-workspace/AIResponseCard";
import EditorToolbar from "../text-workspace/EditorToolbar";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import {
  mockAIHistory,
  mockAIResponses,
  mockPromptActions,
  mockTextProject
} from "../text-workspace/mockTextWorkspaceData";

export default function EditorScreen() {
  const [activeTool, setActiveTool] = useState("Bold");
  const [editorContent, setEditorContent] = useState(mockTextProject.content);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [prompt, setPrompt] = useState(
    "Write an introduction about how AI tools help small businesses."
  );
  const [selectedHistoryId, setSelectedHistoryId] = useState(mockAIHistory[0]?.id || null);
  const wordCount = useMemo(() => countWords(editorContent), [editorContent]);

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
    }, 900);
  }

  function handleQuickAction(action) {
    setPrompt(`${action}: ${prompt}`.slice(0, 1200));
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
              <EditorToolbar activeTool={activeTool} onSelectTool={setActiveTool} />
              <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {mockTextProject.saveStatus} • {wordCount} words
              </div>
              <textarea
                className="min-h-[32rem] w-full resize-y border-0 bg-white p-5 text-base leading-8 text-slate-700 outline-none md:p-7"
                onChange={(event) => setEditorContent(event.target.value)}
                placeholder="Start writing your content here..."
                value={editorContent}
              />
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
