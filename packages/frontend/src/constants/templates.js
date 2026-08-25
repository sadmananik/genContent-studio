export const TEMPLATE_TABS = {
  BROWSE: "browse",
  FAVORITES: "favorites",
  MINE: "mine"
};

export const TEMPLATE_TYPES = {
  ALL: "all",
  IMAGE: "image",
  TEXT: "text"
};

export const TEMPLATE_VISIBILITY = {
  PRIVATE: "private",
  PUBLIC: "public"
};

export const TEMPLATE_CATEGORIES = [
  "Marketing",
  "Blog",
  "Social Media",
  "Email",
  "Business",
  "Education",
  "Other"
];

export const TEMPLATE_FILTER_OPTIONS = {
  CATEGORIES: ["all", ...TEMPLATE_CATEGORIES],
  TYPES: [TEMPLATE_TYPES.ALL, TEMPLATE_TYPES.TEXT, TEMPLATE_TYPES.IMAGE]
};

export const TEMPLATE_TEXT = {
  BROWSE_TAB: "Browse Templates",
  CATEGORY_FILTER_LABEL: "Category",
  CLEAR_FILTERS: "Clear Filters",
  DELETE_ACTION: "Delete",
  DELETE_CONFIRM_LABEL: "Delete Template",
  DELETE_CONFIRM_TITLE: "Delete template?",
  DELETE_FAILED_MESSAGE: "Template could not be deleted.",
  DELETE_FAILED_TITLE: "Delete failed",
  DELETED_MESSAGE: "The template was permanently deleted.",
  DELETED_TITLE: "Template deleted",
  EDIT_ACTION: "Edit",
  EDIT_MODAL_DESCRIPTION: "Update reusable template content and library visibility.",
  EDIT_MODAL_TITLE: "Edit Template",
  EMPTY_BROWSE_DESCRIPTION: "Try changing your search or filters.",
  EMPTY_BROWSE_TITLE: "No templates found",
  EMPTY_FAVORITES_DESCRIPTION: "Favorite templates from Browse Templates will appear here.",
  EMPTY_FAVORITES_TITLE: "No favorite templates yet",
  EMPTY_MINE_DESCRIPTION:
    "Publish one of your projects as a reusable template and it will appear here.",
  EMPTY_MINE_TITLE: "No published templates yet",
  FAVORITE_FAILED_MESSAGE: "Template favorite could not be updated.",
  FAVORITE_FAILED_TITLE: "Favorite not saved",
  FAVORITED_MESSAGE: "Template added to favorites.",
  FAVORITED_TITLE: "Template favorited",
  HIDE_ACTION: "Hide",
  HIDE_CONFIRM_LABEL: "Hide Template",
  HIDE_CONFIRM_TITLE: "Hide template?",
  HIDE_FAILED_MESSAGE: "Template could not be hidden.",
  HIDE_FAILED_TITLE: "Hide failed",
  HIDDEN_MESSAGE: "The template is now hidden from Browse Templates.",
  HIDDEN_STATUS: "Hidden",
  HIDDEN_TITLE: "Template hidden",
  LOAD_FAILED_DESCRIPTION: "Please try again.",
  LOAD_FAILED_TITLE: "Unable to load templates.",
  LOADING_BROWSE: "Loading templates...",
  LOADING_FAVORITES: "Loading favorite templates...",
  LOADING_MINE: "Loading your templates...",
  MY_TAB: "My Published Templates",
  FAVORITES_TAB: "Favorites",
  PAGE_DESCRIPTION: "Create faster with reusable Text and Image project starting points.",
  PAGE_TITLE: "Templates",
  PREVIEW_ACTION: "Preview",
  PRIVATE_VISIBILITY: "Private",
  PUBLIC_VISIBILITY: "Public",
  PUBLISH_ACTION: "Publish",
  PUBLISH_FAILED_MESSAGE: "Project could not be published as a template.",
  PUBLISH_FAILED_TITLE: "Publish failed",
  PUBLISH_MODAL_DESCRIPTION: "Choose the reusable content and visibility for this template.",
  PUBLISH_MODAL_TITLE: "Publish as Template",
  PUBLISHED_MESSAGE: "The template is available in Browse Templates.",
  PUBLISHED_PRIVATE_MESSAGE: "The private template is available in My Published Templates.",
  PUBLISHED_TITLE: "Template published",
  RECENT_SECTION_TITLE: "Recently Used",
  REPUBLISH_FAILED_MESSAGE: "Template could not be published.",
  REPUBLISH_FAILED_TITLE: "Publish failed",
  SEARCH_LABEL: "Search templates",
  SEARCH_PLACEHOLDER: "Search templates...",
  SEARCH_TAG_SUGGESTIONS: "Matching tags",
  TAG_SUGGESTIONS: "Suggested tags",
  TYPE_FILTER_LABEL: "Type",
  UNFAVORITED_MESSAGE: "Template removed from favorites.",
  UNFAVORITED_TITLE: "Favorite removed",
  UPDATE_FAILED_MESSAGE: "Template changes could not be saved.",
  UPDATE_FAILED_TITLE: "Update failed",
  UPDATED_MESSAGE: "Template changes were saved.",
  UPDATED_TITLE: "Template updated",
  USE_ACTION: "Use Template",
  USE_FAILED_MESSAGE: "A new project could not be created from this template.",
  USE_FAILED_TITLE: "Template not used",
  USING_ACTION: "Creating...",
  VIEW_PROJECTS: "View My Projects",
  deleteDescription: (title) =>
    `"${title}" will be permanently deleted. Existing projects created from it will not be affected. This action cannot be undone.`,
  hideDescription: (title) =>
    `"${title}" will no longer be visible to other users. You can publish it again later.`,
  usedCount: (count) => `Used ${count} ${count === 1 ? "time" : "times"}`
};

export const TEMPLATE_FORM_FIELDS = {
  CATEGORY: "Category",
  AI_HISTORY: "AI History",
  DESCRIPTION: "Description",
  PROJECT_TYPE: "Project Type",
  STARTER_CONTENT: "Starter Content",
  STARTER_PROMPT: "Starter Prompt",
  STYLE: "Style",
  TAGS: "Tags",
  TITLE: "Template Title",
  TONE: "Tone",
  VISIBILITY: "Visibility"
};
