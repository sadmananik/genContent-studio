"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  PanelTop,
  SearchCheck,
  Settings,
  Trash2,
  Users
} from "lucide-react";
import Brand from "./Brand";
import { EDITOR_NAV_ITEMS, NAV_ITEMS } from "../../constants/navigation";

const APP_VERSION = "0.1.0";

const navIcons = {
  Bot,
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  PanelTop,
  SearchCheck,
  Settings,
  Trash2,
  Users
};

export function AppSidebar({ active }) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  return (
    <aside className="app-sidebar">
      <Brand />
      <nav className="nav-list">
        {NAV_ITEMS.map(({ icon, label, href }) => {
          const Icon = navIcons[icon];

          return (
            <Link
              className={active === label || pathname === href ? "active" : ""}
              href={href}
              key={label}
            >
              {Icon && <Icon aria-hidden="true" size={18} strokeWidth={2.25} />}
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <p>GenContent Studio v{APP_VERSION}</p>
        <small>&copy; {currentYear} GenContent Studio</small>
      </div>
    </aside>
  );
}

export function EditorRail({ active = "Editor" }) {
  return (
    <aside className="editor-rail">
      {EDITOR_NAV_ITEMS.map(({ icon, label }) => {
        const Icon = navIcons[icon];

        return (
          <a className={label === active ? "active" : ""} href="#" key={label}>
            {Icon && <Icon aria-hidden="true" size={18} strokeWidth={2.25} />}
            {label}
          </a>
        );
      })}
    </aside>
  );
}
