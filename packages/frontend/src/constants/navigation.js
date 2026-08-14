export const ROUTES = {
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  CHAT_HISTORY: "/chat-history",
  SHARED: "/shared",
  FAVORITES: "/favorites",
  TEMPLATES: "/templates",
  TRASH: "/trash",
  LOGIN: "/login",
  EDITOR: "/editor"
};

export const NAV_ITEMS = [
  { icon: "⌂", label: "Dashboard", href: ROUTES.DASHBOARD },
  { icon: "□", label: "Projects", href: ROUTES.PROJECTS },
  { icon: "◉", label: "AI Chat History", href: ROUTES.CHAT_HISTORY },
  { icon: "⌘", label: "Shared with Me", href: ROUTES.SHARED },
  { icon: "☆", label: "Favorites", href: ROUTES.FAVORITES },
  { icon: "▱", label: "Templates", href: ROUTES.TEMPLATES },
  { icon: "♧", label: "Trash", href: ROUTES.TRASH }
];

export const EDITOR_NAV_ITEMS = [
  { icon: "✎", label: "Editor" },
  { icon: "▣", label: "AI Chat" },
  { icon: "▥", label: "Templates" },
  { icon: "◎", label: "SEO Tools" },
  { icon: "⚙", label: "Settings" }
];
