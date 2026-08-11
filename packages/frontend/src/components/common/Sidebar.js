"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "./Brand";
import { clearDemoLogin } from "./ProtectedRoute";

const navItems = [
  ["⌂", "Dashboard", "/dashboard"],
  ["□", "Projects", "/projects"],
  ["◉", "AI Chat History", "/chat-history"],
  ["⌘", "Shared with Me", "/shared"],
  ["☆", "Favorites", "/favorites"],
  ["▱", "Templates", "/templates"],
  ["♧", "Trash", "/trash"]
];

const editorItems = [
  ["✎", "Editor"],
  ["▣", "AI Chat"],
  ["▥", "Templates"],
  ["◎", "SEO Tools"],
  ["⚙", "Settings"]
];

export function AppSidebar({ active }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearDemoLogin();
    router.push("/login");
  }

  return (
    <aside className="app-sidebar">
      <Brand />
      <nav className="nav-list">
        {navItems.map(([icon, label, href]) => (
          <Link
            className={active === label || pathname === href ? "active" : ""}
            href={href}
            key={label}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button">
          <span>⚙</span>
          Settings
        </button>
        <button type="button" onClick={handleLogout}>
          <span>↪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export function EditorRail({ active = "Editor" }) {
  return (
    <aside className="editor-rail">
      {editorItems.map(([icon, label]) => (
        <a className={label === active ? "active" : ""} href="#" key={label}>
          <span>{icon}</span>
          {label}
        </a>
      ))}
    </aside>
  );
}
