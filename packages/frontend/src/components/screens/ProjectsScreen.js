"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import { EmptyState, SectionHeader } from "../common/Cards";
import ProjectListCard from "../common/ProjectListCard";
import ProjectFormModal from "../common/ProjectFormModal";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import { DASHBOARD_TEXT } from "../../constants/dashboard";
import {
  ACCESS_LEVELS,
  API_PROJECT_TYPES,
  EDITOR_ACCESS_QUERY,
  PROJECT_TYPES
} from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { COMMON_UI_TEXT, PROJECT_ALERTS } from "../../constants/notifications";
import { useAppStore } from "../../store";

export default function ProjectsScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const projectState = useAppStore((state) => state.projectState);
  const createProject = useAppStore((state) => state.createProject);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const updateProject = useAppStore((state) => state.updateProject);
  const [editingProject, setEditingProject] = useState(null);
  const [openActionProjectId, setOpenActionProjectId] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectPendingDelete, setProjectPendingDelete] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (auth.token) {
      fetchProjects().catch(() => {});
    }
  }, [auth.token, fetchProjects]);

  useEffect(() => {
    function handleClickAway(event) {
      if (!event.target.closest("[data-project-actions]")) {
        setOpenActionProjectId(null);
      }
    }

    if (!openActionProjectId) {
      return undefined;
    }

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [openActionProjectId]);

  const projects = useMemo(() => projectState.projects.map(formatProject), [projectState.projects]);

  async function handleCreateProject(values) {
    try {
      const project = await createProject({
        title: values.title,
        description: values.description,
        category: values.category,
        type: values.type === PROJECT_TYPES.IMAGE ? API_PROJECT_TYPES.IMAGE : API_PROJECT_TYPES.TEXT
      });

      setShowProjectForm(false);
      window.sessionStorage.setItem(
        "gencontent-pending-toast",
        JSON.stringify({
          message: PROJECT_ALERTS.createdMessage(project.title),
          title: PROJECT_ALERTS.CREATED_TITLE,
          type: TOAST_TYPES.SUCCESS
        })
      );
      router.push(getProjectWorkspaceHref(formatProject(project)));
    } catch (error) {
      showNotification(
        PROJECT_ALERTS.CREATE_FAILED_TITLE,
        error.message || PROJECT_ALERTS.CREATE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    }
  }

  async function handleUpdateProject(values) {
    if (!editingProject) {
      return;
    }

    try {
      await updateProject(editingProject.id, {
        title: values.title,
        description: values.description,
        category: values.category,
        type: values.type === PROJECT_TYPES.IMAGE ? API_PROJECT_TYPES.IMAGE : API_PROJECT_TYPES.TEXT
      });
      showNotification(
        PROJECT_ALERTS.UPDATED_TITLE,
        PROJECT_ALERTS.updatedMessage(values.title),
        TOAST_TYPES.SUCCESS
      );
      setEditingProject(null);
    } catch (error) {
      showNotification(
        PROJECT_ALERTS.UPDATE_FAILED_TITLE,
        error.message || PROJECT_ALERTS.UPDATE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    }
  }

  async function handleDeleteProject() {
    if (!projectPendingDelete) {
      return;
    }

    setDeletingProjectId(projectPendingDelete.id);

    try {
      await deleteProject(projectPendingDelete.id);
      showNotification(
        PROJECT_ALERTS.DELETED_TITLE,
        PROJECT_ALERTS.deletedMessage(projectPendingDelete.title),
        TOAST_TYPES.SUCCESS
      );
      setProjectPendingDelete(null);
    } catch (error) {
      showNotification(
        PROJECT_ALERTS.DELETE_FAILED_TITLE,
        error.message || PROJECT_ALERTS.DELETE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setDeletingProjectId(null);
    }
  }

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-950">Projects</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage your text and image workspaces from one place.
          </p>
        </div>
        <div className="hidden flex-1 sm:block" />
        <Button type="button" onClick={() => setShowProjectForm(true)}>
          Create Project
        </Button>
      </header>

      <SectionHeader title="All Projects" />

      {projectState.loading && projects.length === 0 ? (
        <EmptyState
          title={PROJECT_ALERTS.LOADING_TITLE}
          description={PROJECT_ALERTS.LOADING_DESCRIPTION}
        />
      ) : projectState.error && projects.length === 0 ? (
        <EmptyState title={PROJECT_ALERTS.LOAD_FAILED_TITLE} description={projectState.error} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={DASHBOARD_TEXT.EMPTY_PROJECTS_TITLE}
          description={DASHBOARD_TEXT.EMPTY_PROJECTS_DESCRIPTION}
        />
      ) : (
        <section className="grid gap-4">
          {projects.map((project) => (
            <ProjectListCard
              active={openActionProjectId === project.id}
              icon={project.icon}
              key={project.id}
              onOpen={() => router.push(getProjectWorkspaceHref(project))}
              title={project.title}
              tone={project.tone}
              actions={
                <div className="relative flex justify-end" data-project-actions>
                  <Button
                    aria-label={`${project.title} actions`}
                    aria-expanded={openActionProjectId === project.id}
                    aria-haspopup="menu"
                    className={`border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100 ${
                      openActionProjectId === project.id
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : ""
                    }`}
                    variant="secondary"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenActionProjectId((currentId) =>
                        currentId === project.id ? null : project.id
                      );
                    }}
                  >
                    Manage
                    {openActionProjectId === project.id ? (
                      <ChevronUp aria-hidden="true" size={16} strokeWidth={2.4} />
                    ) : (
                      <ChevronDown aria-hidden="true" size={16} strokeWidth={2.4} />
                    )}
                  </Button>
                  {openActionProjectId === project.id && (
                    <div
                      className="project-actions-menu absolute right-0 top-[calc(100%+0.45rem)] z-50 w-52 rounded-lg border border-slate-200 bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.16)] before:absolute before:-top-1.5 before:right-3 before:h-3 before:w-3 before:rotate-45 before:border-l before:border-t before:border-slate-200 before:bg-white"
                      onClick={(event) => event.stopPropagation()}
                      role="menu"
                    >
                      <button
                        className="relative z-10 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
                        onClick={() => {
                          router.push(getProjectWorkspaceHref(project));
                          setOpenActionProjectId(null);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <ExternalLink aria-hidden="true" size={16} />
                        Open
                      </button>
                      <button
                        className="relative z-10 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
                        onClick={() => {
                          setEditingProject(project);
                          setOpenActionProjectId(null);
                        }}
                        role="menuitem"
                        type="button"
                        disabled={!project.canManageSharing}
                      >
                        <Pencil aria-hidden="true" size={16} />
                        Edit
                      </button>
                      {project.canDelete && (
                        <button
                          className="relative z-10 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:text-red-300"
                          disabled={deletingProjectId === project.id}
                          onClick={() => {
                            setProjectPendingDelete(project);
                            setOpenActionProjectId(null);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={16} />
                          {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              }
            >
              <p className="mt-1 text-xs text-slate-500">
                {project.category} • {project.type} Project • {project.updated}
              </p>
              {project.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p>
              )}
            </ProjectListCard>
          ))}
        </section>
      )}

      {showProjectForm && (
        <ProjectFormModal
          error={projectState.error}
          isSubmitting={projectState.loading}
          onClose={() => setShowProjectForm(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {editingProject && (
        <ProjectFormModal
          error={projectState.error}
          initialValues={editingProject}
          isSubmitting={projectState.loading}
          onClose={() => setEditingProject(null)}
          onSubmit={handleUpdateProject}
          submitLabel="Save Changes"
          title={PROJECT_ALERTS.EDIT_MODAL_TITLE}
        />
      )}

      {projectPendingDelete && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Delete Project"
          description={PROJECT_ALERTS.deleteConfirmDescription(projectPendingDelete.title)}
          isConfirming={deletingProjectId === projectPendingDelete.id}
          onCancel={() => setProjectPendingDelete(null)}
          onConfirm={handleDeleteProject}
          title={PROJECT_ALERTS.DELETE_CONFIRM_TITLE}
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
    </main>
  );
}

function formatProject(project) {
  const type = project.type === API_PROJECT_TYPES.IMAGE ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT;

  return {
    id: project._id || project.id,
    title: project.title,
    category: project.category || "Other",
    description: project.description || "",
    accessLevel: project.accessLevel,
    canDelete: project.canDelete !== false,
    canManageSharing: project.canManageSharing !== false,
    type,
    updated: formatUpdatedAt(project.updatedAt),
    icon: type === PROJECT_TYPES.IMAGE ? "▧" : "▤",
    tone: type === PROJECT_TYPES.IMAGE ? "lavender" : "mint"
  };
}

function getProjectWorkspaceHref(project) {
  const workspace =
    project.type === PROJECT_TYPES.IMAGE ? API_PROJECT_TYPES.IMAGE : API_PROJECT_TYPES.TEXT;
  const access =
    project.accessLevel === ACCESS_LEVELS.VIEWER ? `&access=${EDITOR_ACCESS_QUERY.VIEW}` : "";
  return `${ROUTES.EDITOR}?projectId=${project.id}&type=${workspace}${access}`;
}

function formatUpdatedAt(value) {
  if (!value) {
    return COMMON_UI_TEXT.UPDATED_JUST_NOW;
  }

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  if (diffInSeconds < 60) {
    return COMMON_UI_TEXT.UPDATED_JUST_NOW;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `Updated ${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `Updated ${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `Updated ${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}
