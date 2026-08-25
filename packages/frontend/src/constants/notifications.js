export const COMMON_UI_TEXT = {
  TRY_AGAIN: "Try Again",
  UPDATED_JUST_NOW: "Updated just now"
};

export const PROJECT_ALERTS = {
  CREATE_FAILED_TITLE: "Create failed",
  CREATE_FAILED_MESSAGE: "Project could not be created.",
  CREATED_TITLE: "Project created",
  DELETE_CONFIRM_TITLE: "Delete project?",
  DELETE_FAILED_TITLE: "Delete failed",
  DELETE_FAILED_MESSAGE: "Project could not be deleted.",
  DELETED_TITLE: "Project deleted",
  EDIT_MODAL_TITLE: "Edit Project",
  LOAD_FAILED_TITLE: "Projects could not load.",
  LOADING_DESCRIPTION: "Your saved workspaces are loading.",
  LOADING_TITLE: "Loading projects...",
  UPDATE_FAILED_TITLE: "Update failed",
  UPDATE_FAILED_MESSAGE: "Project could not be updated.",
  UPDATED_TITLE: "Project updated",
  createdMessage: (title) => `"${title}" is ready.`,
  deletedMessage: (title) => `"${title}" was deleted.`,
  deleteConfirmDescription: (title) => `Delete "${title}"? This cannot be undone.`,
  updatedMessage: (title) => `"${title}" was saved.`
};

export const DASHBOARD_ALERTS = {
  NO_CATEGORIES_LABEL: "No categories yet",
  PROJECTS_LOADING_DESCRIPTION: "Your project workspace is getting everything ready."
};

export const SHARED_PROJECT_ALERTS = {
  EMPTY_DESCRIPTION: "Projects that other users share with you will appear here.",
  EMPTY_TITLE: "No shared projects yet",
  LEAVE_CONFIRM_TITLE: "Leave shared project?",
  LEAVE_FAILED_TITLE: "Unable to leave this project.",
  LEAVE_FAILED_MESSAGE: "Please try again.",
  LOAD_FAILED_TITLE: "Unable to load shared projects.",
  LOADING_DESCRIPTION: "Projects shared with you are loading.",
  LOADING_TITLE: "Loading shared projects...",
  PAGE_DESCRIPTION: "Projects shared with you by other users will appear here.",
  PAGE_TITLE: "Shared with Me",
  PROJECTS_SECTION_TITLE: "Shared Projects",
  leaveConfirmDescription: (title) =>
    `You will lose access to "${title}". The project owner will need to share this project with you again if you want access later.`,
  leftMessage: (title) => `You left "${title}".`
};

export const TEXT_EDITOR_ALERTS = {
  AI_GENERATED_MESSAGE: "Content is ready and shown in the editor.",
  AI_GENERATED_TITLE: "AI generated",
  ALREADY_INVITED_TITLE: "Already invited",
  CONTENT_REQUIRED_MESSAGE: "Write or select text in the editor before using a quick action.",
  CONTENT_REQUIRED_TITLE: "Content required",
  CONTENT_LOAD_FAILED_MESSAGE: "Saved content could not be loaded.",
  CONTENT_LOAD_FAILED_TITLE: "Content load failed",
  CONTENT_LOAD_STATUS: "Loading content...",
  COPIED_MESSAGE: "Response copied.",
  COPIED_TITLE: "Copied",
  DELETE_FAILED_MESSAGE: "Response could not be deleted.",
  DELETE_FAILED_TITLE: "Delete failed",
  DELETED_MESSAGE: "Response deleted from history.",
  DELETED_TITLE: "Deleted",
  DRAFT_SAVE_FAILED_MESSAGE: "Draft could not be saved.",
  EXPORT_PDF_MESSAGE: "PDF export downloaded.",
  EXPORT_TEXT_MESSAGE: "Text export downloaded.",
  EXPORTED_TITLE: "Exported",
  FAVOURITE_FAILED_MESSAGE: "Favourite could not be saved.",
  FAVOURITE_FAILED_TITLE: "Favourite failed",
  FAVOURITE_REMOVED_MESSAGE: "Response removed from favourites.",
  FAVOURITE_REMOVED_TITLE: "Favourite removed",
  FAVOURITE_SAVED_MESSAGE: "Response added to favourites.",
  FAVOURITE_SAVED_TITLE: "Favourite saved",
  GENERATION_FAILED_MESSAGE: "Could not generate text from OpenAI.",
  GENERATION_FAILED_TITLE: "Generation failed",
  INVITE_FAILED_MESSAGE: "User could not be invited.",
  INVITE_FAILED_TITLE: "Invite failed",
  INVITE_INVALID_EMAIL_MESSAGE: "Enter a valid email address to invite.",
  INVITE_UNAVAILABLE_MESSAGE: "Save this project before inviting users.",
  INVITE_UNAVAILABLE_TITLE: "Invite unavailable",
  NO_RESPONSE_SELECTED: "No response selected yet.",
  SAVE_FAILED_STATUS: "Save failed",
  SAVING_STATUS: "Saving...",
  PROMPT_REQUIRED_MESSAGE: "Enter a prompt before generating.",
  PROMPT_REQUIRED_TITLE: "Prompt required",
  PROJECT_LOAD_FAILED_MESSAGE: "Project details could not be loaded.",
  PROJECT_LOAD_FAILED_TITLE: "Project load failed",
  SAVED_LOCAL_ONLY_MESSAGE: "Generated text could not be saved to project history.",
  SAVED_LOCAL_ONLY_TITLE: "Saved locally only",
  SAVE_FAILED_MESSAGE: "Project could not be saved.",
  SAVE_FAILED_TITLE: "Save failed",
  SAVE_LOCAL_MESSAGE: "Project saved in this browser.",
  SAVE_PROJECT_MESSAGE: "Project saved.",
  SAVED_TITLE: "Saved",
  SHARED_TITLE: "Shared",
  SHARING_UNAVAILABLE_TITLE: "Sharing unavailable",
  SWITCH_SAVE_MESSAGE: "Draft saved before switching.",
  UNSAVED_CHANGES_STATUS: "Unsaved changes",
  UPDATE_FAILED_MESSAGE: "Response could not be updated.",
  UPDATE_FAILED_TITLE: "Update failed",
  UPDATED_MESSAGE: "Response updated.",
  UPDATED_TITLE: "Updated",
  alreadyInvitedMessage: (email) => `${email} is already invited.`,
  sharedMessage: (email) => `${email} was invited to this project.`
};

