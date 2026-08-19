"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import { EmptyState, IconBadge, SectionHeader } from "../common/Cards";
import ProjectFormModal from "../common/ProjectFormModal";
import ToastNotification from "../common/ToastNotification";
import { DASHBOARD_TEXT } from "../../constants/dashboard";
import { PROJECT_TYPES } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
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
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectPendingDelete, setProjectPendingDelete] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (auth.token) {
      fetchProjects().catch(() => {});
    }
  }, [auth.token, fetchProjects]);

  const projects = useMemo(() => projectState.projects.map(formatProject), [projectState.projects]);

  async function handleCreateProject(values) {
    try {
      const project = await createProject({
        title: values.title,
        description: values.description,
        category: values.category,
        type: values.type === PROJECT_TYPES.IMAGE ? "image" : "text"
      });

      setShowProjectForm(false);
      showNotification("Project created", `"${project.title}" is ready.`, "success");
      router.push(getProjectWorkspaceHref(formatProject(project)));
    } catch (error) {
      showNotification("Create failed", error.message || "Project could not be created.", "error");
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
        type: values.type === PROJECT_TYPES.IMAGE ? "image" : "text"
      });
      showNotification("Project updated", `"${values.title}" was saved.`, "success");
      setEditingProject(null);
    } catch (error) {
      showNotification("Update failed", error.message || "Project could not be updated.", "error");
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
        "Project deleted",
        `"${projectPendingDelete.title}" was deleted.`,
        "success"
      );
      setProjectPendingDelete(null);
    } catch (error) {
      showNotification("Delete failed", error.message || "Project could not be deleted.", "error");
    } finally {
      setDeletingProjectId(null);
    }
  }

  function showNotification(title, message, type = "info", duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  function handleProjectRowKeyDown(event, project) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(getProjectWorkspaceHref(project));
    }
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

      <SectionHeader title="All Projects" action={<Link href={ROUTES.DASHBOARD}>Dashboard</Link>} />

      {projectState.loading && projects.length === 0 ? (
        <EmptyState title="Loading projects..." description="Your saved workspaces are loading." />
      ) : projectState.error && projects.length === 0 ? (
        <EmptyState title="Projects could not load." description={projectState.error} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={DASHBOARD_TEXT.EMPTY_PROJECTS_TITLE}
          description={DASHBOARD_TEXT.EMPTY_PROJECTS_DESCRIPTION}
          action={
            <Button type="button" onClick={() => setShowProjectForm(true)}>
              Create Project
            </Button>
          }
        />
      ) : (
        <section className="grid gap-4">
          {projects.map((project) => (
            <article
              className="group grid cursor-pointer gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/70 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)] focus:bg-violet-50/70 focus:outline-none focus:ring-4 focus:ring-violet-100 md:grid-cols-[2.75rem_minmax(0,1fr)_auto] md:items-center"
              key={project.id}
              onClick={() => router.push(getProjectWorkspaceHref(project))}
              onKeyDown={(event) => handleProjectRowKeyDown(event, project)}
              role="link"
              tabIndex={0}
            >
              <IconBadge tone={project.tone}>{project.icon}</IconBadge>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-bold text-slate-950 group-hover:text-violet-700">
                  {project.title}
                </strong>
                <p className="mt-1 text-xs text-slate-500">
                  {project.category} • {project.type} Project • {project.updated}
                </p>
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingProject(project);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={deletingProjectId === project.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setProjectPendingDelete(project);
                  }}
                >
                  {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(getProjectWorkspaceHref(project));
                  }}
                  type="button"
                >
                  Open
                </Button>
              </div>
            </article>
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
          title="Edit Project"
        />
      )}

      {projectPendingDelete && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Delete Project"
          description={`Delete "${projectPendingDelete.title}"? This cannot be undone.`}
          isConfirming={deletingProjectId === projectPendingDelete.id}
          onCancel={() => setProjectPendingDelete(null)}
          onConfirm={handleDeleteProject}
          title="Delete project?"
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
  const type = project.type === "image" ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT;

  return {
    id: project._id || project.id,
    title: project.title,
    category: project.category || "Other",
    description: project.description || "",
    type,
    updated: formatUpdatedAt(project.updatedAt),
    icon: type === PROJECT_TYPES.IMAGE ? "▧" : "▤",
    tone: type === PROJECT_TYPES.IMAGE ? "lavender" : "mint"
  };
}

function getProjectWorkspaceHref(project) {
  const workspace = project.type === PROJECT_TYPES.IMAGE ? "image" : "text";
  return `${ROUTES.EDITOR}?projectId=${project.id}&type=${workspace}`;
}

function formatUpdatedAt(value) {
  if (!value) {
    return "Updated just now";
  }

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  if (diffInSeconds < 60) {
    return "Updated just now";
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
