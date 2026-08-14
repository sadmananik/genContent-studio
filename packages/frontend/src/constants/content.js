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