export const IMAGE_EDITOR_ALERTS = {
  CANVAS_JSON_EXPORTED_MESSAGE: "Canvas JSON exported.",
  CANVAS_SAVE_FAILED_MESSAGE: "Image could not be saved.",
  CANVAS_SAVE_FAILED_BEFORE_SWITCHING_MESSAGE: "Canvas could not be saved before switching.",
  CANVAS_SAVED_LOCAL_MESSAGE: "Image canvas saved in this browser.",
  CANVAS_SAVED_MESSAGE: "Image canvas saved.",
  CANVAS_SAVED_BEFORE_SWITCHING_MESSAGE: "Canvas saved before switching.",
  COPIED_MESSAGE: "Image response copied.",
  DELETED_MESSAGE: "Image response deleted from history.",
  DRAFT_RESTORED_MESSAGE: "Saved image canvas loaded.",
  DRAFT_RESTORED_TITLE: "Draft restored",
  GENERATE_FAILED_MESSAGE: "Demo image response could not be saved.",
  GENERATE_FAILED_TITLE: "Generate failed",
  GENERATED_LOCAL_MESSAGE: "Demo image response inserted into the canvas.",
  GENERATED_SAVED_MESSAGE: "Demo image response saved to history and inserted into the canvas.",
  GENERATED_TITLE: "Image generated",
  HISTORY_LOADED_MESSAGE: "Image response selected.",
  HISTORY_LOADED_TITLE: "History loaded",
  HISTORY_UNAVAILABLE_MESSAGE: "Image history could not be loaded.",
  HISTORY_UNAVAILABLE_TITLE: "History unavailable",
  IMAGE_PNG_EXPORTED_MESSAGE: "Image PNG exported.",
  INSERTED_MESSAGE: "Image response inserted into the canvas.",
  INSERTED_TITLE: "Inserted",
  NO_RESPONSE_SELECTED: "No image response selected yet.",
  RESPONSE_DELETE_FAILED_MESSAGE: "Image response could not be deleted.",
  RESPONSE_FAVOURITE_REMOVED_MESSAGE: "Image response removed from favourites.",
  RESPONSE_FAVOURITE_SAVED_MESSAGE: "Image response saved.",
  RESPONSE_UPDATE_FAILED_MESSAGE: "Image response could not be updated.",
  UPDATED_MESSAGE: "Image response updated.",
  UNSAVED_CANVAS_CONFIRM_DESCRIPTION:
    "Your current canvas has unsaved changes. Save this image draft before loading another response?",
  UNSAVED_CANVAS_CONFIRM_TITLE: "Save changes before switching?"
};

export const PROFILE_ALERTS = {
  NAME_TOO_SHORT_MESSAGE: "Name must be at least 2 characters.",
  NOT_SAVED_TITLE: "Profile not saved",
  UPDATE_FAILED_MESSAGE: "Profile could not be updated.",
  UPDATE_FAILED_TITLE: "Update failed",
  UPDATED_MESSAGE: "Your profile changes were saved.",
  UPDATED_TITLE: "Profile updated"
};

export const AI_HISTORY_TEXT = {
  LOADING: "Loading AI history..."
};

export const VERIFY_EMAIL_TEXT = {
  CHECKING_LINK: "Checking verification link...",
  EXPIRED_HINT: "Account verification links expire in 5 minutes.",
  INVALID_LINK: "This verification link is invalid or incomplete",
  RESEND_BUTTON: "Send New Verification Link",
  RESEND_BUTTON_LOADING: "Sending...",
  SIGN_IN_BACK: "Back to sign in",
  SIGN_IN_CONTINUE: "Continue to sign in",
  TITLE: "Verify email"
};
