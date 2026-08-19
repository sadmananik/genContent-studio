"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConfirmDialog from "../common/ConfirmDialog";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import FabricImageEditor from "../image-workspace/FabricImageEditor";
import ImageResponseCard from "../image-workspace/ImageResponseCard";
import { mockImageProject } from "../image-workspace/mockImageWorkspaceData";
import { mockPromptActions } from "../text-workspace/mockTextWorkspaceData";
import { apiRequest } from "../../lib/apiClient";
import { useAppStore } from "../../store";

export default function ImageEditorScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || mockImageProject.id;
  const isRealProject = /^[a-f\d]{24}$/i.test(projectId);
  const deleteAiResponse = useAppStore((state) => state.deleteAiResponse);
  const fetchProjectChatHistory = useAppStore((state) => state.fetchProjectChatHistory);
  const fetchProjectById = useAppStore((state) => state.fetchProjectById);
  const inviteProjectCollaborator = useAppStore((state) => state.inviteProjectCollaborator);
  const saveAiResponse = useAppStore((state) => state.saveAiResponse);
  const sendImageGenerationRequest = useAppStore((state) => state.sendImageGenerationRequest);
  const toggleAiResponseFavourite = useAppStore((state) => state.toggleAiResponseFavourite);
  const updateAiResponse = useAppStore((state) => state.updateAiResponse);
  const [canvas, setCanvas] = useState(null);
  const [copiedResponseId, setCopiedResponseId] = useState(null);
  const [generationRequest, setGenerationRequest] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [notification, setNotification] = useState(null);
  const [pendingCanvasAction, setPendingCanvasAction] = useState(null);
  const [prompt, setPrompt] = useState("Create a clean product launch social post.");
  const [project, setProject] = useState(mockImageProject);
  const [responses, setResponses] = useState([]);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const selectedResponse = responses.find((response) => response.id === selectedResponseId);
  const history = responses.map((response) => ({
    id: response.id,
    prompt: response.prompt,
    timestamp: response.timestamp,
    favourite: response.favourite
  }));
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
  const statusLabel = hasUnsavedChanges
    ? "Unsaved changes"
    : lastSavedAt
      ? `Saved ${formatTime(lastSavedAt)}`
      : project.lastUpdated;

  useEffect(() => {
    const pendingToast = readPendingToast();

    if (pendingToast) {
      setNotification({ duration: 5000, id: Date.now(), ...pendingToast });
    }
  }, []);

  useEffect(() => {
    if (!isRealProject) {
      return;
    }

    fetchProjectById(projectId)
      .then((loadedProject) => setProject(normalizeProject(loadedProject)))
      .catch(() => {});
  }, [fetchProjectById, isRealProject, projectId]);

  useEffect(() => {
    if (!isRealProject) {
      setResponses([]);
      setSelectedResponseId(null);
      return;
    }

    fetchProjectChatHistory(projectId)
      .then((chatHistory) => {
        const imageResponses = chatHistory
          .filter((chat) => chat.contentType === "image")
          .map(normalizeImageChat);

        setResponses(imageResponses);
        setSelectedResponseId(imageResponses[0]?.id || null);
      })
      .catch((error) => {
        showNotification(
          "History unavailable",
          error.message || "Image history could not be loaded.",
          TOAST_TYPES.ERROR
        );
      });
  }, [fetchProjectChatHistory, isRealProject, projectId]);

  useEffect(() => {
    if (!canvas || !isRealProject) {
      return;
    }

    apiRequest(`/api/image-content/${projectId}`)
      .then((imageContent) => {
        if (!imageContent.canvasState) {
          return null;
        }

        return canvas.loadFromJSON(imageContent.canvasState).then(() => {
          canvas.requestRenderAll();
          setHasUnsavedChanges(false);
        });
      })
      .catch(() => {});
  }, [canvas, isRealProject, projectId]);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const savedCanvas = window.localStorage.getItem(getImageWorkspaceDraftKey(projectId));

    if (!savedCanvas) {
      return;
    }

    canvas
      .loadFromJSON(savedCanvas)
      .then(() => {
        canvas.requestRenderAll();
        setHasUnsavedChanges(false);
        showNotification("Draft restored", "Saved image canvas loaded.", TOAST_TYPES.INFO, 3000);
      })
      .catch(() => {});
  }, [canvas, projectId]);

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  function handleGenerate() {
    setIsGenerating(true);
    window.setTimeout(async () => {
      const responseText = buildDemoImageResponse(prompt);
      const nextResponse = {
        id: `image-response-${Date.now()}`,
        prompt,
        response: responseText,
        timestamp: "Just now",
        favourite: false
      };

      try {
        const savedResponse = isRealProject
          ? normalizeImageChat(
              await saveAiResponse({
                contentType: "image",
                project: projectId,
                prompt,
                response: responseText
              })
            )
          : nextResponse;

        setResponses((currentResponses) => [savedResponse, ...currentResponses]);
        setSelectedResponseId(savedResponse.id);
        setGenerationRequest({ id: Date.now(), prompt });
        showNotification(
          "Image generated",
          isRealProject
            ? "Demo image response saved to history and inserted into the canvas."
            : "Demo image response inserted into the canvas.",
          TOAST_TYPES.SUCCESS
        );
      } catch (error) {
        showNotification(
          "Generate failed",
          error.message || "Demo image response could not be saved.",
          TOAST_TYPES.ERROR
        );
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  }

  function handleQuickAction(action) {
    setPrompt(`${action}: ${prompt}`.slice(0, 1200));
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

  function handleSelectHistory(responseId) {
    if (selectedResponseId === responseId) {
      return;
    }

    if (queueUnsavedCanvasAction(() => selectHistoryResponse(responseId))) {
      return;
    }

    selectHistoryResponse(responseId);
  }

  function selectHistoryResponse(responseId) {
    setSelectedResponseId(responseId);
    const response = responses.find((item) => item.id === responseId);

    if (response) {
      setPrompt(response.prompt);
      showNotification("History loaded", "Image response selected.", TOAST_TYPES.INFO, 3000);
    }
  }

  function handleCopyResponse(response) {
    navigator.clipboard?.writeText(response.response).catch(() => {});
    setCopiedResponseId(response.id);
    showNotification("Copied", "Image response copied.", TOAST_TYPES.SUCCESS, 3000);
    window.setTimeout(() => setCopiedResponseId(null), 1600);
  }

  async function handleFavouriteResponse(responseId) {
    const response = responses.find((item) => item.id === responseId);
    const nextFavouriteValue = !response?.favourite;

    setResponses((currentResponses) =>
      currentResponses.map((item) =>
        item.id === responseId ? { ...item, favourite: nextFavouriteValue } : item
      )
    );

    if (response?.sourceId) {
      try {
        const updatedResponse = normalizeImageChat(
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
      nextFavouriteValue ? "Image response saved." : "Image response removed from favourites.",
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  async function handleUpdateResponse(responseId, nextResponseText) {
    const response = responses.find((item) => item.id === responseId);

    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId ? { ...response, response: nextResponseText } : response
      )
    );

    if (response?.sourceId) {
      try {
        const updatedResponse = normalizeImageChat(
          await updateAiResponse(response.sourceId, { response: nextResponseText })
        );
        setResponses((currentResponses) =>
          currentResponses.map((item) => (item.id === responseId ? updatedResponse : item))
        );
      } catch (error) {
        showNotification(
          "Update failed",
          error.message || "Image response could not be updated.",
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    showNotification("Updated", "Image response updated.", TOAST_TYPES.SUCCESS, 3000);
  }

  async function handleDeleteResponse(responseId) {
    const response = responses.find((item) => item.id === responseId);

    if (response?.sourceId) {
      try {
        await deleteAiResponse(response.sourceId);
      } catch (error) {
        showNotification(
          "Delete failed",
          error.message || "Image response could not be deleted.",
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    const nextResponses = responses.filter((item) => item.id !== responseId);

    setResponses(nextResponses);
    setSelectedResponseId((currentSelectedId) =>
      currentSelectedId === responseId ? nextResponses[0]?.id || null : currentSelectedId
    );
    showNotification("Deleted", "Image response deleted from history.", TOAST_TYPES.SUCCESS, 3000);
  }

  function handleInsertResponse(response) {
    if (queueUnsavedCanvasAction(() => insertResponseIntoCanvas(response))) {
      return;
    }

    insertResponseIntoCanvas(response);
  }

  function insertResponseIntoCanvas(response) {
    setPrompt(response.prompt);
    setGenerationRequest({ id: Date.now(), prompt: response.prompt });
    showNotification("Inserted", "Image response inserted into the canvas.", TOAST_TYPES.SUCCESS);
  }

  async function handleSaveCanvas(payload) {
    window.localStorage.setItem(getImageWorkspaceDraftKey(projectId), payload);

    if (isRealProject) {
      await sendImageGenerationRequest({
        canvasState: safeParseJson(payload),
        generationPrompt: prompt,
        project: projectId
      });
    }

    setHasUnsavedChanges(false);
    setLastSavedAt(new Date());
    showNotification(
      "Saved",
      isRealProject ? "Image canvas saved." : "Image canvas saved in this browser.",
      TOAST_TYPES.SUCCESS
    );
  }

  async function saveCurrentCanvas() {
    const payload = canvas ? JSON.stringify(canvas.toJSON()) : "{}";
    await handleSaveCanvas(payload);
  }

  function handleHeaderSave() {
    setIsSaving(true);
    window.setTimeout(async () => {
      try {
        await saveCurrentCanvas();
      } catch (error) {
        showNotification(
          "Save failed",
          error.message || "Image could not be saved.",
          TOAST_TYPES.ERROR
        );
      } finally {
        setIsSaving(false);
      }
    }, 250);
  }

  function queueUnsavedCanvasAction(action) {
    if (!hasUnsavedChanges) {
      return false;
    }

    setPendingCanvasAction(() => action);
    return true;
  }

  async function handleConfirmPendingAction() {
    setIsSaving(true);

    try {
      await saveCurrentCanvas();
      pendingCanvasAction?.();
      setPendingCanvasAction(null);
      showNotification("Saved", "Canvas saved before switching.", TOAST_TYPES.SUCCESS);
    } catch (error) {
      showNotification(
        "Save failed",
        error.message || "Canvas could not be saved before switching.",
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleExport(format) {
    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1, quality: 1 });

    if (format === "json") {
      downloadBlob(
        new Blob([JSON.stringify(canvas.toJSON(), null, 2)], {
          type: "application/json;charset=utf-8"
        }),
        `${slugify(project.title)}-canvas.json`
      );
      showNotification("Exported", "Canvas JSON exported.", TOAST_TYPES.SUCCESS, 3000);
      return;
    }

    downloadDataUrl(dataUrl, `${slugify(project.title)}.png`);
    showNotification("Exported", "Image PNG exported.", TOAST_TYPES.SUCCESS, 3000);
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader
        exportOptions={[
          { label: "PNG image", value: "png" },
          { label: "Canvas JSON", value: "json" }
        ]}
        invitedUsers={invitedUsers}
        isSaving={isSaving}
        onExport={handleExport}
        onInviteUser={handleInviteUser}
        onSave={handleHeaderSave}
        project={project}
        statusLabel={statusLabel}
      />

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <AIHistorySidebar
          history={history}
          isCollapsed={isHistoryCollapsed}
          onDeleteHistory={handleDeleteResponse}
          onSelectHistory={handleSelectHistory}
          onToggleCollapsed={() => setIsHistoryCollapsed((currentValue) => !currentValue)}
          selectedHistoryId={selectedResponseId}
        />

        <main className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:p-7">
          <FabricImageEditor
            generationRequest={generationRequest}
            onDirtyChange={setHasUnsavedChanges}
            onReady={setCanvas}
          />

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
                <h2 className="text-base font-bold text-slate-950">Selected Image Response</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Generate a demo image, then copy, edit, favourite, or insert it into the canvas.
                </p>
              </div>
              {selectedResponse ? (
                <ImageResponseCard
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
                  No image response selected yet.
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>

      {pendingCanvasAction && (
        <ConfirmDialog
          cancelLabel="Stay Here"
          confirmLabel="Save and Continue"
          description="Your current canvas has unsaved changes. Save this image draft before loading another response?"
          onCancel={() => setPendingCanvasAction(null)}
          onConfirm={handleConfirmPendingAction}
          title="Save changes before switching?"
        />
      )}

      <ToastNotification
        duration={notification?.duration}
        key={notification?.id}
        message={notification?.message}
        onClose={() => setNotification(null)}
        title={notification?.title}
        type={notification?.type}
      />
    </section>
  );
}

function normalizeProject(project) {
  return {
    ...mockImageProject,
    id: project._id || project.id,
    title: project.title || mockImageProject.title,
    category: project.category || mockImageProject.category,
    type: "Image Project",
    lastUpdated: project.updatedAt
      ? `Updated ${new Date(project.updatedAt).toLocaleString()}`
      : mockImageProject.lastUpdated,
    collaborators: project.collaborators || []
  };
}

function normalizeImageChat(chat) {
  return {
    id: chat._id || chat.id,
    sourceId: chat._id || chat.id,
    prompt: chat.prompt,
    response: chat.response,
    timestamp: chat.createdAt ? formatRelativeTime(new Date(chat.createdAt)) : "Just now",
    favourite: Boolean(chat.isFavourite)
  };
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
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

function formatTime(value) {
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function buildDemoImageResponse(prompt) {
  const cleanPrompt = prompt.trim() || "Create a polished social media image.";

  return `Demo image concept for "${cleanPrompt}" with an editable generated image layer, headline card, caption block, and accent shapes ready for Fabric.js editing.`;
}

function formatRelativeTime(value) {
  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  return value.toLocaleDateString();
}

function getImageWorkspaceDraftKey(projectId) {
  return `gencontent-image-workspace-v2-${projectId}`;
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

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "image-project"
  );
}
