"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../common/Button";
import {
  CategorySummary,
  EmptyState,
  RecentProjectCard,
  SectionHeader,
  StatGrid,
  WelcomePanel
} from "../common/Cards";
import ProjectFormModal from "../common/ProjectFormModal";
import UserProfileMenu from "../common/UserProfileMenu";
import { clearAuthState, getDisplayUser } from "../../lib/auth";
import {
  CATEGORY_COUNTS,
  DASHBOARD_TEXT,
  MOCK_RECENT_PROJECTS,
  SUMMARY_CARDS
} from "../../constants/dashboard";
import { ROUTES } from "../../constants/navigation";

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "Sadman Anik" });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projects] = useState(MOCK_RECENT_PROJECTS);

  useEffect(() => {
    setUser(getDisplayUser());
  }, []);

  const hasProjects = projects.length > 0;

  function handleLogout() {
    clearAuthState();
    router.push(ROUTES.LOGIN);
  }

  function handleCreateProject() {
    setShowProjectForm(false);
    router.push(ROUTES.EDITOR);
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-950">{DASHBOARD_TEXT.TITLE}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{DASHBOARD_TEXT.SUBTITLE}</p>
        </div>
        <div className="hidden flex-1 sm:block" />
        <UserProfileMenu user={user} onLogout={handleLogout} />
      </header>

      <WelcomePanel
        title={`${DASHBOARD_TEXT.WELCOME_PREFIX}, ${firstName(user.name)}!`}
        description={DASHBOARD_TEXT.WELCOME_DESCRIPTION}
        action={
          <Button type="button" onClick={() => setShowProjectForm(true)}>
            <span>＋</span> {DASHBOARD_TEXT.CREATE_PROJECT}
          </Button>
        }
      />

      <StatGrid items={SUMMARY_CARDS} label={DASHBOARD_TEXT.PROJECT_SUMMARY} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(260px,0.82fr)_minmax(360px,1.55fr)]">
        <div>
          <SectionHeader title={DASHBOARD_TEXT.CONTENT_TYPE_SUMMARY} />
          <CategorySummary items={CATEGORY_COUNTS} />
        </div>

        <div>
          <SectionHeader
            title={DASHBOARD_TEXT.RECENT_PROJECTS}
            action={<Link href={ROUTES.PROJECTS}>{DASHBOARD_TEXT.VIEW_ALL_PROJECTS}</Link>}
          />
          {hasProjects ? (
            <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)] [&>*+*]:border-t [&>*+*]:border-slate-100">
              {projects.map((project) => (
                <RecentProjectCard project={project} href={ROUTES.EDITOR} key={project.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={DASHBOARD_TEXT.EMPTY_PROJECTS_TITLE}
              description={DASHBOARD_TEXT.EMPTY_PROJECTS_DESCRIPTION}
              action={
                <Button type="button" onClick={() => setShowProjectForm(true)}>
                  {DASHBOARD_TEXT.CREATE_PROJECT}
                </Button>
              }
            />
          )}
        </div>
      </section>

      {showProjectForm && (
        <ProjectFormModal
          onClose={() => setShowProjectForm(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </main>
  );
}

function firstName(name = "") {
  return name.trim().split(/\s+/)[0] || "there";
}
