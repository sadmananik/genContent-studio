export const ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  PROJECTS: "/projects",
  CHAT_HISTORY: "/chat-history",
  SHARED: "/shared",
  FAVORITES: "/favorites",
  TEMPLATES: "/templates",
  TRASH: "/trash",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  EDITOR: "/editor"
};

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Dashboard", href: ROUTES.DASHBOARD },
  { icon: "FolderKanban", label: "Projects", href: ROUTES.PROJECTS },
  { icon: "Users", label: "Shared with Me", href: ROUTES.SHARED },
  { icon: "PanelTop", label: "Templates", href: ROUTES.TEMPLATES },
  { icon: "Trash2", label: "Trash", href: ROUTES.TRASH }
];

export const EDITOR_NAV_ITEMS = [
  { icon: "FilePenLine", label: "Editor" },
  { icon: "Bot", label: "AI Chat" },
  { icon: "PanelTop", label: "Templates" },
  { icon: "SearchCheck", label: "SEO Tools" },
  { icon: "Settings", label: "Settings" }
];
