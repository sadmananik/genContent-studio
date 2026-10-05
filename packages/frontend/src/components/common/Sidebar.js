"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bot,
  Crown,
  FilePenLine,
  FolderKanban,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  PanelTop,
  SearchCheck,
  Settings,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import Brand from "./Brand";
import { EDITOR_NAV_ITEMS, NAV_ITEMS, ROUTES } from "../../constants/navigation";

const navIcons = {
  Bot,
  FilePenLine,
  FolderKanban,
  Image: ImageIcon,
  LayoutDashboard,
  PanelTop,
  SearchCheck,
  Settings,
  Sparkles,
  Star,
  Users
};

export function AppSidebar({ active }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectType = searchParams.get("type");

  return (
    <aside className="app-sidebar dash-sidebar">
      <Brand href={ROUTES.DASHBOARD} />
      <nav className="nav-list">
        {NAV_ITEMS.map(({ icon, label, href }) => {
          const Icon = navIcons[icon];
          let isActive = active === label || pathname === href;

          if (label === "Projects") {
            isActive = pathname === ROUTES.PROJECTS && projectType !== "image";
          } else if (label === "Image Studio") {
            isActive = pathname === ROUTES.PROJECTS && projectType === "image";
          } else if (label === "AI Studio" || label === "SEO Tools") {
            isActive = pathname === ROUTES.TEMPLATES;
          }

          return (
            <Link className={isActive ? "active" : ""} href={href} key={label}>
              {Icon && <Icon aria-hidden="true" size={18} strokeWidth={2.25} />}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="dash-sidebar-bottom">
        <Link
          className={`dash-sidebar-link${pathname === ROUTES.SETTINGS ? " active" : ""}`}
          href={ROUTES.SETTINGS}
        >
          <Settings aria-hidden="true" size={18} strokeWidth={2.25} />
          Settings
        </Link>
        <a className="dash-sidebar-link" href="mailto:support@gencontent.studio">
          <HelpCircle aria-hidden="true" size={18} strokeWidth={2.25} />
          Help & Support
        </a>

        <div className="dash-upgrade-card">
          <span className="dash-upgrade-icon">
            <Crown size={16} />
          </span>
          <strong>Upgrade to Pro</strong>
          <p>Unlock more features and higher limits.</p>
          <button type="button">Upgrade Now →</button>
        </div>
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
