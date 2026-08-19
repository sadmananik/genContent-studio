"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConfirmDialog from "../common/ConfirmDialog";
import ToastNotification from "../common/ToastNotification";
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
  const [localInvites, setLocalInvites] = useState([]);
  const [pendingEditorAction, setPendingEditorAction] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(mockAIResponses[0]?.id || null);
  const [notification, setNotification] = useState(null);
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
  const invitedUsers = useMemo(() => {
    const projectUsers =
      project.collaborators?.length > 0
        ? project.collaborators
        : [
            { name: "Sravya Matta", email: "sravya.matta@cqumail.com" },
            { name: "Sadman Anik", email: "sadmananik1@gmail.com" }
          ];
    const usersByEmail = new Map();

    [...projectUsers, ...localInvites].forEach((user) => {
      const email = user.email?.toLowerCase();

      if (email && !usersByEmail.has(email)) {
        usersByEmail.set(email, user);
      }
    });

    return [...usersByEmail.values()];
  }, [localInvites, project.collaborators]);

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
      showNotification("AI generated", "Demo response generated.", "success");
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
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  function showNotification(title, message, type = "info", duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveCurrentDraft();
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      showNotification(
        "Saved",
        isRealProject ? "Project saved." : "Project saved in this browser.",
        "success"
      );
    } catch (error) {
      showNotification("Save failed", error.message || "Project could not be saved.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyResponse(response) {
    await copyText(response.response);
    setCopiedResponseId(response.id);
    showNotification("Copied", "Response copied.", "success", 3000);
    window.setTimeout(() => setCopiedResponseId(null), 1400);
  }

  function handleFavouriteResponse(responseId) {
    const response = responses.find((item) => item.id === responseId);

    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, favourite: !response.favourite } : response
      )
    );
    showNotification(
      response?.favourite ? "Favourite removed" : "Favourite saved",
      response?.favourite ? "Response removed from favourites." : "Response added to favourites.",
      "success",
      3000
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
    showNotification("Inserted", "Response replaced the editor content.", "success");
  }

  function handleUpdateResponse(responseId, updatedResponse) {
    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, response: updatedResponse } : response
      )
    );
    showNotification("Updated", "Response updated.", "success", 3000);
  }

  function handleInviteUser(emailValue) {
    const email = emailValue.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification("Invite failed", "Enter a valid email address to invite.", "warning");
      return false;
    }

    if (invitedUsers.some((user) => user.email?.toLowerCase() === email)) {
      showNotification("Already invited", `${email} is already invited.`, "warning");
      return false;
    }

    setLocalInvites((currentInvites) => [...currentInvites, { email, name: nameFromEmail(email) }]);
    showNotification("Shared", `Invite prepared for ${email}.`, "success");
    return true;
  }

  function handleExport(format) {
    const filename = slugify(project.title);

    if (format === "pdf") {
      downloadBlob(createPdfBlob(project.title, editorContent.text), `${filename}.pdf`);
      showNotification("Exported", "PDF export downloaded.", "success", 3000);
      return;
    }

    downloadBlob(
      new Blob([`${project.title}\n\n${editorContent.text}`], { type: "text/plain;charset=utf-8" }),
      `${filename}.txt`
    );
    showNotification("Exported", "Text export downloaded.", "success", 3000);
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
      showNotification("History loaded", "History response loaded in editor.", "info", 3000);
      return;
    }

    if (savedItem) {
      setPrompt(savedItem.prompt);
      editor.commands.setContent(savedItem.html);
      setEditorContent({ html: savedItem.html, text: savedItem.text });
      setHasUnsavedChanges(false);
      showNotification("Draft loaded", "Saved version loaded in editor.", "info", 3000);
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
      showNotification("Saved", "Draft saved before switching.", "success");
    } catch (error) {
      showNotification("Save failed", error.message || "Draft could not be saved.", "error");
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
        onExport={handleExport}
        onInviteUser={handleInviteUser}
        onSave={handleSave}
        project={project}
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

function nameFromEmail(email) {
  return email
    .replace(/@.*/, "")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
    .join(" ");
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
