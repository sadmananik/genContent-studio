"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConfirmDialog from "../common/ConfirmDialog";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import ImageEditorScreen from "./ImageEditorScreen";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import AIResponseCard from "../text-workspace/AIResponseCard";
import EditorToolbar from "../text-workspace/EditorToolbar";
import TipTapEditor from "../text-workspace/TipTapEditor";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import { apiRequest } from "../../lib/apiClient";
import { useAppStore } from "../../store";
import { textPromptActions } from "../text-workspace/promptActions";

const defaultTextProject = {
  id: "new-text-project",
  title: "Untitled Text Project",
  category: "Text Project",
  type: "Text Project",
  lastUpdated: "Not saved yet",
  content: ""
};
const starterPrompt = "Write an introduction about how AI tools help small businesses.";
const maxPromptDisplayLength = 180;
const maxQuickActionContentLength = 3200;
const quickActionPromptBuilders = {
  Rewrite: {
    label: "Rewrite selected/editor content",
    buildPrompt: (content) =>
      `Rewrite the following content while preserving its meaning and making it clearer:\n\n${content}`
  },
  "Improve Tone": {
    label: "Improve tone of selected/editor content",
    buildPrompt: (content) =>
      `Improve the tone of the following content so it sounds polished, confident, and natural:\n\n${content}`
  },
  Summarise: {
    label: "Summarise selected/editor content",
    buildPrompt: (content) =>
      `Summarise the following content into a concise version:\n\n${content}`
  },
  Expand: {
    label: "Expand selected/editor content",
    buildPrompt: (content) =>
      `Expand the following content with useful detail while keeping the same topic and style:\n\n${content}`
  },
  "SEO Suggestions": {
    label: "Create SEO suggestions from selected/editor content",
    buildPrompt: (content) =>
      `Suggest SEO keywords, title ideas, and meta description improvements for this content:\n\n${content}`
  }
};

