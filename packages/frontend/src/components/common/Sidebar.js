"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Crown,
  FilePenLine,
  Folder,
  HelpCircle,
  House,
  Image as ImageIcon,
  PanelTop,
  Search,
  Settings,
  Sparkles,
  Star,
  Users
} from "lucide-react";

import { EDITOR_NAV_ITEMS, NAV_ITEMS, ROUTES } from "../../constants/navigation";

const dashNavIcons = {
  LayoutDashboard: House,
  FolderKanban: Folder,
  Sparkles,
  Image: ImageIcon,
  Star,
  Users
};

const editorNavIcons = {
  Bot,
  FilePenLine,
  PanelTop,
  SearchCheck: Search,
  Settings
};

export function AppSidebar({ active }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectType = searchParams.get("type");

  return (
    <aside className="app-sidebar dash-sidebar">
      <a className="dash-brand" href={ROUTES.DASHBOARD}>
        <Image
          alt=""
          aria-hidden="true"
          className="dash-brand-mark"
          height={36}
          src="/gencontent-logo.png"
          width={36}
        />
        <span className="dash-brand-text">
          <strong>GenContent</strong> Studio
        </span>
      </a>

      <nav className="dash-nav-list" aria-label="Main">
        {NAV_ITEMS.map(({ icon, label, href }) => {
          const Icon = dashNavIcons[icon];
          let isActive = active === label || pathname === href;

          if (label === "Projects") {
            isActive = pathname === ROUTES.PROJECTS && projectType !== "image";
          } else if (label === "Image Studio") {
            isActive = pathname === ROUTES.PROJECTS && projectType === "image";
          } else if (label === "AI Studio") {
            isActive = pathname === ROUTES.TEMPLATES;
          }

          return (
            <Link className={isActive ? "active" : ""} href={href} key={label}>
              {Icon && <Icon aria-hidden="true" size={18} strokeWidth={1.8} />}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="dash-sidebar-bottom">
        <div className="dash-sidebar-divider" aria-hidden="true" />

        <div className="dash-sidebar-secondary">
          <Link
            className={`dash-sidebar-link${pathname === ROUTES.SETTINGS ? " active" : ""}`}
            href={ROUTES.SETTINGS}
          >
            <Settings aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
          <a className="dash-sidebar-link" href="mailto:support@gencontent.studio">
            <HelpCircle aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>Help & Support</span>
          </a>
        </div>

        <div className="dash-upgrade-card">
          <span className="dash-upgrade-icon">
            <Crown size={16} strokeWidth={1.9} />
          </span>
          <strong>Upgrade to Pro</strong>
          <p>Unlock more features and higher limits.</p>
          <button type="button">
            Upgrade Now
            <ArrowRight aria-hidden="true" size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function EditorRail({ active = "Editor" }) {
  return (
    <aside className="editor-rail">
      {EDITOR_NAV_ITEMS.map(({ icon, label }) => {
        const Icon = editorNavIcons[icon];

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
