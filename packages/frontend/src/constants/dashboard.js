import { CONTENT_CATEGORIES, CONTENT_CATEGORY_SUMMARY_LABELS, PROJECT_TYPES } from "./content";

export const DASHBOARD_TEXT = {
  TITLE: "Dashboard",
  SUBTITLE: "AI-driven content creation platform",
  WELCOME_PREFIX: "Welcome back",
  WELCOME_DESCRIPTION: "Manage your projects and start creating content with AI.",
  CREATE_PROJECT: "Create New Project",
  PROJECT_INFORMATION: "Project Information",
  PROJECT_SUMMARY: "Project summary",
  CONTENT_TYPE_SUMMARY: "Content Type Summary",
  RECENT_PROJECTS: "Recent Projects",
  VIEW_ALL_PROJECTS: "View All Projects",
  EMPTY_PROJECTS_TITLE: "No projects yet.",
  EMPTY_PROJECTS_DESCRIPTION: "Create your first project and start generating content with AI."
};

export const PROJECT_FORM_TEXT = {
  TITLE_LABEL: "Project title",
  TITLE_PLACEHOLDER: "Enter project title",
  TITLE_REQUIRED: "Project title is required",
  CATEGORY_LABEL: "Content category",
  TYPE_LEGEND: "Project type",
  CANCEL: "Cancel",
  CLOSE: "Close"
};

export const SUMMARY_CARD_LABELS = {
  TOTAL: "Total Projects",
  TEXT: "Text Projects",
  IMAGE: "Image Projects",
  SHARED: "Shared Projects"
};

export const SUMMARY_CARDS = [
  { icon: "▣", value: "12", label: SUMMARY_CARD_LABELS.TOTAL, tone: "violet" },
  { icon: "▤", value: "7", label: SUMMARY_CARD_LABELS.TEXT, tone: "mint" },
  { icon: "▧", value: "5", label: SUMMARY_CARD_LABELS.IMAGE, tone: "lavender" },
  { icon: "◇", value: "3", label: SUMMARY_CARD_LABELS.SHARED, tone: "mint" }
];

export const CATEGORY_COUNTS = [
  { label: CONTENT_CATEGORY_SUMMARY_LABELS[CONTENT_CATEGORIES.BLOG_POST], count: 4 },
  { label: CONTENT_CATEGORY_SUMMARY_LABELS[CONTENT_CATEGORIES.SOCIAL_MEDIA_POST], count: 3 },
  { label: CONTENT_CATEGORY_SUMMARY_LABELS[CONTENT_CATEGORIES.MARKETING_CONTENT], count: 2 },
  { label: CONTENT_CATEGORY_SUMMARY_LABELS[CONTENT_CATEGORIES.PRODUCT_DESCRIPTION], count: 2 },
  { label: CONTENT_CATEGORY_SUMMARY_LABELS[CONTENT_CATEGORIES.EMAIL_CONTENT], count: 1 }
];

export const MOCK_RECENT_PROJECTS = [
  {
    id: "future-ai",
    title: "Blog Post: Future of AI",
    category: CONTENT_CATEGORIES.BLOG_POST,
    type: PROJECT_TYPES.TEXT,
    updated: "Updated 2 hours ago",
    icon: "▤",
    tone: "mint"
  },
  {
    id: "marketing-campaign",
    title: "Marketing Campaign",
    category: CONTENT_CATEGORIES.MARKETING_CONTENT,
    type: PROJECT_TYPES.IMAGE,
    updated: "Updated 1 day ago",
    icon: "▧",
    tone: "lavender"
  },
  {
    id: "instagram-launch",
    title: "Instagram Product Launch",
    category: CONTENT_CATEGORIES.SOCIAL_MEDIA_POST,
    type: PROJECT_TYPES.IMAGE,
    updated: "Updated 2 days ago",
    icon: "▧",
    tone: "mint"
  },
  {
    id: "smart-watch",
    title: "Product Description - Smart Watch",
    category: CONTENT_CATEGORIES.PRODUCT_DESCRIPTION,
    type: PROJECT_TYPES.TEXT,
    updated: "Updated 3 days ago",
    icon: "▤",
    tone: "lavender"
  }
];
