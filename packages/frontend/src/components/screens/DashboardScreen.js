"use client";

import PageTitleIcon from "../common/PageTitleIcon";

import QuickCreateProject from "../dashboard/QuickCreateProject";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import ProjectListCard from "../common/ProjectListCard";
import { CONTENT_CARD_GRID } from "../common/ContentCard";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { EmptyState, SectionHeader, WelcomePanel } from "../common/Cards";
import ProjectTypeIcon from "../common/ProjectTypeIcon";
import { DASHBOARD_TEXT } from "../../constants/dashboard";
import { ROUTES } from "../../constants/navigation";
import { API_PROJECT_TYPES, PROJECT_TYPES } from "../../constants/content";
import { COMMON_UI_TEXT, DASHBOARD_ALERTS, PROJECT_ALERTS } from "../../constants/notifications";
import { useAppStore } from "../../store";

export default function DashboardScreen() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    };
    updateGreeting();
    const timer = window.setInterval(updateGreeting, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const auth = useAppStore((state) => state.auth);
  const projectState = useAppStore((state) => state.projectState);
  const fetchProjects = useAppStore((state) => state.fetchProjects);

  const user = auth.user || { name: "Sadman Anik" };
  const projects = useMemo(
    () =>
      [...projectState.projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        )
        .slice(0, 3)
        .map(formatProjectForDashboard),
    [projectState.projects]
  );
  const hasProjects = projects.length > 0;

  useEffect(() => {
    if (auth.token) {
      fetchProjects().catch(() => {});
    }
  }, [auth.token, fetchProjects]);

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="mb-6 flex flex-wrap items-center gap-4 md:mb-7">
        <PageTitleIcon icon={LayoutDashboard} />
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-bold text-slate-950">{DASHBOARD_TEXT.TITLE}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{DASHBOARD_TEXT.SUBTITLE}</p>
        </div>
      </header>

      <WelcomePanel
        title={`${greeting}, ${firstName(user.name)}!`}
        description={DASHBOARD_TEXT.WELCOME_DESCRIPTION}
      />

      <section className="space-y-7">
        <QuickCreateProject />
        <div>
          <SectionHeader
            title="Continue where you left off"
            action={
              <Link
                className="app-button app-button-secondary dashboard-projects-link inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 hover:shadow-[0_10px_22px_rgba(101,69,246,0.14)] focus:outline-none focus:ring-2 focus:ring-violet-100"
                href={ROUTES.PROJECTS}
              >
                {DASHBOARD_TEXT.VIEW_ALL_PROJECTS}
                <ArrowRight aria-hidden="true" size={16} strokeWidth={2.3} />
              </Link>
            }
          />
          {projectState.loading && !hasProjects ? (
            <EmptyState
              title={PROJECT_ALERTS.LOADING_TITLE}
              description={DASHBOARD_ALERTS.PROJECTS_LOADING_DESCRIPTION}
            />
          ) : projectState.error && !hasProjects ? (
            <EmptyState title={PROJECT_ALERTS.LOAD_FAILED_TITLE} description={projectState.error} />
          ) : hasProjects ? (
            <div className={CONTENT_CARD_GRID}>
              {projects.map((project) => (
                <ProjectListCard
                  layout="card"
                  cover={{
                    title: project.title,
                    category: project.category,
                    projectType: project.type === PROJECT_TYPES.IMAGE ? "image" : "text",
                    starterContent: project.description
                  }}
                  title={project.title}
                  tone={project.tone}
                  icon={project.icon}
                  onOpen={() => router.push(getProjectWorkspaceHref(project))}
                  key={project.id}
                >
                  <p className="mt-1 text-xs text-slate-500">
                    {project.type} Project • {project.updated}
                  </p>
                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {project.description}
                    </p>
                  )}
                </ProjectListCard>
              ))}
            </div>
          ) : (
            <EmptyState
              title={DASHBOARD_TEXT.EMPTY_PROJECTS_TITLE}
              description={DASHBOARD_TEXT.EMPTY_PROJECTS_DESCRIPTION}
              action={<Link href={ROUTES.PROJECTS}>Go to Projects</Link>}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function firstName(name = "") {
  return name.trim().split(/\s+/)[0] || "there";
}

function formatProjectForDashboard(project) {
  const type = project.type === API_PROJECT_TYPES.IMAGE ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT;

  return {
    id: project._id || project.id,
    title: project.title,
    description: project.description || "",
    category: project.category || "Other",
    type,
    updated: formatUpdatedAt(project.updatedAt),
    icon: <ProjectTypeIcon size={18} type={type} />,
    tone: type === PROJECT_TYPES.IMAGE ? "lavender" : "mint",
    collaborators: project.collaborators || []
  };
}

function getProjectWorkspaceHref(project) {
  const projectId = project._id || project.id;
  const workspace =
    project.type === API_PROJECT_TYPES.IMAGE || project.type === PROJECT_TYPES.IMAGE
      ? API_PROJECT_TYPES.IMAGE
      : API_PROJECT_TYPES.TEXT;

  return `${ROUTES.EDITOR}?projectId=${projectId}&type=${workspace}`;
}

function formatUpdatedAt(value) {
  if (!value) {
    return COMMON_UI_TEXT.UPDATED_JUST_NOW;
  }

  const updatedAt = new Date(value);
  const diffInSeconds = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 1000));

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
