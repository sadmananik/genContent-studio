"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  HelpCircle,
  Bot,
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  PanelTop,
  SearchCheck,
  Settings,
  Star,
  Users
} from "lucide-react";
import Brand from "./Brand";
import { EDITOR_NAV_ITEMS, NAV_ITEMS, ROUTES } from "../../constants/navigation";

const APP_VERSION = "1.0.4";

const navIcons = {
  Bot,
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  PanelTop,
  SearchCheck,
  Settings,
  Star,
  Users
};

export function AppSidebar({ active, mobileOpen = false, onClose }) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  return (
    <aside
      id="app-navigation"
      className={`app-sidebar styled-sidebar${mobileOpen ? " mobile-open" : ""}`}
      onClick={(event) => {
        if (event.target.closest("a")) onClose?.();
      }}
    >
      {onClose && (
        <button
          type="button"
          className="mobile-navigation-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X aria-hidden="true" size={24} />
        </button>
      )}
      <Brand href={ROUTES.DASHBOARD} variant="sidebar" />
      <nav className="nav-list">
        {NAV_ITEMS.map(({ icon, label, href }) => {
          const Icon = navIcons[icon];

          return (
            <Link
              className={active === label || pathname === href ? "active" : ""}
              href={href}
              key={label}
            >
              {Icon && <Icon aria-hidden="true" size={18} strokeWidth={1.8} />}
              {label}
            </Link>
          );
        })}
      </nav>
      <nav className="sidebar-secondary nav-list" aria-label="Support and settings">
        <Link href={ROUTES.SETTINGS} className={pathname === ROUTES.SETTINGS ? "active" : ""}>
          <Settings aria-hidden="true" size={18} strokeWidth={1.8} />
          Settings
        </Link>
        <a href="mailto:generativecontentstudio@gmail.com">
          <HelpCircle aria-hidden="true" size={18} strokeWidth={1.8} />
          Help &amp; Support
        </a>
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
