"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import UserProfileMenu from "./UserProfileMenu";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function AppHeader() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const userState = useAppStore((state) => state.userState);
  const logoutUser = useAppStore((state) => state.logoutUser);
  const projectState = useAppStore((state) => state.projectState);
  const user = userState.profile || auth.user;
  const [query, setQuery] = useState("");

  const planLabel = useMemo(() => "Free Plan", []);

  function handleLogout() {
    logoutUser();
    router.push(ROUTES.LOGIN);
  }

  function handleProfile() {
    router.push(ROUTES.PROFILE);
  }

  function handleSettings() {
    router.push(ROUTES.SETTINGS);
  }

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const match = (projectState.projects || []).find((project) =>
      String(project.title || "")
        .toLowerCase()
        .includes(trimmed.toLowerCase())
    );

    if (match) {
      const projectId = match._id || match.id;
      const type = match.type === "image" ? "image" : "text";
      router.push(`${ROUTES.EDITOR}?projectId=${projectId}&type=${type}`);
      return;
    }

    router.push(`${ROUTES.PROJECTS}?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="dash-header">
      <form className="dash-search" onSubmit={handleSearch}>
        <Search aria-hidden="true" className="dash-search-icon" size={18} strokeWidth={1.9} />
        <input
          aria-label="Search projects"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects, content, prompts..."
          type="search"
          value={query}
        />
        <kbd>⌘ K</kbd>
      </form>

      <div className="dash-header-actions">
        <button aria-label="Notifications" className="dash-bell" type="button">
          <Bell size={18} strokeWidth={1.9} />
          <span aria-hidden="true" className="dash-bell-dot" />
        </button>
        <UserProfileMenu
          planLabel={planLabel}
          user={user}
          variant="dashboard"
          onLogout={handleLogout}
          onProfile={handleProfile}
          onSettings={handleSettings}
        />
      </div>
    </header>
  );
}
