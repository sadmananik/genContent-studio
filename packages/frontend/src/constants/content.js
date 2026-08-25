export const CONTENT_CATEGORIES = {
  BLOG_POST: "Blog Post",
  SOCIAL_MEDIA_POST: "Social Media Post",
  MARKETING_CONTENT: "Marketing Content",
  PRODUCT_DESCRIPTION: "Product Description",
  EMAIL_CONTENT: "Email Content",
  OTHER: "Other"
};

export const CONTENT_CATEGORY_OPTIONS = Object.values(CONTENT_CATEGORIES);

export const CONTENT_CATEGORY_SUMMARY_LABELS = {
  [CONTENT_CATEGORIES.BLOG_POST]: "Blog Posts",
  [CONTENT_CATEGORIES.SOCIAL_MEDIA_POST]: "Social Media Posts",
  [CONTENT_CATEGORIES.MARKETING_CONTENT]: "Marketing Content",
  [CONTENT_CATEGORIES.PRODUCT_DESCRIPTION]: "Product Descriptions",
  [CONTENT_CATEGORIES.EMAIL_CONTENT]: "Email Content"
};

export const PROJECT_TYPES = {
  TEXT: "Text",
  IMAGE: "Image"
};

export const PROJECT_TYPE_OPTIONS = Object.values(PROJECT_TYPES);

export const API_PROJECT_TYPES = {
  IMAGE: "image",
  TEXT: "text"
};

export const ACCESS_LEVELS = {
  EDITOR: "editor",
  VIEWER: "viewer"
};

export const ACCESS_LEVEL_LABELS = {
  [ACCESS_LEVELS.EDITOR]: "Editor",
  [ACCESS_LEVELS.VIEWER]: "View only"
};

export const PROJECT_ROLES = {
  COLLABORATOR: "collaborator",
  OWNER: "owner"
};

export const EDITOR_ACCESS_QUERY = {
  VIEW: "view"
};

export const AI_CONTENT_TYPES = {
  IMAGE: "image",
  OTHER: "other",
  TEXT: "text"
};

export const PERMISSION_MESSAGES = {
  AI_ACTIONS_DISABLED: "AI actions are disabled for view-only projects.",
  AI_GENERATION_DISABLED: "AI generation is disabled for view-only projects.",
  AI_HISTORY_CHANGES_DISABLED: "AI history changes are disabled for view-only projects.",
  AI_HISTORY_EDIT_DISABLED: "AI history editing is disabled for view-only projects.",
  CANVAS_EDIT_DISABLED: "Canvas editing is disabled for view-only projects.",
  SAVE_DISABLED: "Saving is disabled for view-only projects.",
  SHARING_OWNER_ONLY: "Only project owners can manage sharing.",
  VIEW_ONLY_TITLE: "View only"
};

export const API_ERROR_MESSAGES = {
  TEXT_CONTENT_NOT_FOUND: "Text content not found"
};
