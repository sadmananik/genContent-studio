const PROJECT_TYPES = {
  IMAGE: "image",
  TEXT: "text"
};

const PROJECT_TYPE_VALUES = Object.values(PROJECT_TYPES);

const ACCESS_LEVELS = {
  EDITOR: "editor",
  VIEWER: "viewer"
};

const ACCESS_LEVEL_VALUES = Object.values(ACCESS_LEVELS);

const PROJECT_ROLES = {
  COLLABORATOR: "collaborator",
  OWNER: "owner"
};

const AI_CONTENT_TYPES = {
  IMAGE: "image",
  OTHER: "other",
  TEXT: "text"
};

const AI_CONTENT_TYPE_VALUES = Object.values(AI_CONTENT_TYPES);

const PROJECT_MESSAGES = {
  CHAT_NOT_FOUND: "Chat not found",
  COLLABORATORS_INVALID_ID: "Collaborators contains an invalid user id",
  COLLABORATORS_MISSING_USERS: "One or more collaborators do not exist",
  CONTENT_TYPE_INVALID: "Content type must be text, image, or other",
  IMAGE_CONTENT_NOT_FOUND: "Image content not found",
  IMAGE_CONTENT_TYPE_REQUIRED: "Image content is only available for image projects",
  IMAGE_CONTENT_TYPE_SAVE_REQUIRED: "Image content can only be saved for image projects",
  INVITE_EMAIL_REQUIRED: "Invite email is required",
  INVITE_OWNER_ALREADY_COLLABORATOR: "Project owner is already a collaborator",
  INVITE_OWNER_ONLY: "Project not found or only owners can invite collaborators",
  INVITE_USER_NOT_FOUND: "No user account exists for this email",
  LEAVE_SHARED_NOT_FOUND: "Shared project not found",
  LEAVE_SHARED_SUCCESS: "You left this shared project.",
  PROJECT_DELETE_OWNER_ONLY: "Project not found or only owners can delete projects",
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_REQUIRED: "Project is required",
  PROJECT_TITLE_REQUIRED: "Project title is required",
  PROJECT_TYPE_INVALID: "Project type must be text or image",
  PROJECT_TYPE_REQUIRED: "Project type is required",
  PROMPT_REQUIRED: "Prompt is required",
  RESPONSE_REQUIRED: "Response is required",
  TEXT_CONTENT_NOT_FOUND: "Text content not found",
  TEXT_CONTENT_TYPE_REQUIRED: "Text content is only available for text projects",
  TEXT_CONTENT_TYPE_SAVE_REQUIRED: "Text content can only be saved for text projects"
};

const PROJECT_FIELD_LABELS = {
  PROJECT_TITLE: "Project title",
  PROMPT: "Prompt",
  RESPONSE: "Response"
};

module.exports = {
  ACCESS_LEVELS,
  ACCESS_LEVEL_VALUES,
  AI_CONTENT_TYPES,
  AI_CONTENT_TYPE_VALUES,
  PROJECT_MESSAGES,
  PROJECT_FIELD_LABELS,
  PROJECT_ROLES,
  PROJECT_TYPES,
  PROJECT_TYPE_VALUES
};
