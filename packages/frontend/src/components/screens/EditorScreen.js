"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "../common/ConfirmDialog";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import ImageEditorScreen from "./ImageEditorScreen";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import AIHistorySidebar from "../text-workspace/AIHistorySidebar";
import AIResponseCard from "../text-workspace/AIResponseCard";
import EditorToolbar from "../text-workspace/EditorToolbar";
import TipTapEditor from "../text-workspace/TipTapEditor";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import {
  ACCESS_LEVELS,
  AI_CONTENT_TYPES,
  API_ERROR_MESSAGES,
  API_PROJECT_TYPES,
  PERMISSION_MESSAGES,
  PROJECT_ROLES
} from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import {
  AI_COLLABORATION_ALERTS,
  COLLABORATION_ACTIVITY_ALERTS,
  TEXT_EDITOR_ALERTS
} from "../../constants/notifications";
import { apiRequest } from "../../lib/apiClient";
import { getAuthSession } from "../../lib/auth";
import { createCollaborationProvider } from "../../lib/collaboration";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceType = searchParams.get("type");
  const requestedAccess = searchParams.get("access");

  if (workspaceType === API_PROJECT_TYPES.IMAGE) {
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
  const setActiveCollaborators = useAppStore((state) => state.setActiveCollaborators);
  const setSocketConnected = useAppStore((state) => state.setSocketConnected);
  const setCollaborationError = useAppStore((state) => state.setCollaborationError);
  const collaborationState = useAppStore((state) => state.collaborationState);
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
  const [pendingResponseDelete, setPendingResponseDelete] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [collaborationProvider, setCollaborationProvider] = useState(null);
  const [collaborationReady, setCollaborationReady] = useState(false);
  const lastPersistedContentHtmlRef = useRef(normalizeEditorHtml(defaultTextProject.content));
  const projectStarterContentRef = useRef("");
  const restoredHistoryResponseRef = useRef(null);
  const editorRef = useRef(null);
  const projectRef = useRef(project);
  const responsesRef = useRef(responses);
  const selectedHistoryIdRef = useRef(selectedHistoryId);
  const editorContentRef = useRef(editorContent);
  const lastPermissionNotificationRef = useRef(null);
  projectRef.current = project;
  editorRef.current = editor;
  responsesRef.current = responses;
  selectedHistoryIdRef.current = selectedHistoryId;
  editorContentRef.current = editorContent;
  const wordCount = useMemo(() => countWords(editorContent.text), [editorContent.text]);
  const characterCount = useMemo(() => countCharacters(editorContent.text), [editorContent.text]);
  const readingTimeLabel = useMemo(() => getReadingTimeLabel(wordCount), [wordCount]);
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
  const templateHistoryOptions = useMemo(
    () =>
      responses.map((response) => ({
        id: response.id,
        label: `${response.promptPreview || getPromptPreview(response.prompt)} • ${
          response.timestamp
        }`,
        prompt: response.prompt,
        content: response.response
      })),
    [responses]
  );
  const selectedResponse =
    responses.find((response) => response.id === selectedHistoryId) || responses[0] || null;
  const canEditProject = project.canEdit !== false;
  const canManageSharing =
    project.canManageSharing !== false && project.currentUserRole !== PROJECT_ROLES.COLLABORATOR;

  const handleCollaborationEvent = useCallback(
    (event, payload) => {
      console.log(`Collaboration event: ${event}`, payload);
      if (event === "project:joined" || event === "project:presence-updated") {
        setActiveCollaborators(payload?.collaborators || []);
      }

      if (event === "project:joined") {
        setCollaborationReady(true);
      }

      if (event === "connection-error") {
        setSocketConnected(false);
        setCollaborationError(payload);
      }

      const isCurrentProject = String(payload?.projectId) === String(projectId);
      const currentUserId = getCurrentUserId();

      if (event === "project:sharing-updated" && isCurrentProject) {
        const permissionChanges = Array.isArray(payload.permissionChanges)
          ? payload.permissionChanges
          : [];
        const changedPermission = permissionChanges.find(
          (permission) => getIdString(permission.userId) === currentUserId
        );
        const sharedPermission = (payload.collaboratorPermissions || []).find(
          (permission) => getIdString(permission.user?._id || permission.user) === currentUserId
        );

        const currentProject = projectRef.current;
        const isCollaborator = currentProject.currentUserRole !== PROJECT_ROLES.OWNER;
        const nextAccessLevel = changedPermission?.accessLevel || sharedPermission?.accessLevel;

        if (isCollaborator && nextAccessLevel && nextAccessLevel !== currentProject.accessLevel) {
          notifyPermissionChange(nextAccessLevel);
        }

        setProject((projectState) => ({
          ...projectState,
          accessLevel: isCollaborator
            ? nextAccessLevel || projectState.accessLevel
            : projectState.accessLevel,
          canEdit:
            isCollaborator && nextAccessLevel
              ? nextAccessLevel === ACCESS_LEVELS.EDITOR
              : projectState.canEdit,
          collaborators: payload.collaborators || projectState.collaborators,
          collaboratorPermissions:
            payload.collaboratorPermissions || projectState.collaboratorPermissions
        }));
      }

      console.log(`Collaboration eventeee: ${event}`, payload);

      if (
        event === "project:permission-updated" &&
        isCurrentProject &&
        getIdString(payload?.userId) === currentUserId
      ) {
        notifyPermissionChange(payload.accessLevel);
        setProject((currentProject) => ({
          ...currentProject,
          accessLevel: payload.accessLevel,
          canEdit: payload.accessLevel === ACCESS_LEVELS.EDITOR
        }));
      }

      function notifyPermissionChange(accessLevel) {
        if (!accessLevel) {
          return;
        }

        const notificationKey = `${projectId}:${currentUserId}:${accessLevel}`;
        const now = Date.now();

        if (
          lastPermissionNotificationRef.current?.key === notificationKey &&
          now - lastPermissionNotificationRef.current.timestamp < 1500
        ) {
          return;
        }

        lastPermissionNotificationRef.current = { key: notificationKey, timestamp: now };
        showNotification(
          TEXT_EDITOR_ALERTS.COLLABORATION_PERMISSION_CHANGED_TITLE,
          TEXT_EDITOR_ALERTS.COLLABORATION_PERMISSION_CHANGED_MESSAGE(accessLevel),
          accessLevel === ACCESS_LEVELS.EDITOR ? TOAST_TYPES.SUCCESS : TOAST_TYPES.WARNING,
          7000
        );
      }

      if (
        event === "project:access-revoked" &&
        getIdString(payload?.userId) === getCurrentUserId()
      ) {
        showNotification(
          "Access removed",
          "You no longer have access to this project.",
          TOAST_TYPES.ERROR
        );
        router.push(ROUTES.SHARED);
      }

      if (event === "ai:generation-started" && payload?.projectId === projectId) {
        showNotification(
          AI_COLLABORATION_ALERTS.GENERATION_STARTED_TITLE,
          AI_COLLABORATION_ALERTS.GENERATION_STARTED_MESSAGE(
            payload.user?.name || "A collaborator",
            payload.prompt || "a new prompt"
          ),
          TOAST_TYPES.INFO,
          7000
        );
      }

      if (event === "ai:generation-finished" && payload?.projectId === projectId) {
        showNotification(
          AI_COLLABORATION_ALERTS.GENERATION_FINISHED_TITLE,
          AI_COLLABORATION_ALERTS.GENERATION_FINISHED_MESSAGE(
            payload.user?.name || "A collaborator"
          ),
          TOAST_TYPES.SUCCESS,
          5000
        );
      }

      if (event === "ai:response-created" && payload?.projectId === projectId && payload.chat) {
        const response = formatChatAsResponse(payload.chat);
        setResponses((currentResponses) =>
          currentResponses.some((item) => item.id === response.id)
            ? currentResponses
            : [response, ...currentResponses]
        );
      }

      if (event === "project:user-joined" && payload?.projectId === projectId) {
        showNotification(
          COLLABORATION_ACTIVITY_ALERTS.USER_JOINED_TITLE,
          COLLABORATION_ACTIVITY_ALERTS.USER_JOINED_MESSAGE(
            payload.user?.name || payload.user?.email || "A collaborator"
          ),
          TOAST_TYPES.INFO,
          4000
        );
      }

      if (event === "project:user-left" && payload?.projectId === projectId) {
        showNotification(
          COLLABORATION_ACTIVITY_ALERTS.USER_LEFT_TITLE,
          COLLABORATION_ACTIVITY_ALERTS.USER_LEFT_MESSAGE(
            payload.user?.name || payload.user?.email || "A collaborator"
          ),
          TOAST_TYPES.INFO,
          4000
        );
      }

      if (event === "ai:response-deleted" && payload?.projectId === projectId) {
        const deletedResponse = responsesRef.current.find(
          (item) => item.sourceId === payload.chatId
        );
        setResponses((currentResponses) =>
          currentResponses.filter((item) => item.sourceId !== payload.chatId)
        );
        setSelectedHistoryId((currentId) => (currentId === payload.chatId ? null : currentId));

        if (
          payload.chatId === selectedHistoryIdRef.current ||
          (deletedResponse &&
            isEditorShowingResponse(
              deletedResponse,
              editorRef.current?.getHTML() || editorContentRef.current.html
            ))
        ) {
          setPrompt(starterPrompt);
          clearEditorContent();
        }
        showNotification(
          COLLABORATION_ACTIVITY_ALERTS.RESPONSE_DELETED_TITLE,
          COLLABORATION_ACTIVITY_ALERTS.RESPONSE_DELETED_MESSAGE(
            payload.user?.name || "A collaborator",
            getPromptPreview(payload.prompt)
          ),
          TOAST_TYPES.INFO,
          4000
        );
      }
    },
    [projectId, router, setActiveCollaborators, setCollaborationError, setSocketConnected]
  );

  useEffect(() => {
    if (!isRealProject || isLoadingContent) {
      return undefined;
    }

    const session = getAuthSession();
    if (!session?.token) {
      return undefined;
    }

    const provider = createCollaborationProvider({
      onEvent: handleCollaborationEvent,
      projectId,
      token: session.token,
      user: session.user
    });
    setCollaborationReady(false);
    setCollaborationProvider(provider);
    provider.socket.on("connect", () => setSocketConnected(true));
    provider.connect();

    return () => {
      provider.destroy();
      setCollaborationProvider(null);
      setCollaborationReady(false);
      setActiveCollaborators([]);
      setSocketConnected(false);
    };
  }, [
    handleCollaborationEvent,
    isLoadingContent,
    isRealProject,
    projectId,
    setActiveCollaborators,
    setSocketConnected
  ]);
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
          projectStarterContentRef.current = loadedProject.starterContent || "";
          if (loadedProject.starterPrompt) {
            setPrompt(loadedProject.starterPrompt);
          }
          if (typeof loadedProject.starterContent === "string" && loadedProject.starterContent) {
            setEditorContent({
              html: loadedProject.starterContent,
              text: stripHtml(loadedProject.starterContent)
            });
          }
        }
      })
      .catch((error) => {
        if (isActive) {
          showNotification(
            TEXT_EDITOR_ALERTS.PROJECT_LOAD_FAILED_TITLE,
            error.message || TEXT_EDITOR_ALERTS.PROJECT_LOAD_FAILED_MESSAGE,
            TOAST_TYPES.ERROR
          );
        }
      });

    apiRequest(`/api/text-content/${projectId}`)
      .then((textContent) => {
        if (!isActive) {
          return;
        }

        const html =
          typeof textContent.content === "string" && textContent.content
            ? textContent.content
            : projectStarterContentRef.current;

        if (!html && projectStarterContentRef.current === "") {
          setHasUnsavedChanges(false);
          return;
        }
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

        if (error.message === API_ERROR_MESSAGES.TEXT_CONTENT_NOT_FOUND) {
          lastPersistedContentHtmlRef.current = "";
          setEditorContent({ html: "", text: "" });
          setHasUnsavedChanges(false);

          if (editor) {
            editor.commands.clearContent(false);
          }
          return;
        }

        setSaveError(error.message || TEXT_EDITOR_ALERTS.CONTENT_LOAD_FAILED_MESSAGE);
        showNotification(
          TEXT_EDITOR_ALERTS.CONTENT_LOAD_FAILED_TITLE,
          error.message || TEXT_EDITOR_ALERTS.CONTENT_LOAD_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingContent(false);
        }
      });

    setSelectedHistoryId(null);
    restoredHistoryResponseRef.current = null;
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
  }, [clearAiError, fetchProjectById, fetchProjectChatHistory, isRealProject, projectId]);

  useEffect(() => {
    if (!isRealProject) {
      return;
    }

    const realResponses = aiState.chatHistory
      .filter((chat) => chat.contentType === AI_CONTENT_TYPES.TEXT)
      .map(formatChatAsResponse);
    setResponses(realResponses);
    setSelectedHistoryId(realResponses[0]?.id || null);

    const latestResponse = realResponses[0];
    if (
      !isLoadingContent &&
      !editorContent.text.trim() &&
      latestResponse &&
      restoredHistoryResponseRef.current !== latestResponse.id
    ) {
      restoredHistoryResponseRef.current = latestResponse.id;
      replaceEditorWithResponse(latestResponse);
    }
  }, [aiState.chatHistory, editorContent.text, isLoadingContent, isRealProject]);

  async function handleGenerate(promptOverride) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_GENERATION_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

    const trimmedPrompt = String(promptOverride || prompt || "").trim();

    if (!trimmedPrompt) {
      showNotification(
        TEXT_EDITOR_ALERTS.PROMPT_REQUIRED_TITLE,
        TEXT_EDITOR_ALERTS.PROMPT_REQUIRED_MESSAGE,
        TOAST_TYPES.ERROR
      );
      return;
    }

    clearAiError();
    setIsGenerating(true);

    try {
      const currentUser = getAuthSession()?.user;
      collaborationProvider?.socket.emit("project:event", {
        event: "ai:generation-started",
        payload: {
          projectId,
          prompt: getPromptPreview(trimmedPrompt),
          user: { id: currentUser?.id, name: currentUser?.name || currentUser?.email }
        }
      });
      const result = await generateTextFromPrompt({
        project: isRealProject ? projectId : undefined,
        prompt: trimmedPrompt
      });
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
      replaceEditorWithResponse(response);
      showNotification(
        TEXT_EDITOR_ALERTS.AI_GENERATED_TITLE,
        TEXT_EDITOR_ALERTS.AI_GENERATED_MESSAGE,
        TOAST_TYPES.SUCCESS
      );

      if (isRealProject) {
        try {
          const savedResponse = await saveAiResponse({
            project: projectId,
            prompt: trimmedPrompt,
            response: generatedText,
            contentType: AI_CONTENT_TYPES.TEXT
          });
          const formattedResponse = formatChatAsResponse(savedResponse);

          collaborationProvider?.socket.emit("project:event", {
            event: "ai:generation-finished",
            payload: {
              projectId,
              user: { id: currentUser?.id, name: currentUser?.name || currentUser?.email }
            }
          });

          setResponses((currentResponses) =>
            currentResponses.map((item) =>
              item.id === responseId ? { ...formattedResponse, timestamp: "Just now" } : item
            )
          );
          setSelectedHistoryId(formattedResponse.id);
        } catch (persistError) {
          showNotification(
            TEXT_EDITOR_ALERTS.SAVED_LOCAL_ONLY_TITLE,
            persistError.message || TEXT_EDITOR_ALERTS.SAVED_LOCAL_ONLY_MESSAGE,
            TOAST_TYPES.INFO
          );
        }
      }
    } catch (error) {
      showNotification(
        TEXT_EDITOR_ALERTS.GENERATION_FAILED_TITLE,
        error.message || TEXT_EDITOR_ALERTS.GENERATION_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleQuickAction(action) {
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.AI_ACTIONS_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

    const sourceContent = (getSelectedEditorText(editor) || editorContent.text).trim();

    if (!sourceContent) {
      showNotification(
        TEXT_EDITOR_ALERTS.CONTENT_REQUIRED_TITLE,
        TEXT_EDITOR_ALERTS.CONTENT_REQUIRED_MESSAGE,
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
    if (!canEditProject) {
      showNotification(
        PERMISSION_MESSAGES.VIEW_ONLY_TITLE,
        PERMISSION_MESSAGES.SAVE_DISABLED,
        TOAST_TYPES.INFO
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveCurrentDraft();
      lastPersistedContentHtmlRef.current = normalizeEditorHtml(editorContent.html);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      showNotification(
        TEXT_EDITOR_ALERTS.SAVED_TITLE,
        isRealProject
          ? TEXT_EDITOR_ALERTS.SAVE_PROJECT_MESSAGE
          : TEXT_EDITOR_ALERTS.SAVE_LOCAL_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      setSaveError(error.message || TEXT_EDITOR_ALERTS.SAVE_FAILED_MESSAGE);
      showNotification(
        TEXT_EDITOR_ALERTS.SAVE_FAILED_TITLE,
        error.message || TEXT_EDITOR_ALERTS.SAVE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyResponse(response) {
    await copyText(response.response);
    setCopiedResponseId(response.id);
    showNotification(
      TEXT_EDITOR_ALERTS.COPIED_TITLE,
      TEXT_EDITOR_ALERTS.COPIED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
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
        ? TEXT_EDITOR_ALERTS.FAVOURITE_SAVED_MESSAGE
        : TEXT_EDITOR_ALERTS.FAVOURITE_REMOVED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  async function handleUpdateResponse(responseId, updatedResponse) {
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
        response.id === responseId ? { ...response, response: updatedResponse } : response
      )
    );

    if (selectedHistoryId === responseId && response) {
      replaceEditorWithResponse({ ...response, response: updatedResponse });
    }

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
          TEXT_EDITOR_ALERTS.UPDATE_FAILED_TITLE,
          error.message || TEXT_EDITOR_ALERTS.UPDATE_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    showNotification(
      TEXT_EDITOR_ALERTS.UPDATED_TITLE,
      TEXT_EDITOR_ALERTS.UPDATED_MESSAGE,
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

    if (isRealProject && response?.sourceId) {
      try {
        await deleteAiResponse(response.sourceId);
      } catch (error) {
        showNotification(
          TEXT_EDITOR_ALERTS.DELETE_FAILED_TITLE,
          error.message || TEXT_EDITOR_ALERTS.DELETE_FAILED_MESSAGE,
          TOAST_TYPES.ERROR
        );
        return;
      }
    }

    const nextResponses = responses.filter((item) => item.id !== responseId);
    const isDeletingSelectedResponse = selectedHistoryId === responseId;

    setResponses(nextResponses);
    setSelectedHistoryId((currentSelectedId) =>
      currentSelectedId === responseId ? null : currentSelectedId
    );
    setPendingResponseDelete(null);

    if (isDeletingSelectedResponse) {
      setPrompt(starterPrompt);
      clearEditorContent();
    } else if (
      response &&
      isEditorShowingResponse(response, editorRef.current?.getHTML() || editorContent.html)
    ) {
      clearEditorContent();
    }

    showNotification(
      TEXT_EDITOR_ALERTS.DELETED_TITLE,
      TEXT_EDITOR_ALERTS.DELETED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  async function handleInviteUser(emailValue, accessLevel) {
    if (!canManageSharing) {
      showNotification(
        TEXT_EDITOR_ALERTS.SHARING_UNAVAILABLE_TITLE,
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

  function handleExport(format) {
    const filename = slugify(project.title);

    if (format === "pdf") {
      downloadBlob(createPdfBlob(project.title, editorContent.text), `${filename}.pdf`);
      showNotification(
        TEXT_EDITOR_ALERTS.EXPORTED_TITLE,
        TEXT_EDITOR_ALERTS.EXPORT_PDF_MESSAGE,
        TOAST_TYPES.SUCCESS,
        3000
      );
      return;
    }

    downloadBlob(
      new Blob([`${project.title}\n\n${editorContent.text}`], { type: "text/plain;charset=utf-8" }),
      `${filename}.txt`
    );
    showNotification(
      TEXT_EDITOR_ALERTS.EXPORTED_TITLE,
      TEXT_EDITOR_ALERTS.EXPORT_TEXT_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  function handleSelectHistory(historyId) {
    if (selectedHistoryId === historyId) {
      return;
    }

    const responseItem = responses.find((response) => response.id === historyId);

    setSelectedHistoryId(historyId);

    if (responseItem) {
      setPrompt(responseItem.prompt);
      replaceEditorWithResponse(responseItem);
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
      showNotification(
        TEXT_EDITOR_ALERTS.SAVED_TITLE,
        TEXT_EDITOR_ALERTS.SWITCH_SAVE_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      setSaveError(error.message || TEXT_EDITOR_ALERTS.DRAFT_SAVE_FAILED_MESSAGE);
      showNotification(
        TEXT_EDITOR_ALERTS.SAVE_FAILED_TITLE,
        error.message || TEXT_EDITOR_ALERTS.DRAFT_SAVE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleBackToProjects() {
    const navigateToProjects = () => router.push(ROUTES.PROJECTS);

    if (
      queueUnsavedAction(navigateToProjects, {
        description: TEXT_EDITOR_ALERTS.UNSAVED_BACK_DESCRIPTION,
        title: TEXT_EDITOR_ALERTS.UNSAVED_BACK_TITLE
      })
    ) {
      return;
    }

    navigateToProjects();
  }

  async function saveCurrentDraft() {
    if (isRealProject) {
      await sendTextGenerationRequest({
        project: projectId,
        content: editorContent.html
      });
      recordWorkspaceAudit("ai_content_saved", {
        aiChatId: selectedResponse?.sourceId,
        prompt: selectedResponse?.prompt || prompt,
        contentType: AI_CONTENT_TYPES.TEXT
      });
    } else {
      window.localStorage.setItem("gencontent-demo-text-workspace", JSON.stringify(savePayload));
    }
  }

  function insertTextIntoEditor(value) {
    const html = textToHtml(value);

    if (!editorRef.current) {
      setEditorContent({ html, text: String(value || "") });
      setHasUnsavedChanges(hasEditorContentChanged(html, lastPersistedContentHtmlRef.current));
      return;
    }

    editorRef.current.commands.setContent(html, true);
    editorRef.current.commands.focus("end");
    const nextHtml = editorRef.current.getHTML();

    setEditorContent({ html: nextHtml, text: editor.getText() });
    setHasUnsavedChanges(hasEditorContentChanged(nextHtml, lastPersistedContentHtmlRef.current));
    setSaveError(null);
  }

  function replaceEditorWithResponse(response) {
    if (!response) {
      return;
    }

    insertTextIntoEditor(response.response);
    recordWorkspaceAudit("ai_content_inserted", {
      aiChatId: response.sourceId,
      contentType: AI_CONTENT_TYPES.TEXT,
      prompt: response.prompt
    });
  }

  function recordWorkspaceAudit(actionType, metadata) {
    if (!isRealProject) {
      return;
    }

    apiRequest(`/api/projects/${projectId}/audit-history`, {
      method: "POST",
      body: JSON.stringify({ actionType, metadata, workspace: "text" })
    }).catch(() => {});
  }

  function clearEditorContent() {
    if (editorRef.current) {
      editorRef.current.commands.clearContent(true);
    }

    setEditorContent({ html: "", text: "" });
    setHasUnsavedChanges(hasEditorContentChanged("", lastPersistedContentHtmlRef.current));
    setSaveError(null);
  }

  return (
    <section className="min-h-screen overflow-hidden bg-slate-50">
      <TextWorkspaceHeader
        activeCollaborators={collaborationState.activeCollaborators}
        canEdit={canEditProject}
        canManageSharing={canManageSharing}
        invitedUsers={invitedUsers}
        isSaving={isSaving}
        onBackToProjects={handleBackToProjects}
        onProjectUpdated={(updatedProject) => setProject(normalizeProject(updatedProject))}
        onExport={handleExport}
        onInviteUser={handleInviteUser}
        onNotify={showNotification}
        onSave={handleSave}
        project={project}
        templateHistoryOptions={templateHistoryOptions}
        statusLabel={statusLabel}
        templateInitialValues={{
          projectType: API_PROJECT_TYPES.TEXT,
          starterContent: editorContent.html,
          starterPrompt: prompt
        }}
      />

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <AIHistorySidebar
          error={historyError}
          history={history}
          isCollapsed={isHistoryCollapsed}
          isLoading={isLoadingHistory}
          onDeleteHistory={requestDeleteResponse}
          onSelectHistory={handleSelectHistory}
          onToggleFavourite={handleFavouriteResponse}
          onToggleCollapsed={() => setIsHistoryCollapsed((currentValue) => !currentValue)}
          selectedHistoryId={selectedHistoryId}
        />

        <main className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:p-7">
          <section className="grid min-w-0 gap-5">
            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
              <EditorToolbar disabled={!canEditProject} editor={editor} />
              <div
                className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                  saveError
                    ? "text-red-700"
                    : hasUnsavedChanges || isSaving
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
              >
                {statusLabel} • {wordCount} words • {characterCount} characters • {readingTimeLabel}
              </div>
              <TipTapEditor
                collaborationProvider={collaborationReady ? collaborationProvider : null}
                key={`${project.id}-${collaborationReady ? "shared" : "local"}`}
                editorKey={`${project.id}-${collaborationReady ? "shared" : "local"}`}
                editable={canEditProject}
                initialContent={editorContent.html}
                onContentChange={handleEditorChange}
                onEditorReady={setEditor}
              />
            </article>
          </section>

          <aside className="grid min-w-0 content-start gap-5">
            <AIPromptPanel
              actions={textPromptActions}
              disabled={!canEditProject}
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
                  canEdit={canEditProject}
                  copied={copiedResponseId === selectedResponse.id}
                  key={selectedResponse.id}
                  onCopy={handleCopyResponse}
                  onDelete={requestDeleteResponse}
                  onFavourite={handleFavouriteResponse}
                  onUpdate={handleUpdateResponse}
                  response={selectedResponse}
                  selected
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  {TEXT_EDITOR_ALERTS.NO_RESPONSE_SELECTED}
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>
      {pendingEditorAction && (
        <ConfirmDialog
          cancelLabel={TEXT_EDITOR_ALERTS.EXIT_WITHOUT_SAVING}
          confirmLabel="Save and Continue"
          description={
            pendingEditorActionCopy?.description ||
            "Your current editor content has unsaved changes. Save this draft before continuing?"
          }
          onCancel={() => {
            pendingEditorAction?.();
            setPendingEditorAction(null);
            setPendingEditorActionCopy(null);
          }}
          onConfirm={handleConfirmPendingAction}
          title={pendingEditorActionCopy?.title || "Save changes before continuing?"}
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
    accessLevel: project.accessLevel || ACCESS_LEVELS.EDITOR,
    canEdit: project.canEdit !== false,
    canManageSharing: project.canManageSharing !== false,
    currentUserRole: project.currentUserRole || PROJECT_ROLES.OWNER,
    owner: project.owner,
    lastUpdated: project.updatedAt
      ? `Updated ${new Date(project.updatedAt).toLocaleString()}`
      : defaultTextProject.lastUpdated,
    collaborators: project.collaborators || [],
    collaboratorPermissions: project.collaboratorPermissions || []
  };
}

function getCurrentUserId() {
  const user = getAuthSession()?.user;
  return getIdString(user?.id || user?._id);
}

function getIdString(value) {
  return String(value?._id || value?.id || value || "");
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

function countCharacters(value) {
  return String(value || "").replace(/\s/g, "").length;
}

function getReadingTimeLabel(wordCount) {
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
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

function isEditorShowingResponse(response, editorHtml) {
  return normalizeEditorHtml(editorHtml) === normalizeEditorHtml(textToHtml(response.response));
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
    return TEXT_EDITOR_ALERTS.CONTENT_LOAD_STATUS;
  }

  if (isSaving) {
    return TEXT_EDITOR_ALERTS.SAVING_STATUS;
  }

  if (saveError) {
    return TEXT_EDITOR_ALERTS.SAVE_FAILED_STATUS;
  }

  if (hasUnsavedChanges) {
    return TEXT_EDITOR_ALERTS.UNSAVED_CHANGES_STATUS;
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
    .replaceAll("'", "&#039;");
}

function textToHtml(value) {
  const lines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];
  let listType = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push(`<p>${formatInlineMarkdown(paragraphLines.join("<br>"))}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      `<${listType}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listType}>`
    );
    listItems = [];
    listType = null;
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
    const unorderedListMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      return;
    }

    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h${headingMatch[1].length}>${formatInlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>`
      );
      return;
    }

    if (unorderedListMatch || orderedListMatch) {
      flushParagraph();

      const nextListType = unorderedListMatch ? "ul" : "ol";

      if (listType && listType !== nextListType) {
        flushList();
      }

      listType = nextListType;
      listItems.push(formatInlineMarkdown((unorderedListMatch || orderedListMatch)[1]));
      return;
    }

    flushList();
    paragraphLines.push(trimmedLine);
  });

  flushParagraph();
  flushList();

  if (blocks.length === 0) {
    return "";
  }

  return blocks.join("");
}

function formatInlineMarkdown(value) {
  const tokens = [];
  const escapedValue = escapeHtml(value).replace(
    /`([^`]+)`/g,
    (_, code) => `@@CODE${tokens.push(`<code>${code}</code>`) - 1}@@`
  );

  return escapedValue
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/@@CODE(\d+)@@/g, (_, index) => tokens[Number(index)] || "");
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getCollaboratorAccessLevel(project, user) {
  const userId = String(user?._id || user?.id || "");
  const permission = (project.collaboratorPermissions || []).find(
    (item) => String(item.user?._id || item.user) === userId
  );

  return permission?.accessLevel;
}

function createPdfBlob(title, text) {
  const bodyLines = wrapPdfText(text || "", 82);
  const linesPerPage = 46;
  const titleLines = wrapPdfText(title || "Text Export", 54);
  const firstPageBodyCapacity = Math.max(1, linesPerPage - titleLines.length - 1);
  const pageChunks = [
    bodyLines.slice(0, firstPageBodyCapacity),
    ...chunkArray(bodyLines.slice(firstPageBodyCapacity), linesPerPage)
  ].filter((chunk, index) => chunk.length > 0 || index === 0);
  const pageCount = Math.max(1, pageChunks.length);
  const fontObjectNumber = 3 + pageCount * 2;
  const pageObjectNumbers = Array.from({ length: pageCount }, (_, index) => 3 + index);
  const contentObjectNumbers = Array.from(
    { length: pageCount },
    (_, index) => 3 + pageCount + index
  );
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageCount} >>`
  ];

  pageChunks.forEach((chunk, index) => {
    const pageLines = [];

    if (index === 0) {
      pageLines.push(...titleLines, "");
    }

    pageLines.push(...chunk);

    const contentLines = ["BT", "/F1 12 Tf", "14 TL", "72 760 Td"];
    pageLines.forEach((line, lineIndex) => {
      if (index === 0 && lineIndex < titleLines.length) {
        if (lineIndex === 0) {
          contentLines.push("/F1 16 Tf");
        }
      }

      if (index === 0 && lineIndex === titleLines.length) {
        contentLines.push("/F1 12 Tf");
      }

      contentLines.push(`(${escapePdfText(line)}) Tj`);

      if (lineIndex < pageLines.length - 1) {
        contentLines.push("T*");
      }
    });
    contentLines.push("ET");

    const contentStream = contentLines.join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumbers[index]} 0 R >>`
    );
    objects.push(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

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

function chunkArray(values, size) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks.length > 0 ? chunks : [[]];
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
