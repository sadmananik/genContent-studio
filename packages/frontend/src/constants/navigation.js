export const ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
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
  EDITOR: "/editor"
};

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Dashboard", href: ROUTES.DASHBOARD },
  { icon: "User", label: "Profile", href: ROUTES.PROFILE },
  { icon: "FolderKanban", label: "Projects", href: ROUTES.PROJECTS },
  { icon: "MessagesSquare", label: "AI Chat History", href: ROUTES.CHAT_HISTORY },
  { icon: "Users", label: "Shared with Me", href: ROUTES.SHARED },
  { icon: "Star", label: "Favorites", href: ROUTES.FAVORITES },
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
