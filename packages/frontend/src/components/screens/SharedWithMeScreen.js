"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Eye, LogOut } from "lucide-react";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import { EmptyState, IconBadge, SectionHeader } from "../common/Cards";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVELS,
  API_PROJECT_TYPES,
  EDITOR_ACCESS_QUERY,
  PROJECT_TYPES
} from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { COMMON_UI_TEXT, SHARED_PROJECT_ALERTS } from "../../constants/notifications";
import { useAppStore } from "../../store";

export default function SharedWithMeScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const projectState = useAppStore((state) => state.projectState);
  const fetchSharedProjects = useAppStore((state) => state.fetchSharedProjects);
  const leaveSharedProject = useAppStore((state) => state.leaveSharedProject);
  const [detailsProject, setDetailsProject] = useState(null);
  const [leavingProject, setLeavingProject] = useState(null);
  const [leavingProjectId, setLeavingProjectId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [openActionProjectId, setOpenActionProjectId] = useState(null);

  useEffect(() => {
    if (auth.token) {
      fetchSharedProjects().catch(() => {});
    }
  }, [auth.token, fetchSharedProjects]);

  useEffect(() => {
    function handleClickAway(event) {
      if (!event.target.closest("[data-shared-project-actions]")) {
        setOpenActionProjectId(null);
      }
    }

    if (!openActionProjectId) {
      return undefined;
    }

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [openActionProjectId]);

  const projects = useMemo(
    () =>
      projectState.sharedProjects
        .filter((project) => isSharedWithCurrentUser(project, auth.user))
        .map(formatSharedProject),
    [auth.user, projectState.sharedProjects]
  );

  async function handleLeaveProject() {
    if (!leavingProject) {
      return;
    }

    setLeavingProjectId(leavingProject.id);

    try {
      await leaveSharedProject(leavingProject.id);
      showNotification(
        SHARED_PROJECT_ALERTS.PAGE_TITLE,
        SHARED_PROJECT_ALERTS.leftMessage(leavingProject.title),
        TOAST_TYPES.SUCCESS
      );
      setLeavingProject(null);
    } catch (error) {
      showNotification(
        SHARED_PROJECT_ALERTS.LEAVE_FAILED_TITLE,
        error.message || SHARED_PROJECT_ALERTS.LEAVE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setLeavingProjectId(null);
    }
  }

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-950">
            {SHARED_PROJECT_ALERTS.PAGE_TITLE}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{SHARED_PROJECT_ALERTS.PAGE_DESCRIPTION}</p>
        </div>
      </header>

      <SectionHeader
        title={`${SHARED_PROJECT_ALERTS.PROJECTS_SECTION_TITLE}${
          projects.length ? ` (${projects.length})` : ""
        }`}
      />

      {projectState.sharedLoading ? (
        <EmptyState
          title={SHARED_PROJECT_ALERTS.LOADING_TITLE}
          description={SHARED_PROJECT_ALERTS.LOADING_DESCRIPTION}
        />
      ) : projectState.error && projects.length === 0 ? (
        <EmptyState
          title={SHARED_PROJECT_ALERTS.LOAD_FAILED_TITLE}
          description={projectState.error || SHARED_PROJECT_ALERTS.LEAVE_FAILED_MESSAGE}
          action={
            <button
              className="font-bold text-violet-700 hover:text-violet-900"
              onClick={() => fetchSharedProjects().catch(() => {})}
              type="button"
            >
              {COMMON_UI_TEXT.TRY_AGAIN}
            </button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title={SHARED_PROJECT_ALERTS.EMPTY_TITLE}
          description={SHARED_PROJECT_ALERTS.EMPTY_DESCRIPTION}
          action={
            <Button onClick={() => router.push(ROUTES.PROJECTS)} type="button">
              View My Projects
            </Button>
          }
        />
      ) : (
        <section className="grid gap-4">
          {projects.map((project) => (
            <article
              className={`group relative grid gap-4 rounded-lg border bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/70 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)] md:grid-cols-[2.75rem_minmax(0,1fr)_auto] md:items-center ${
                openActionProjectId === project.id
                  ? "z-30 border-violet-300 bg-violet-50/70"
                  : "z-0 border-slate-200"
              }`}
              key={project.id}
            >
              <IconBadge tone={project.tone}>{project.icon}</IconBadge>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center">
                  <strong className="block min-w-0 truncate text-sm font-bold text-slate-950 group-hover:text-violet-700">
                    {project.title}
                  </strong>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {project.category} • {project.type} Project • {project.updated}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Owner: <span className="font-bold text-slate-700">{project.ownerName}</span>
                  {project.ownerEmail ? ` (${project.ownerEmail})` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {project.collaboratorCount} collaborator
                  {project.collaboratorCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap">
                <span className={getAccessBadgeClassName(project.accessLevel)}>
                  {project.accessLabel}
                </span>
                <Button
                  className="border-violet-100 bg-violet-50 px-3 text-violet-700 shadow-sm hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800"
                  onClick={() => router.push(getProjectWorkspaceHref(project))}
                  type="button"
                  variant="secondary"
                >
                  <ExternalLink aria-hidden="true" size={17} />
                  Open Project
                </Button>
                <div className="relative" data-shared-project-actions>
                  <Button
                    aria-label={`${project.title} actions`}
                    aria-expanded={openActionProjectId === project.id}
                    aria-haspopup="menu"
                    className={`border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100 ${
                      openActionProjectId === project.id
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : ""
                    }`}
                    onClick={() =>
                      setOpenActionProjectId((currentId) =>
                        currentId === project.id ? null : project.id
                      )
                    }
                    type="button"
                    variant="secondary"
                  >
                    Actions
                    <ChevronDown aria-hidden="true" size={16} strokeWidth={2.4} />
                  </Button>
                  {openActionProjectId === project.id && (
                    <div
                      className="shared-project-actions-menu absolute right-0 top-[calc(100%+0.45rem)] z-50 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.16)] before:absolute before:-top-1.5 before:right-3 before:h-3 before:w-3 before:rotate-45 before:border-l before:border-t before:border-slate-200 before:bg-white"
                      role="menu"
                    >
                      <button
                        className="relative z-10 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100"
                        onClick={() => {
                          setDetailsProject(project);
                          setOpenActionProjectId(null);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <Eye aria-hidden="true" size={16} />
                        View Details
                      </button>
                      <button
                        className="relative z-10 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-100"
                        onClick={() => {
                          setLeavingProject(project);
                          setOpenActionProjectId(null);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <LogOut aria-hidden="true" size={16} />
                        Leave Project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {detailsProject && (
        <ProjectDetailsDialog
          onClose={() => setDetailsProject(null)}
          onOpen={() => router.push(getProjectWorkspaceHref(detailsProject))}
          project={detailsProject}
        />
      )}

      {leavingProject && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Leave Project"
          description={SHARED_PROJECT_ALERTS.leaveConfirmDescription(leavingProject.title)}
          isConfirming={leavingProjectId === leavingProject.id}
          onCancel={() => setLeavingProject(null)}
          onConfirm={handleLeaveProject}
          title={SHARED_PROJECT_ALERTS.LEAVE_CONFIRM_TITLE}
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

function ProjectDetailsDialog({ onClose, onOpen, project }) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-5"
      role="presentation"
    >
      <section
        aria-modal="true"
        className="grid w-full max-w-lg gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(31,41,55,0.08)]"
        role="dialog"
      >
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Project Details</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{project.title}</h2>
        </div>
        <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <DetailItem label="Type" value={`${project.type} Project`} />
          <DetailItem label="Category" value={project.category} />
          <DetailItem
            label="Owner"
            value={`${project.ownerName}${project.ownerEmail ? `\n${project.ownerEmail}` : ""}`}
          />
          <DetailItem label="Your Access" value={project.accessLabel} />
          <DetailItem label="Collaborators" value={String(project.collaboratorCount)} />
          <DetailItem label="Last Updated" value={project.updated} />
        </dl>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Close
          </Button>
          <Button onClick={onOpen} type="button">
            Open Project
          </Button>
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function formatSharedProject(project) {
  const type = project.type === API_PROJECT_TYPES.IMAGE ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT;
  const accessLevel =
    project.accessLevel === ACCESS_LEVELS.VIEWER ? ACCESS_LEVELS.VIEWER : ACCESS_LEVELS.EDITOR;

  return {
    id: project._id || project.id,
    title: project.title,
    category: project.category || "Other",
    type,
    updated: formatUpdatedAt(project.updatedAt),
    icon: type === PROJECT_TYPES.IMAGE ? "▧" : "▤",
    tone: type === PROJECT_TYPES.IMAGE ? "lavender" : "mint",
    ownerName: project.owner?.name || "Unknown owner",
    ownerEmail: project.owner?.email || "",
    accessLevel,
    accessLabel: ACCESS_LEVEL_LABELS[accessLevel],
    collaboratorCount: project.collaborators?.length || 0
  };
}

function isSharedWithCurrentUser(project, user) {
  const ownerId = getId(project.owner);
  const userId = getId(user);

  if (!userId || ownerId === userId) {
    return false;
  }

  return Boolean(project.isSharedWithCurrentUser);
}

function getId(value) {
  return String(value?._id || value?.id || value || "");
}

function getProjectWorkspaceHref(project) {
  const workspace =
    project.type === PROJECT_TYPES.IMAGE ? API_PROJECT_TYPES.IMAGE : API_PROJECT_TYPES.TEXT;
  const access =
    project.accessLevel === ACCESS_LEVELS.VIEWER ? `&access=${EDITOR_ACCESS_QUERY.VIEW}` : "";
  return `${ROUTES.EDITOR}?projectId=${project.id}&type=${workspace}${access}`;
}

function getAccessBadgeClassName(accessLevel) {
  const baseClasses =
    "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold";
  return accessLevel === ACCESS_LEVELS.VIEWER
    ? `${baseClasses} bg-slate-100 text-slate-600`
    : `${baseClasses} bg-emerald-50 text-emerald-700`;
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
