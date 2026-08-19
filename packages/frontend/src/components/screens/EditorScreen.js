"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConfirmDialog from "../common/ConfirmDialog";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import AIResponseCard from "../text-workspace/AIResponseCard";
import EditorToolbar from "../text-workspace/EditorToolbar";
import TipTapEditor from "../text-workspace/TipTapEditor";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import { apiRequest } from "../../lib/apiClient";
import { useAppStore } from "../../store";
import {
  mockAIResponses,
  mockPromptActions,
  mockTextProject
} from "../text-workspace/mockTextWorkspaceData";

export default function EditorScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || mockTextProject.id;
  const isRealProject = /^[a-f\d]{24}$/i.test(projectId);
  const aiState = useAppStore((state) => state.aiState);
  const fetchProjectById = useAppStore((state) => state.fetchProjectById);
  const fetchProjectChatHistory = useAppStore((state) => state.fetchProjectChatHistory);
  const saveAiResponse = useAppStore((state) => state.saveAiResponse);
  const sendTextGenerationRequest = useAppStore((state) => state.sendTextGenerationRequest);
  const toggleAiResponseFavourite = useAppStore((state) => state.toggleAiResponseFavourite);
  const [editor, setEditor] = useState(null);
  const [project, setProject] = useState(mockTextProject);
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
  const [savedDraft, setSavedDraft] = useState(null);
  const [copiedResponseId, setCopiedResponseId] = useState(null);
  const [pendingEditorAction, setPendingEditorAction] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(mockAIResponses[0]?.id || null);
  const [shareLink, setShareLink] = useState("");
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const wordCount = useMemo(() => countWords(editorContent.text), [editorContent.text]);
  const savePayload = useMemo(
    () => ({
      projectId,
      content: editorContent.html
    }),
    [editorContent.html, projectId]
  );
  const statusLabel = hasUnsavedChanges
    ? "Unsaved changes"
    : lastSavedAt
      ? `Saved ${formatTime(lastSavedAt)}`
      : mockTextProject.lastUpdated;
  const history = useMemo(
    () => [
      ...(savedDraft ? [savedDraft] : []),
      ...responses.map((response) => ({
        id: response.id,
        prompt: response.prompt,
        timestamp: response.timestamp,
        favourite: response.favourite,
        type: "response"
      }))
    ],
    [responses, savedDraft]
  );
  const selectedResponse =
    responses.find((response) => response.id === selectedHistoryId) || responses[0] || null;
  const invitedUsers =
    project.collaborators?.length > 0
      ? project.collaborators
      : [
          { name: "Sravya Matta", email: "sravya.matta@cqumail.com" },
          { name: "Sadman Anik", email: "sadmananik1@gmail.com" }
        ];

  useEffect(() => {
    if (!isRealProject) {
      return;
    }

    fetchProjectById(projectId)
      .then((loadedProject) => setProject(normalizeProject(loadedProject)))
      .catch(() => {});

    apiRequest(`/api/text-content/${projectId}`)
      .then((textContent) => {
        const html = typeof textContent.content === "string" ? textContent.content : "";

        if (html && editor) {
          editor.commands.setContent(html);
          setEditorContent({ html, text: editor.getText() });
          setHasUnsavedChanges(false);
        }
      })
      .catch(() => {});

    fetchProjectChatHistory(projectId).catch(() => {});
  }, [editor, fetchProjectById, fetchProjectChatHistory, isRealProject, projectId]);

  useEffect(() => {
    if (!isRealProject || aiState.chatHistory.length === 0) {
      return;
    }

    const realResponses = aiState.chatHistory.map(formatChatAsResponse);
    setResponses(realResponses);
    setSelectedHistoryId(realResponses[0]?.id || null);
  }, [aiState.chatHistory, isRealProject]);

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(() => {
      const responseId = `response-${Date.now()}`;
      const response = {
        id: responseId,
        prompt,
        response: buildDemoResponse(prompt),
        timestamp: "Just now",
        favourite: false
      };

      setResponses((currentResponses) => [response, ...currentResponses]);
      setSelectedHistoryId(responseId);
      setWorkspaceMessage("Demo response generated.");
      setIsGenerating(false);

      if (isRealProject) {
        saveAiResponse({
          project: projectId,
          prompt,
          response: response.response,
          contentType: "text"
        }).catch(() => {});
      }
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

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveCurrentDraft();
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      setWorkspaceMessage(isRealProject ? "Project saved." : "Project saved in this browser.");
    } catch (error) {
      setWorkspaceMessage(error.message || "Project could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShare() {
    const shareText = `${project.title}\n\n${editorContent.text}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
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
    const response = responses.find((item) => item.id === responseId);

    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, favourite: !response.favourite } : response
      )
    );

    if (isRealProject && response?.sourceId) {
      toggleAiResponseFavourite(response.sourceId, !response.favourite).catch(() => {});
    }
  }

  function handleInsertResponse(response) {
    if (!editor) {
      return;
    }

    if (queueUnsavedAction(() => insertResponse(response))) {
      return;
    }

    insertResponse(response);
  }

  function insertResponse(response) {
    replaceEditorContent(response.response);
    setSelectedHistoryId(response.id);
    setPrompt(response.prompt);
    setWorkspaceMessage("Response replaced the editor content.");
  }

  function handleUpdateResponse(responseId, updatedResponse) {
    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, response: updatedResponse } : response
      )
    );
    setWorkspaceMessage("Response updated.");
  }

  async function handleGenerateLink() {
    const link = `${window.location.origin}/editor?projectId=${projectId}&type=text`;
    setShareLink(link);
    await copyText(link);
    setWorkspaceMessage("Project link copied.");
  }

  function handleSelectHistory(historyId) {
    if (!editor) {
      return;
    }

    if (selectedHistoryId === historyId) {
      return;
    }

    if (queueUnsavedAction(() => loadHistoryItem(historyId))) {
      return;
    }

    loadHistoryItem(historyId);
  }

  function loadHistoryItem(historyId) {
    const responseItem = responses.find((response) => response.id === historyId);
    const savedItem = savedDraft?.id === historyId ? savedDraft : null;

    setSelectedHistoryId(historyId);

    if (responseItem) {
      setPrompt(responseItem.prompt);
      replaceEditorContent(responseItem.response, { markUnsaved: false });
      setWorkspaceMessage("History response loaded in editor.");
      return;
    }

    if (savedItem) {
      setPrompt(savedItem.prompt);
      editor.commands.setContent(savedItem.html);
      setEditorContent({ html: savedItem.html, text: savedItem.text });
      setHasUnsavedChanges(false);
      setWorkspaceMessage("Saved version loaded in editor.");
    }
  }

  function queueUnsavedAction(action) {
    if (!hasUnsavedChanges) {
      return false;
    }

    setPendingEditorAction(() => action);
    return true;
  }

  async function handleConfirmPendingAction() {
    setIsSaving(true);

    try {
      await saveCurrentDraft();
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      pendingEditorAction?.();
      setPendingEditorAction(null);
      setWorkspaceMessage("Draft saved before switching.");
    } catch (error) {
      setWorkspaceMessage(error.message || "Draft could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveCurrentDraft() {
    if (isRealProject) {
      await sendTextGenerationRequest({
        project: projectId,
        content: editorContent.html
      });
    } else {
      window.localStorage.setItem("gencontent-demo-text-workspace", JSON.stringify(savePayload));
    }

    setSavedDraft({
      id: "saved-draft",
      prompt: `Saved ${project.title}`,
      timestamp: "Just now",
      favourite: false,
      type: "save",
      html: editorContent.html,
      text: editorContent.text
    });
  }

  function replaceEditorContent(value, options = {}) {
    const html = `<p>${escapeHtml(value)}</p>`;
    editor.commands.setContent(html);
    setEditorContent({ html, text: value });
    setHasUnsavedChanges(options.markUnsaved ?? true);
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader
        invitedUsers={invitedUsers}
        isSaving={isSaving}
        onGenerateLink={handleGenerateLink}
        onSave={handleSave}
        onShare={handleShare}
        project={project}
        shareLink={shareLink}
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
                {hasUnsavedChanges ? "Unsaved changes" : project.saveStatus} • {wordCount} words
              </div>
              <TipTapEditor
                editorKey={project.id}
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
                <h2 className="text-base font-bold text-slate-950">Selected AI Response</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Generate demo text, then copy, edit, favourite, or insert the selected response.
                </p>
              </div>
              {selectedResponse ? (
                <AIResponseCard
                  copied={copiedResponseId === selectedResponse.id}
                  key={selectedResponse.id}
                  onCopy={handleCopyResponse}
                  onFavourite={handleFavouriteResponse}
                  onInsert={handleInsertResponse}
                  onUpdate={handleUpdateResponse}
                  response={selectedResponse}
                  selected
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  No response selected yet.
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>
      {pendingEditorAction && (
        <ConfirmDialog
          cancelLabel="Stay Here"
          confirmLabel="Save and Continue"
          description="Your current editor content has unsaved changes. Save this draft before loading another response?"
          onCancel={() => setPendingEditorAction(null)}
          onConfirm={handleConfirmPendingAction}
          title="Save changes before switching?"
        />
      )}
    </section>
  );
}

function normalizeProject(project) {
  return {
    ...mockTextProject,
    id: project._id || project.id,
    title: project.title || mockTextProject.title,
    category: project.category || mockTextProject.category,
    type: "Text Project",
    lastUpdated: project.updatedAt
      ? `Updated ${new Date(project.updatedAt).toLocaleString()}`
      : mockTextProject.lastUpdated,
    collaborators: project.collaborators || []
  };
}

function formatChatAsResponse(chat) {
  return {
    id: chat._id || chat.id,
    sourceId: chat._id || chat.id,
    prompt: chat.prompt,
    response: chat.response,
    timestamp: chat.createdAt ? new Date(chat.createdAt).toLocaleString() : "Saved chat",
    favourite: Boolean(chat.isFavourite)
  };
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
