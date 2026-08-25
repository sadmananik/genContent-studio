"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "../common/ConfirmDialog";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import FabricImageEditor from "../image-workspace/FabricImageEditor";
import ImageResponseCard from "../image-workspace/ImageResponseCard";
import { mockImageProject } from "../image-workspace/mockImageWorkspaceData";
import { textPromptActions } from "../text-workspace/promptActions";
import {
  ACCESS_LEVELS,
  AI_CONTENT_TYPES,
  API_PROJECT_TYPES,
  EDITOR_ACCESS_QUERY,
  PERMISSION_MESSAGES,
  PROJECT_ROLES
} from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { IMAGE_EDITOR_ALERTS, TEXT_EDITOR_ALERTS } from "../../constants/notifications";
import { apiRequest } from "../../lib/apiClient";
import { useAppStore } from "../../store";

export default function ImageEditorScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || mockImageProject.id;
  const requestedAccess = searchParams.get("access");
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
  const [pendingCanvasActionCopy, setPendingCanvasActionCopy] = useState(null);
  const [pendingResponseDelete, setPendingResponseDelete] = useState(null);
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
  const templateHistoryOptions = useMemo(
    () =>
      responses.map((response) => ({
        id: response.id,
        label: `${response.prompt} • ${response.timestamp}`,
        prompt: response.prompt,
        content: response.response
      })),
    [responses]
  );
  const invitedUsers = useMemo(() => {
    const usersByEmail = new Map();

    (project.collaborators || []).forEach((user) => {
      const email = user.email?.toLowerCase();

      if (email && !usersByEmail.has(email)) {
        usersByEmail.set(email, {
          ...user,
          accessLevel: getCollaboratorAccessLevel(project, user)
        });
      }
    });

    return [...usersByEmail.values()];
  }, [project]);
  const statusLabel = hasUnsavedChanges
    ? TEXT_EDITOR_ALERTS.UNSAVED_CHANGES_STATUS
    : lastSavedAt
      ? `Saved ${formatTime(lastSavedAt)}`
      : project.lastUpdated;
  const canEditProject = project.canEdit !== false && requestedAccess !== EDITOR_ACCESS_QUERY.VIEW;
  const canManageSharing =
    project.canManageSharing !== false && project.currentUserRole !== PROJECT_ROLES.COLLABORATOR;

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
      .then((loadedProject) => {
        setProject(normalizeProject(loadedProject));
        if (loadedProject.starterPrompt) {
          setPrompt(loadedProject.starterPrompt);
        }
      })
      .catch((error) => {
        showNotification(
          TEXT_EDITOR_ALERTS.PROJECT_LOAD_FAILED_TITLE,
          error.message || TEXT_EDITOR_ALERTS.PROJECT_LOAD_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
      });
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
          .filter((chat) => chat.contentType === AI_CONTENT_TYPES.IMAGE)
          .map(normalizeImageChat);

        setResponses(imageResponses);
        setSelectedResponseId(imageResponses[0]?.id || null);
      })
      .catch((error) => {
        showNotification(
          IMAGE_EDITOR_ALERTS.HISTORY_UNAVAILABLE_TITLE,
          error.message || IMAGE_EDITOR_ALERTS.HISTORY_UNAVAILABLE_MESSAGE,
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
        if (imageContent.generationPrompt) {
          setPrompt(imageContent.generationPrompt);
        }

        if (!imageContent.canvasState) {
          return null;
        }

        return canvas.loadFromJSON(imageContent.canvasState).then(() => {
          canvas.requestRenderAll();
          setHasUnsavedChanges(false);
        });
      })
      .catch((error) => {
        showNotification(
          IMAGE_EDITOR_ALERTS.CANVAS_LOAD_FAILED_TITLE,
          error.message || IMAGE_EDITOR_ALERTS.CANVAS_LOAD_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
      });
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
        showNotification(
          IMAGE_EDITOR_ALERTS.DRAFT_RESTORED_TITLE,
          IMAGE_EDITOR_ALERTS.DRAFT_RESTORED_MESSAGE,
          TOAST_TYPES.INFO,
          3000
        );
      })
      .catch(() => {});
  }, [canvas, projectId]);

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  function handleGenerate() {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_GENERATION_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

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
                contentType: AI_CONTENT_TYPES.IMAGE,
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
          IMAGE_EDITOR_ALERTS.GENERATED_TITLE,
          isRealProject
            ? IMAGE_EDITOR_ALERTS.GENERATED_SAVED_MESSAGE
            : IMAGE_EDITOR_ALERTS.GENERATED_LOCAL_MESSAGE,
          TOAST_TYPES.SUCCESS
        );
      } catch (error) {
        showNotification(
          IMAGE_EDITOR_ALERTS.GENERATE_FAILED_TITLE,
          error.message || IMAGE_EDITOR_ALERTS.GENERATE_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  }

  function handleQuickAction(action) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_ACTIONS_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

    setPrompt(`${action}: ${prompt}`.slice(0, 1200));
  }

  async function handleInviteUser(emailValue, accessLevel) {
    if (!canManageSharing) {
      showNotification(
        TEXT_EDITOR_ALERTS.INVITE_UNAVAILABLE_TITLE,
        PERMISSION_MESSAGES.SHARING_OWNER_ONLY,
        TOAST_TYPES.WARNING
      );
      return false;
    }

    const email = emailValue.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification(
        TEXT_EDITOR_ALERTS.INVITE_FAILED_TITLE,
        TEXT_EDITOR_ALERTS.INVITE_INVALID_EMAIL_MESSAGE,
        TOAST_TYPES.WARNING
      );
      return false;
    }

    if (invitedUsers.some((user) => user.email?.toLowerCase() === email)) {
      showNotification(
        TEXT_EDITOR_ALERTS.ALREADY_INVITED_TITLE,
        TEXT_EDITOR_ALERTS.alreadyInvitedMessage(email),
        TOAST_TYPES.WARNING
      );
      return false;
    }

    if (!isRealProject) {
      showNotification(
        TEXT_EDITOR_ALERTS.INVITE_UNAVAILABLE_TITLE,
        TEXT_EDITOR_ALERTS.INVITE_UNAVAILABLE_MESSAGE,
        TOAST_TYPES.WARNING
      );
      return false;
    }

    try {
      const updatedProject = await inviteProjectCollaborator(projectId, email, accessLevel);
      setProject(normalizeProject(updatedProject));
      showNotification(
        TEXT_EDITOR_ALERTS.SHARED_TITLE,
        TEXT_EDITOR_ALERTS.sharedMessage(email),
        TOAST_TYPES.SUCCESS
      );
      return true;
    } catch (error) {
      showNotification(
        TEXT_EDITOR_ALERTS.INVITE_FAILED_TITLE,
        error.message || TEXT_EDITOR_ALERTS.INVITE_FAILED_MESSAGE,
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
      showNotification(
        IMAGE_EDITOR_ALERTS.HISTORY_LOADED_TITLE,
        IMAGE_EDITOR_ALERTS.HISTORY_LOADED_MESSAGE,
        TOAST_TYPES.INFO,
        3000
      );
    }
  }

  function handleCopyResponse(response) {
    navigator.clipboard?.writeText(response.response).catch(() => {});
    setCopiedResponseId(response.id);
    showNotification(
      TEXT_EDITOR_ALERTS.COPIED_TITLE,
      IMAGE_EDITOR_ALERTS.COPIED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
    window.setTimeout(() => setCopiedResponseId(null), 1600);
  }

  async function handleFavouriteResponse(responseId) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_HISTORY_CHANGES_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

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
          TEXT_EDITOR_ALERTS.FAVOURITE_FAILED_TITLE,
          error.message || TEXT_EDITOR_ALERTS.FAVOURITE_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    showNotification(
      nextFavouriteValue
        ? TEXT_EDITOR_ALERTS.FAVOURITE_SAVED_TITLE
        : TEXT_EDITOR_ALERTS.FAVOURITE_REMOVED_TITLE,
      nextFavouriteValue
        ? IMAGE_EDITOR_ALERTS.RESPONSE_FAVOURITE_SAVED_MESSAGE
        : IMAGE_EDITOR_ALERTS.RESPONSE_FAVOURITE_REMOVED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  async function handleUpdateResponse(responseId, nextResponseText) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_HISTORY_EDIT_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

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
          TEXT_EDITOR_ALERTS.UPDATE_FAILED_TITLE,
          error.message || IMAGE_EDITOR_ALERTS.RESPONSE_UPDATE_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    showNotification(
      TEXT_EDITOR_ALERTS.UPDATED_TITLE,
      IMAGE_EDITOR_ALERTS.UPDATED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  function requestDeleteResponse(responseId) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_HISTORY_CHANGES_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

    const response = responses.find((item) => item.id === responseId);
    if (response) {
      setPendingResponseDelete(response);
    }
  }

  async function handleDeleteResponse(responseId) {
    if (!canEditProject) {
      return;
    }

    const response = responses.find((item) => item.id === responseId);
    if (!response) {
      setPendingResponseDelete(null);
      return;
    }

    if (response?.sourceId) {
      try {
        await deleteAiResponse(response.sourceId);
      } catch (error) {
        showNotification(
          TEXT_EDITOR_ALERTS.DELETE_FAILED_TITLE,
          error.message || IMAGE_EDITOR_ALERTS.RESPONSE_DELETE_FAILED_MESSAGE,
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
    setPendingResponseDelete(null);
    showNotification(
      TEXT_EDITOR_ALERTS.DELETED_TITLE,
      IMAGE_EDITOR_ALERTS.DELETED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  function handleInsertResponse(response) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.CANVAS_EDIT_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

    if (queueUnsavedCanvasAction(() => insertResponseIntoCanvas(response))) {
      return;
    }

    insertResponseIntoCanvas(response);
  }

  function insertResponseIntoCanvas(response) {
    setPrompt(response.prompt);
    setGenerationRequest({ id: Date.now(), prompt: response.prompt });
    showNotification(
      IMAGE_EDITOR_ALERTS.INSERTED_TITLE,
      IMAGE_EDITOR_ALERTS.INSERTED_MESSAGE,
      TOAST_TYPES.SUCCESS
    );
  }

  async function handleSaveCanvas(payload, { notify = true } = {}) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.SAVE_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

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

    if (notify) {
      showNotification(
        TEXT_EDITOR_ALERTS.SAVED_TITLE,
        isRealProject
          ? IMAGE_EDITOR_ALERTS.CANVAS_SAVED_MESSAGE
          : IMAGE_EDITOR_ALERTS.CANVAS_SAVED_LOCAL_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    }
  }

  async function saveCurrentCanvas(options) {
    const payload = canvas ? JSON.stringify(canvas.toJSON()) : "{}";
    await handleSaveCanvas(payload, options);
  }

  function handleHeaderSave() {
    setIsSaving(true);
    window.setTimeout(async () => {
      try {
        await saveCurrentCanvas();
      } catch (error) {
        showNotification(
          TEXT_EDITOR_ALERTS.SAVE_FAILED_TITLE,
          error.message || IMAGE_EDITOR_ALERTS.CANVAS_SAVE_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
      } finally {
        setIsSaving(false);
      }
    }, 250);
  }

  function queueUnsavedCanvasAction(action, copy = {}) {
    if (!hasUnsavedChanges) {
      return false;
    }

    setPendingCanvasAction(() => action);
    setPendingCanvasActionCopy(copy);
    return true;
  }

  async function handleConfirmPendingAction() {
    setIsSaving(true);

    try {
      await saveCurrentCanvas({ notify: false });
      pendingCanvasAction?.();
      setPendingCanvasAction(null);
      setPendingCanvasActionCopy(null);
      showNotification(
        TEXT_EDITOR_ALERTS.SAVED_TITLE,
        IMAGE_EDITOR_ALERTS.CANVAS_SAVED_BEFORE_SWITCHING_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      setPendingCanvasAction(null);
      setPendingCanvasActionCopy(null);
      showNotification(
        TEXT_EDITOR_ALERTS.SAVE_FAILED_TITLE,
        error.message || IMAGE_EDITOR_ALERTS.CANVAS_SAVE_FAILED_BEFORE_SWITCHING_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleBackToProjects() {
    const navigateToProjects = () => router.push(ROUTES.PROJECTS);

    if (
      queueUnsavedCanvasAction(navigateToProjects, {
        description: IMAGE_EDITOR_ALERTS.UNSAVED_CANVAS_BACK_DESCRIPTION,
        title: IMAGE_EDITOR_ALERTS.UNSAVED_CANVAS_BACK_TITLE
      })
    ) {
      return;
    }

    navigateToProjects();
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
      showNotification(
        TEXT_EDITOR_ALERTS.EXPORTED_TITLE,
        IMAGE_EDITOR_ALERTS.CANVAS_JSON_EXPORTED_MESSAGE,
        TOAST_TYPES.SUCCESS,
        3000
      );
      return;
    }

    downloadDataUrl(dataUrl, `${slugify(project.title)}.png`);
    showNotification(
      TEXT_EDITOR_ALERTS.EXPORTED_TITLE,
      IMAGE_EDITOR_ALERTS.IMAGE_PNG_EXPORTED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader
        canEdit={canEditProject}
        canManageSharing={canManageSharing}
        exportOptions={[
          { label: "PNG image", value: "png" },
          { label: "Canvas JSON", value: "json" }
        ]}
        invitedUsers={invitedUsers}
        isSaving={isSaving}
        onBackToProjects={handleBackToProjects}
        onProjectUpdated={(updatedProject) => setProject(normalizeProject(updatedProject))}
        onExport={handleExport}
        onInviteUser={handleInviteUser}
        onNotify={showNotification}
        onSave={handleHeaderSave}
        project={project}
        templateHistoryOptions={templateHistoryOptions}
        statusLabel={statusLabel}
        templateInitialValues={{
          projectType: API_PROJECT_TYPES.IMAGE,
          starterPrompt: prompt
        }}
      />

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <AIHistorySidebar
          history={history}
          isCollapsed={isHistoryCollapsed}
          onDeleteHistory={requestDeleteResponse}
          onSelectHistory={handleSelectHistory}
          onToggleFavourite={handleFavouriteResponse}
          onToggleCollapsed={() => setIsHistoryCollapsed((currentValue) => !currentValue)}
          selectedHistoryId={selectedResponseId}
        />

        <main className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:p-7">
          <FabricImageEditor
            editable={canEditProject}
            generationRequest={generationRequest}
            onDirtyChange={setHasUnsavedChanges}
            onReady={setCanvas}
          />

          <aside className="grid min-w-0 content-start gap-5">
            <AIPromptPanel
              actions={textPromptActions}
              disabled={!canEditProject}
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
                  canEdit={canEditProject}
                  copied={copiedResponseId === selectedResponse.id}
                  key={selectedResponse.id}
                  onCopy={handleCopyResponse}
                  onDelete={requestDeleteResponse}
                  onFavourite={handleFavouriteResponse}
                  onInsert={handleInsertResponse}
                  onUpdate={handleUpdateResponse}
                  response={selectedResponse}
                  selected
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  {IMAGE_EDITOR_ALERTS.NO_RESPONSE_SELECTED}
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>

      {pendingCanvasAction && (
        <ConfirmDialog
          cancelLabel={IMAGE_EDITOR_ALERTS.EXIT_WITHOUT_SAVING}
          confirmLabel="Save and Continue"
          description={
            pendingCanvasActionCopy?.description ||
            IMAGE_EDITOR_ALERTS.UNSAVED_CANVAS_CONFIRM_DESCRIPTION
          }
          onCancel={() => {
            pendingCanvasAction?.();
            setPendingCanvasAction(null);
            setPendingCanvasActionCopy(null);
          }}
          onConfirm={handleConfirmPendingAction}
          title={pendingCanvasActionCopy?.title || IMAGE_EDITOR_ALERTS.UNSAVED_CANVAS_CONFIRM_TITLE}
        />
      )}
      {pendingResponseDelete && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel={TEXT_EDITOR_ALERTS.DELETE_CONFIRM_LABEL}
          description={TEXT_EDITOR_ALERTS.deleteConfirmDescription(pendingResponseDelete.prompt)}
          onCancel={() => setPendingResponseDelete(null)}
          onConfirm={() => handleDeleteResponse(pendingResponseDelete.id)}
          title={TEXT_EDITOR_ALERTS.DELETE_CONFIRM_TITLE}
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
    accessLevel: project.accessLevel || ACCESS_LEVELS.EDITOR,
    canEdit: project.canEdit !== false,
    canManageSharing: project.canManageSharing !== false,
    currentUserRole: project.currentUserRole || PROJECT_ROLES.OWNER,
    owner: project.owner,
    lastUpdated: project.updatedAt
      ? `Updated ${new Date(project.updatedAt).toLocaleString()}`
      : mockImageProject.lastUpdated,
    collaborators: project.collaborators || [],
    collaboratorPermissions: project.collaboratorPermissions || []
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatTime(value) {
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getCollaboratorAccessLevel(project, user) {
  const userId = String(user?._id || user?.id || "");
  const permission = (project.collaboratorPermissions || []).find(
    (item) => String(item.user?._id || item.user) === userId
  );

  return permission?.accessLevel;
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
