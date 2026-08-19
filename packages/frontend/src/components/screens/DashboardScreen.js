"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CategorySummary,
  EmptyState,
  RecentProjectCard,
  SectionHeader,
  StatGrid,
  WelcomePanel
} from "../common/Cards";
import UserProfileMenu from "../common/UserProfileMenu";
import { DASHBOARD_TEXT, SUMMARY_CARD_LABELS } from "../../constants/dashboard";
import { ROUTES } from "../../constants/navigation";
import { CONTENT_CATEGORY_SUMMARY_LABELS, PROJECT_TYPES } from "../../constants/content";
import { useAppStore } from "../../store";

export default function DashboardScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const projectState = useAppStore((state) => state.projectState);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const logoutUser = useAppStore((state) => state.logoutUser);

  const user = auth.user || { name: "Sadman Anik" };
  const projects = useMemo(
    () => projectState.projects.map(formatProjectForDashboard),
    [projectState.projects]
  );
  const summaryCards = useMemo(
    () => buildSummaryCards(projectState.projects),
    [projectState.projects]
  );
  const categoryCounts = useMemo(
    () => buildCategoryCounts(projectState.projects),
    [projectState.projects]
  );
  const hasProjects = projects.length > 0;

  useEffect(() => {
    if (auth.token) {
      fetchProjects().catch(() => {});
    }
  }, [auth.token, fetchProjects]);

  function handleLogout() {
    logoutUser();
    router.push(ROUTES.LOGIN);
  }

  function handleProfile() {
    router.push(ROUTES.PROFILE);
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-950">{DASHBOARD_TEXT.TITLE}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{DASHBOARD_TEXT.SUBTITLE}</p>
        </div>
        <div className="hidden flex-1 sm:block" />
        <UserProfileMenu user={user} onLogout={handleLogout} onProfile={handleProfile} />
      </header>

      <WelcomePanel
        title={`${DASHBOARD_TEXT.WELCOME_PREFIX}, ${firstName(user.name)}!`}
        description={DASHBOARD_TEXT.WELCOME_DESCRIPTION}
      />

      <StatGrid items={summaryCards} label={DASHBOARD_TEXT.PROJECT_SUMMARY} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.82fr)_minmax(360px,1.55fr)]">
        <div>
          <SectionHeader title={DASHBOARD_TEXT.CONTENT_TYPE_SUMMARY} />
          <CategorySummary items={categoryCounts} />
        </div>

        <div>
          <SectionHeader
            title={DASHBOARD_TEXT.RECENT_PROJECTS}
            action={<Link href={ROUTES.PROJECTS}>{DASHBOARD_TEXT.VIEW_ALL_PROJECTS}</Link>}
          />
          {projectState.loading && !hasProjects ? (
            <EmptyState
              title="Loading projects..."
              description="Your project workspace is getting everything ready."
            />
          ) : projectState.error && !hasProjects ? (
            <EmptyState title="Projects could not load." description={projectState.error} />
          ) : hasProjects ? (
            <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)] [&>*+*]:border-t [&>*+*]:border-slate-100">
              {projects.map((project) => (
                <RecentProjectCard
                  project={project}
                  href={getProjectWorkspaceHref(project)}
                  key={project.id}
                />
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
  const type = project.type === "image" ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT;

  return {
    id: project._id || project.id,
    title: project.title,
    category: project.category || "Other",
    type,
    updated: formatUpdatedAt(project.updatedAt),
    icon: type === PROJECT_TYPES.IMAGE ? "▧" : "▤",
    tone: type === PROJECT_TYPES.IMAGE ? "lavender" : "mint",
    collaborators: project.collaborators || []
  };
}

function buildSummaryCards(projects) {
  const textCount = projects.filter((project) => project.type === "text").length;
  const imageCount = projects.filter((project) => project.type === "image").length;
  const sharedCount = projects.filter((project) => (project.collaborators || []).length > 0).length;

  return [
    { icon: "▣", value: String(projects.length), label: SUMMARY_CARD_LABELS.TOTAL, tone: "violet" },
    { icon: "▤", value: String(textCount), label: SUMMARY_CARD_LABELS.TEXT, tone: "mint" },
    { icon: "▧", value: String(imageCount), label: SUMMARY_CARD_LABELS.IMAGE, tone: "lavender" },
    { icon: "◇", value: String(sharedCount), label: SUMMARY_CARD_LABELS.SHARED, tone: "mint" }
  ];
}

function buildCategoryCounts(projects) {
  const counts = projects.reduce((result, project) => {
    const category = project.category || "Other";
    result[category] = (result[category] || 0) + 1;
    return result;
  }, {});

  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return [{ label: "No categories yet", count: 0 }];
  }

  return entries.map(([category, count]) => ({
    label: CONTENT_CATEGORY_SUMMARY_LABELS[category] || category,
    count
  }));
}

function getProjectWorkspaceHref(project) {
  const projectId = project._id || project.id;
  const workspace =
    project.type === "image" || project.type === PROJECT_TYPES.IMAGE ? "image" : "text";

  return `${ROUTES.EDITOR}?projectId=${projectId}&type=${workspace}`;
}

function formatUpdatedAt(value) {
  if (!value) {
    return "Updated just now";
  }

  const updatedAt = new Date(value);
  const diffInSeconds = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 1000));

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
