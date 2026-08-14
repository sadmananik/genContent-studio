"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "./Brand";
import { clearAuthState } from "../../lib/auth";
import { EDITOR_NAV_ITEMS, NAV_ITEMS, ROUTES } from "../../constants/navigation";

export function AppSidebar({ active }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAuthState();
    router.push(ROUTES.LOGIN);
  }

  return (
    <aside className="app-sidebar">
      <Brand />
      <nav className="nav-list">
        {NAV_ITEMS.map(({ icon, label, href }) => (
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
      {EDITOR_NAV_ITEMS.map(({ icon, label }) => (
        <a className={label === active ? "active" : ""} href="#" key={label}>
          <span>{icon}</span>
          {label}
        </a>
      ))}
    </aside>
  );
}