export default function EditorScreen() {
  const searchParams = useSearchParams();
  const workspaceType = searchParams.get("type");

  if (workspaceType === "image") {
    return <ImageEditorScreen />;
  }

  const projectId = searchParams.get("projectId") || defaultTextProject.id;
  const isRealProject = /^[a-f\d]{24}$/i.test(projectId);
  const aiState = useAppStore((state) => state.aiState);
  const deleteAiResponse = useAppStore((state) => state.deleteAiResponse);
  const fetchProjectById = useAppStore((state) => state.fetchProjectById);
  const fetchProjectChatHistory = useAppStore((state) => state.fetchProjectChatHistory);
  const inviteProjectCollaborator = useAppStore((state) => state.inviteProjectCollaborator);
  const saveAiResponse = useAppStore((state) => state.saveAiResponse);
  const generateTextFromPrompt = useAppStore((state) => state.generateTextFromPrompt);
  const clearAiError = useAppStore((state) => state.clearAiError);
  const sendTextGenerationRequest = useAppStore((state) => state.sendTextGenerationRequest);
  const toggleAiResponseFavourite = useAppStore((state) => state.toggleAiResponseFavourite);
  const updateAiResponse = useAppStore((state) => state.updateAiResponse);
  const [editor, setEditor] = useState(null);
  const [project, setProject] = useState(defaultTextProject);
  const [editorContent, setEditorContent] = useState({
    html: defaultTextProject.content,
    text: stripHtml(defaultTextProject.content)
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(isRealProject);
  const [isLoadingContent, setIsLoadingContent] = useState(isRealProject);
  const [isSaving, setIsSaving] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [prompt, setPrompt] = useState(starterPrompt);
  const [responses, setResponses] = useState([]);
  const [copiedResponseId, setCopiedResponseId] = useState(null);
  const [pendingEditorAction, setPendingEditorAction] = useState(null);
  const [pendingEditorActionCopy, setPendingEditorActionCopy] = useState(null);
  const [recentlyInsertedResponseId, setRecentlyInsertedResponseId] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [notification, setNotification] = useState(null);
  const lastPersistedContentHtmlRef = useRef(normalizeEditorHtml(defaultTextProject.content));
  const wordCount = useMemo(() => countWords(editorContent.text), [editorContent.text]);
  const savePayload = useMemo(
    () => ({
      projectId,
      content: editorContent.html
    }),
    [editorContent.html, projectId]
  );
  const statusLabel = getSaveStatusLabel({
    hasUnsavedChanges,
    isLoadingContent,
    isSaving,
    lastSavedAt,
    saveError,
    fallback: project.lastUpdated || defaultTextProject.lastUpdated
  });
  const history = useMemo(
    () =>
      responses.map((response) => ({
        id: response.id,
        prompt: response.promptPreview || getPromptPreview(response.prompt),
        timestamp: response.timestamp,
        favourite: response.favourite,
        type: "response"
      })),
    [responses]
  );
  const selectedResponse =
    responses.find((response) => response.id === selectedHistoryId) || responses[0] || null;
  const invitedUsers = useMemo(() => {
    const usersByEmail = new Map();

    (project.collaborators || []).forEach((user) => {
      const email = user.email?.toLowerCase();

      if (email && !usersByEmail.has(email)) {
        usersByEmail.set(email, user);
      }
    });

    return [...usersByEmail.values()];
  }, [project.collaborators]);

  useEffect(() => {
    const pendingToast = readPendingToast();

    if (pendingToast) {
      setNotification({ duration: 5000, id: Date.now(), ...pendingToast });
    }
  }, []);

  useEffect(() => {
    if (!isRealProject) {
      setResponses([]);
      setSelectedHistoryId(null);
      setIsLoadingHistory(false);
      setHistoryError(null);
      return;
    }

    let isActive = true;

    setIsLoadingContent(true);
    setSaveError(null);

    fetchProjectById(projectId)
      .then((loadedProject) => {
        if (isActive) {
          setProject(normalizeProject(loadedProject));
        }
      })
      .catch((error) => {
        if (isActive) {
          showNotification(
            "Project load failed",
            error.message || "Project details could not be loaded.",
            TOAST_TYPES.ERROR
          );
        }
      });

    apiRequest(`/api/text-content/${projectId}`)
      .then((textContent) => {
        if (!isActive) {
          return;
        }

        const html = typeof textContent.content === "string" ? textContent.content : "";
        lastPersistedContentHtmlRef.current = normalizeEditorHtml(html);

        if (editor) {
          editor.commands.setContent(html, false);
        }

        setEditorContent({ html, text: editor ? editor.getText() : stripHtml(html) });
        setHasUnsavedChanges(false);
        setLastSavedAt(textContent.updatedAt ? new Date(textContent.updatedAt) : null);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        if (error.message === "Text content not found") {
          lastPersistedContentHtmlRef.current = "";
          setEditorContent({ html: "", text: "" });
          setHasUnsavedChanges(false);

          if (editor) {
            editor.commands.clearContent(false);
          }
          return;
        }

        setSaveError(error.message || "Saved content could not be loaded.");
        showNotification(
          "Content load failed",
          error.message || "Saved content could not be loaded.",
          TOAST_TYPES.ERROR
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingContent(false);
        }
      });

    setResponses([]);
    setSelectedHistoryId(null);
    setIsLoadingHistory(true);
    setHistoryError(null);

    fetchProjectChatHistory(projectId)
      .catch((error) => {
        if (isActive) {
          setHistoryError(error.message || "AI history could not be loaded.");
          setResponses([]);
          setSelectedHistoryId(null);
          clearAiError();
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [clearAiError, editor, fetchProjectById, fetchProjectChatHistory, isRealProject, projectId]);

  useEffect(() => {
    if (!isRealProject) {
      return;
    }

    const realResponses = aiState.chatHistory
      .filter((chat) => chat.contentType === "text")
      .map(formatChatAsResponse);
    setResponses(realResponses);
    setSelectedHistoryId(realResponses[0]?.id || null);
  }, [aiState.chatHistory, isRealProject]);

  async function handleGenerate(promptOverride) {
    const trimmedPrompt = String(promptOverride || prompt || "").trim();

    if (!trimmedPrompt) {
      showNotification("Prompt required", "Enter a prompt before generating.", TOAST_TYPES.ERROR);
      return;
    }

    clearAiError();
    setIsGenerating(true);

    try {
      const result = await generateTextFromPrompt({ prompt: trimmedPrompt });
      const generatedText = result?.text || "";
      const responseId = `response-${Date.now()}`;
      const response = {
        id: responseId,
        prompt: trimmedPrompt,
        promptPreview: getPromptPreview(trimmedPrompt),
        response: generatedText,
        timestamp: "Just now",
        favourite: false
      };

      setResponses((currentResponses) => [response, ...currentResponses]);
      setSelectedHistoryId(responseId);
      showNotification(
        "AI generated",
        "Content is ready. Insert it into the editor or edit it first.",
        TOAST_TYPES.SUCCESS
      );

      if (isRealProject) {
        try {
          const savedResponse = await saveAiResponse({
            project: projectId,
            prompt: trimmedPrompt,
            response: generatedText,
            contentType: "text"
          });
          const formattedResponse = formatChatAsResponse(savedResponse);

          setResponses((currentResponses) =>
            currentResponses.map((item) =>
              item.id === responseId ? { ...formattedResponse, timestamp: "Just now" } : item
            )
          );
          setSelectedHistoryId(formattedResponse.id);
        } catch (persistError) {
          showNotification(
            "Saved locally only",
            persistError.message || "Generated text could not be saved to project history.",
            TOAST_TYPES.INFO
          );
        }
      }
    } catch (error) {
      showNotification(
        "Generation failed",
        error.message || "Could not generate text from OpenAI.",
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleQuickAction(action) {
    const sourceContent = (getSelectedEditorText(editor) || editorContent.text).trim();

    if (!sourceContent) {
      showNotification(
        "Content required",
        "Write or select text in the editor before using a quick action.",
        TOAST_TYPES.WARNING
      );
      return;
    }

    const actionConfig = quickActionPromptBuilders[action];

    if (!actionConfig) {
      setPrompt(`${action}: ${prompt}`.slice(0, 1200));
      return;
    }

    const limitedContent = sourceContent.slice(0, maxQuickActionContentLength);
    const actionPrompt = actionConfig.buildPrompt(limitedContent);

    setPrompt(actionConfig.label.slice(0, maxPromptDisplayLength));
    await handleGenerate(actionPrompt);
  }

  function handlePromptFocus() {
    if (prompt === starterPrompt) {
      setPrompt("");
    }
  }

  const handleEditorChange = useCallback((content) => {
    setEditorContent(content);
    setHasUnsavedChanges(
      hasEditorContentChanged(content.html, lastPersistedContentHtmlRef.current)
    );
    setSaveError(null);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveCurrentDraft();
      lastPersistedContentHtmlRef.current = normalizeEditorHtml(editorContent.html);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      showNotification(
        "Saved",
        isRealProject ? "Project saved." : "Project saved in this browser.",
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      setSaveError(error.message || "Project could not be saved.");
      showNotification(
        "Save failed",
        error.message || "Project could not be saved.",
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyResponse(response) {
    await copyText(response.response);
    setCopiedResponseId(response.id);
    showNotification("Copied", "Response copied.", TOAST_TYPES.SUCCESS, 3000);
    window.setTimeout(() => setCopiedResponseId(null), 1400);
  }

  async function handleFavouriteResponse(responseId) {
    const response = responses.find((item) => item.id === responseId);
    const nextFavouriteValue = !response?.favourite;

    setResponses((currentResponses) =>
      currentResponses.map((item) =>
        item.id === responseId ? { ...item, favourite: nextFavouriteValue } : item
      )
    );

    if (isRealProject && response?.sourceId) {
      try {
        const updatedResponse = formatChatAsResponse(
          await toggleAiResponseFavourite(response.sourceId, nextFavouriteValue)
        );
        setResponses((currentResponses) =>
          currentResponses.map((item) => (item.id === responseId ? updatedResponse : item))
        );
      } catch (error) {
        setResponses((currentResponses) =>
          currentResponses.map((item) =>
            item.id === responseId ? { ...item, favourite: response.favourite } : item
          )
        );
        showNotification(
          "Favourite failed",
          error.message || "Favourite could not be saved.",
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    showNotification(
      nextFavouriteValue ? "Favourite saved" : "Favourite removed",
      nextFavouriteValue ? "Response added to favourites." : "Response removed from favourites.",
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  function handleInsertResponse(response) {
    if (!editor) {
      return;
    }

    if (recentlyInsertedResponseId === response.id) {
      showNotification(
        "Already inserted",
        "That response was just inserted into the editor.",
        TOAST_TYPES.INFO,
        2500
      );
      return;
    }

    if (
      queueUnsavedAction(() => insertResponse(response), {
        description:
          "Your current editor content has unsaved changes. Save this draft before inserting the AI response?",
        title: "Save changes before inserting?"
      })
    ) {
      return;
    }

    insertResponse(response);
  }

  function insertResponse(response) {
    insertTextIntoEditor(response.response);
    setSelectedHistoryId(response.id);
    setPrompt(response.prompt);
    setRecentlyInsertedResponseId(response.id);
    window.setTimeout(() => {
      setRecentlyInsertedResponseId((currentId) => (currentId === response.id ? null : currentId));
    }, 2000);
    showNotification("Inserted", "Response added to the editor.", TOAST_TYPES.SUCCESS);
  }

  async function handleUpdateResponse(responseId, updatedResponse) {
    const response = responses.find((item) => item.id === responseId);

    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, response: updatedResponse } : response
      )
    );

    if (isRealProject && response?.sourceId) {
      try {
        const savedResponse = formatChatAsResponse(
          await updateAiResponse(response.sourceId, { response: updatedResponse })
        );
        setResponses((currentResponses) =>
          currentResponses.map((item) => (item.id === responseId ? savedResponse : item))
        );
      } catch (error) {
        showNotification(
          "Update failed",
          error.message || "Response could not be updated.",
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    showNotification("Updated", "Response updated.", TOAST_TYPES.SUCCESS, 3000);
  }

  async function handleDeleteResponse(responseId) {
    const response = responses.find((item) => item.id === responseId);

    if (isRealProject && response?.sourceId) {
      try {
        await deleteAiResponse(response.sourceId);
      } catch (error) {
        showNotification(
          "Delete failed",
          error.message || "Response could not be deleted.",
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    const nextResponses = responses.filter((item) => item.id !== responseId);

    setResponses(nextResponses);
    setSelectedHistoryId((currentSelectedId) =>
      currentSelectedId === responseId ? nextResponses[0]?.id || null : currentSelectedId
    );
    showNotification("Deleted", "Response deleted from history.", TOAST_TYPES.SUCCESS, 3000);
  }

  async function handleInviteUser(emailValue) {
    const email = emailValue.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification(
        "Invite failed",
        "Enter a valid email address to invite.",
        TOAST_TYPES.WARNING
      );
      return false;
    }

    if (invitedUsers.some((user) => user.email?.toLowerCase() === email)) {
      showNotification("Already invited", `${email} is already invited.`, TOAST_TYPES.WARNING);
      return false;
    }

    if (!isRealProject) {
      showNotification(
        "Invite unavailable",
        "Save this project before inviting users.",
        TOAST_TYPES.WARNING
      );
      return false;
    }

    try {
      const updatedProject = await inviteProjectCollaborator(projectId, email);
      setProject(normalizeProject(updatedProject));
      showNotification("Shared", `${email} was invited to this project.`, TOAST_TYPES.SUCCESS);
      return true;
    } catch (error) {
      showNotification(
        "Invite failed",
        error.message || "User could not be invited.",
        TOAST_TYPES.ERROR
      );
      return false;
    }
  }

  function handleExport(format) {
    const filename = slugify(project.title);

    if (format === "pdf") {
      downloadBlob(createPdfBlob(project.title, editorContent.text), `${filename}.pdf`);
      showNotification("Exported", "PDF export downloaded.", TOAST_TYPES.SUCCESS, 3000);
      return;
    }

    downloadBlob(
      new Blob([`${project.title}\n\n${editorContent.text}`], { type: "text/plain;charset=utf-8" }),
      `${filename}.txt`
    );
    showNotification("Exported", "Text export downloaded.", TOAST_TYPES.SUCCESS, 3000);
  }

  function handleSelectHistory(historyId) {
    if (selectedHistoryId === historyId) {
      return;
    }

    const responseItem = responses.find((response) => response.id === historyId);

    setSelectedHistoryId(historyId);

    if (responseItem) {
      setPrompt(responseItem.prompt);
    }
  }

  function queueUnsavedAction(action, copy = {}) {
    if (!hasEditorContentChanged(editorContent.html, lastPersistedContentHtmlRef.current)) {
      setHasUnsavedChanges(false);
      return false;
    }

    setPendingEditorAction(() => action);
    setPendingEditorActionCopy(copy);
    return true;
  }

  async function handleConfirmPendingAction() {
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveCurrentDraft();
      lastPersistedContentHtmlRef.current = normalizeEditorHtml(editorContent.html);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      pendingEditorAction?.();
      setPendingEditorAction(null);
      setPendingEditorActionCopy(null);
      showNotification("Saved", "Draft saved before switching.", TOAST_TYPES.SUCCESS);
    } catch (error) {
      setSaveError(error.message || "Draft could not be saved.");
      showNotification(
        "Save failed",
        error.message || "Draft could not be saved.",
        TOAST_TYPES.ERROR
      );
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
  }

  function insertTextIntoEditor(value) {
    const html = textToHtml(value);

    editor.chain().focus().insertContent(html).run();
    const nextHtml = editor.getHTML();

    setEditorContent({ html: nextHtml, text: editor.getText() });
    setHasUnsavedChanges(hasEditorContentChanged(nextHtml, lastPersistedContentHtmlRef.current));
    setSaveError(null);
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader
        invitedUsers={invitedUsers}
        isSaving={isSaving}
        onExport={handleExport}
        onInviteUser={handleInviteUser}
        onSave={handleSave}
        project={project}
        statusLabel={statusLabel}
      />

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <AIHistorySidebar
          error={historyError}
          history={history}
          isCollapsed={isHistoryCollapsed}
          isLoading={isLoadingHistory}
          onDeleteHistory={handleDeleteResponse}
          onSelectHistory={handleSelectHistory}
          onToggleFavourite={handleFavouriteResponse}
          onToggleCollapsed={() => setIsHistoryCollapsed((currentValue) => !currentValue)}
          selectedHistoryId={selectedHistoryId}
        />

        <main className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:p-7">
          <section className="grid min-w-0 gap-5">
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
              <EditorToolbar editor={editor} />
              <div
                className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                  saveError
                    ? "text-red-700"
                    : hasUnsavedChanges || isSaving
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
              >
                {statusLabel} • {wordCount} words
              </div>
              <TipTapEditor
                editorKey={project.id}
                initialContent={editorContent.html}
                onContentChange={handleEditorChange}
                onEditorReady={setEditor}
              />
            </article>
          </section>

          <aside className="grid min-w-0 content-start gap-5">
            <AIPromptPanel
              actions={textPromptActions}
              error={aiState.error}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              onPromptChange={(value) => {
                if (aiState.error) {
                  clearAiError();
                }
                setPrompt(value);
              }}
              onPromptFocus={handlePromptFocus}
              onQuickAction={handleQuickAction}
              prompt={prompt}
            />

            <section className="grid gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-950">Selected AI Response</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Generate with OpenAI, then copy, edit, favourite, or insert the selected response
                  into TipTap.
                </p>
              </div>
              {selectedResponse ? (
                <AIResponseCard
                  copied={copiedResponseId === selectedResponse.id}
                  key={selectedResponse.id}
                  onCopy={handleCopyResponse}
                  onDelete={handleDeleteResponse}
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
          description={
            pendingEditorActionCopy?.description ||
            "Your current editor content has unsaved changes. Save this draft before continuing?"
          }
          onCancel={() => {
            setPendingEditorAction(null);
            setPendingEditorActionCopy(null);
          }}
          onConfirm={handleConfirmPendingAction}
          title={pendingEditorActionCopy?.title || "Save changes before continuing?"}
        />
      )}
      <ToastNotification
        duration={notification?.duration}
        key={notification?.id}
        message={notification?.message}
        onClose={dismissNotification}
        title={notification?.title}
        type={notification?.type}
      />
    </section>
  );
}

function normalizeProject(project) {
  return {
    ...defaultTextProject,
    id: project._id || project.id,
    title: project.title || defaultTextProject.title,
    category: project.category || defaultTextProject.category,
    type: "Text Project",
    lastUpdated: project.updatedAt
      ? `Updated ${new Date(project.updatedAt).toLocaleString()}`
      : defaultTextProject.lastUpdated,
    collaborators: project.collaborators || []
  };
}

function formatChatAsResponse(chat) {
  return {
    id: chat._id || chat.id,
    sourceId: chat._id || chat.id,
    prompt: chat.prompt,
    promptPreview: getPromptPreview(chat.prompt),
    response: chat.response,
    timestamp: chat.createdAt ? new Date(chat.createdAt).toLocaleString() : "Saved chat",
    favourite: Boolean(chat.isFavourite)
  };
}

function getPromptPreview(value, maxLength = 72) {
  const compactPrompt = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (compactPrompt.length <= maxLength) {
    return compactPrompt;
  }

  return `${compactPrompt.slice(0, maxLength - 1).trim()}...`;
}

function countWords(value) {
  const words = value.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function hasEditorContentChanged(currentHtml, persistedHtml) {
  return normalizeEditorHtml(currentHtml) !== normalizeEditorHtml(persistedHtml);
}

function normalizeEditorHtml(value) {
  return String(value || "")
    .replace(/<p>(?:\s|<br\s*\/?>|&nbsp;)*<\/p>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getSelectedEditorText(editor) {
  if (!editor) {
    return "";
  }

  const { from, to } = editor.state.selection;

  if (from === to) {
    return "";
  }

  return editor.state.doc.textBetween(from, to, " ").trim();
}

function getSaveStatusLabel({
  fallback,
  hasUnsavedChanges,
  isLoadingContent,
  isSaving,
  lastSavedAt,
  saveError
}) {
  if (isLoadingContent) {
    return "Loading content...";
  }

  if (isSaving) {
    return "Saving...";
  }

  if (saveError) {
    return "Save failed";
  }

  if (hasUnsavedChanges) {
    return "Unsaved changes";
  }

  if (lastSavedAt) {
    return `Saved ${formatTime(lastSavedAt)}`;
  }

  return fallback;
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
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function textToHtml(value) {
  const paragraphs = String(value || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "";
  }

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function formatTime(value) {
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, " ");
}

function readPendingToast() {
  const rawToast = window.sessionStorage.getItem("gencontent-pending-toast");

  if (!rawToast) {
    return null;
  }

  window.sessionStorage.removeItem("gencontent-pending-toast");

  try {
    return JSON.parse(rawToast);
  } catch (error) {
    return null;
  }
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "text-project"
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createPdfBlob(title, text) {
  const lines = wrapPdfText([title, "", text].join("\n"), 82).slice(0, 48);
  const contentLines = ["BT", "/F1 12 Tf", "14 TL", "72 760 Td"];

  lines.forEach((line, index) => {
    if (index === 0) {
      contentLines.push("/F1 16 Tf");
    } else if (index === 1) {
      contentLines.push("/F1 12 Tf");
    }

    contentLines.push(`(${escapePdfText(line)}) Tj`);

    if (index < lines.length - 1) {
      contentLines.push("T*");
    }
  });

  contentLines.push("ET");

  const stream = contentLines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function wrapPdfText(value, maxLineLength) {
  return value.split("\n").flatMap((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return [""];
    }

    return words.reduce(
      (lines, word) => {
        const currentLine = lines[lines.length - 1];
        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (nextLine.length <= maxLineLength) {
          lines[lines.length - 1] = nextLine;
        } else {
          lines.push(word);
        }

        return lines;
      },
      [""]
    );
  });
}

function escapePdfText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
