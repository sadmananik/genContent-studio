"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "../common/Button";
import { EmptyState, IconBadge, SectionHeader } from "../common/Cards";
import ProjectFormModal from "../common/ProjectFormModal";
import { DASHBOARD_TEXT } from "../../constants/dashboard";
import { PROJECT_TYPES } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function ProjectsScreen() {
  const auth = useAppStore((state) => state.auth);
  const projectState = useAppStore((state) => state.projectState);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const updateProject = useAppStore((state) => state.updateProject);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  useEffect(() => {
    if (auth.token) {
      fetchProjects().catch(() => {});
    }
  }, [auth.token, fetchProjects]);

  const projects = useMemo(() => projectState.projects.map(formatProject), [projectState.projects]);

  async function handleUpdateProject(values) {
    if (!editingProject) {
      return;
    }

    await updateProject(editingProject.id, {
      title: values.title,
      description: values.description,
      category: values.category,
      type: values.type === PROJECT_TYPES.IMAGE ? "image" : "text"
    });
    setEditingProject(null);
  }

  async function handleDeleteProject(project) {
    const confirmed = window.confirm(`Delete "${project.title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeletingProjectId(project.id);

    try {
      await deleteProject(project.id);
    } finally {
      setDeletingProjectId(null);
    }
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <h1 className="m-0 text-2xl font-bold text-slate-950">Projects</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage your text and image workspaces from one place.
        </p>
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
          action={<Link href={ROUTES.DASHBOARD}>Create from Dashboard</Link>}
        />
      ) : (
        <section className="grid gap-4">
          {projects.map((project) => (
            <article
              className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)] md:grid-cols-[2.75rem_minmax(0,1fr)_auto] md:items-center"
              key={project.id}
            >
              <IconBadge tone={project.tone}>{project.icon}</IconBadge>
              <div className="min-w-0">
                <Link
                  className="block truncate text-sm font-bold text-slate-950 hover:text-violet-600"
                  href={getProjectWorkspaceHref(project)}
                >
                  {project.title}
                </Link>
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
                  onClick={() => setEditingProject(project)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={deletingProjectId === project.id}
                  onClick={() => handleDeleteProject(project)}
                >
                  {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                </Button>
                <Link
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-transparent bg-gradient-to-br from-violet-500 to-indigo-600 px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(101,69,246,0.24)] transition-colors hover:from-violet-600 hover:to-indigo-700"
                  href={getProjectWorkspaceHref(project)}
                >
                  Open
                </Link>
              </div>
            </article>
          ))}
        </section>
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
