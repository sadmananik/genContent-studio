"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import TextWorkspaceHeader from "../text-workspace/TextWorkspaceHeader";
import AIPromptPanel from "../text-workspace/AIPromptPanel";
import FabricImageEditor from "../image-workspace/FabricImageEditor";
import { mockImageProject } from "../image-workspace/mockImageWorkspaceData";
import { mockPromptActions } from "../text-workspace/mockTextWorkspaceData";
import { apiRequest } from "../../lib/apiClient";
import { useAppStore } from "../../store";

export default function ImageEditorScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || mockImageProject.id;
  const isRealProject = /^[a-f\d]{24}$/i.test(projectId);
  const fetchProjectById = useAppStore((state) => state.fetchProjectById);
  const sendImageGenerationRequest = useAppStore((state) => state.sendImageGenerationRequest);
  const [canvas, setCanvas] = useState(null);
  const [generationRequest, setGenerationRequest] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [localInvites, setLocalInvites] = useState([]);
  const [notification, setNotification] = useState(null);
  const [prompt, setPrompt] = useState("Create a clean product launch social post.");
  const [project, setProject] = useState(mockImageProject);
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

    const savedCanvas = window.localStorage.getItem(`gencontent-image-workspace-${projectId}`);

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
    window.setTimeout(() => {
      setGenerationRequest({ id: Date.now(), prompt });
      setIsGenerating(false);
      showNotification(
        "Image generated",
        "Demo image concept added to the canvas.",
        TOAST_TYPES.SUCCESS
      );
    }, 800);
  }

  function handleQuickAction(action) {
    setPrompt(`${action}: ${prompt}`.slice(0, 1200));
  }

  function handleInviteUser(emailValue) {
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

    setLocalInvites((currentInvites) => [...currentInvites, { email, name: nameFromEmail(email) }]);
    showNotification("Shared", `Invite prepared for ${email}.`, TOAST_TYPES.SUCCESS);
    return true;
  }

  async function handleSaveCanvas(payload) {
    window.localStorage.setItem(`gencontent-image-workspace-${projectId}`, payload);

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

  function handleHeaderSave() {
    setIsSaving(true);
    window.setTimeout(async () => {
      const payload = canvas ? JSON.stringify(canvas.toJSON()) : "{}";
      try {
        await handleSaveCanvas(payload);
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

  function handleCanvasExport(dataUrl) {
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

      <main className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:p-7">
        <FabricImageEditor
          generationRequest={generationRequest}
          onDirtyChange={setHasUnsavedChanges}
          onExport={handleCanvasExport}
          onReady={setCanvas}
          onSave={handleSaveCanvas}
        />

        <aside className="grid content-start gap-4">
          <AIPromptPanel
            actions={mockPromptActions}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onPromptChange={setPrompt}
            onQuickAction={handleQuickAction}
            prompt={prompt}
          />
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
            <h2 className="text-base font-bold text-slate-950">Image Generation Draft</h2>
            <p className="mt-2 text-sm text-slate-500">
              Demo image editing is powered by Fabric.js. AI image generation and backend save APIs
              can connect here later.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="rounded-md bg-slate-50 p-3">
                Prompt: Create a clean product launch social post with bold headline text.
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                Try: drag objects, resize corners, rotate handles, add text, and export PNG.
              </div>
            </div>
          </section>
        </aside>
      </main>

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

function nameFromEmail(email) {
  return email
    .replace(/@.*/, "")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
    .join(" ");
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
