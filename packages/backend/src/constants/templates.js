const TEMPLATE_VISIBILITY = {
  PRIVATE: "private",
  PUBLIC: "public"
};

const TEMPLATE_VISIBILITY_VALUES = Object.values(TEMPLATE_VISIBILITY);

const TEMPLATE_CATEGORIES = {
  BLOG: "Blog",
  BUSINESS: "Business",
  EDUCATION: "Education",
  EMAIL: "Email",
  MARKETING: "Marketing",
  OTHER: "Other",
  SOCIAL_MEDIA: "Social Media"
};

const TEMPLATE_CATEGORY_VALUES = Object.values(TEMPLATE_CATEGORIES);

const TEMPLATE_MESSAGES = {
  CREATE_FAILED: "Template could not be published",
  DELETE_FORBIDDEN: "Template not found or only its creator can delete it",
  DELETE_SUCCESS: "Template deleted successfully.",
  FAVORITE_SUCCESS: "Template added to favorites.",
  NOT_FOUND: "Template not found",
  PRIVATE_FORBIDDEN: "This template is private",
  PROJECT_OWNER_ONLY: "Project not found or only its owner can publish it as a template",
  TITLE_REQUIRED: "Template title is required",
  TYPE_INVALID: "Template project type must be text or image",
  UPDATE_FORBIDDEN: "Template not found or only its creator can update it",
  UNFAVORITE_SUCCESS: "Template removed from favorites.",
  VISIBILITY_INVALID: "Template visibility must be public or private"
};

const SYSTEM_TEMPLATES = [
  {
    systemKey: "blog-post-generator",
    title: "Blog Post Generator",
    description: "Create a clear, structured article from an AI-ready brief.",
    category: TEMPLATE_CATEGORIES.BLOG,
    projectType: "text",
    starterPrompt: "Write a detailed blog article about [topic] for [audience].",
    starterContent:
      "<h1>Article Title</h1><h2>Introduction</h2><p>Introduce the topic and its value.</p><h2>Main Content</h2><p>Develop the key ideas with useful examples.</p><h2>Conclusion</h2><p>Summarise the main takeaway and next step.</p>",
    tone: "Informative",
    tags: ["blog", "article", "seo"]
  },
  {
    systemKey: "product-description",
    title: "Product Description",
    description: "Turn product details into concise, benefit-led sales copy.",
    category: TEMPLATE_CATEGORIES.MARKETING,
    projectType: "text",
    starterPrompt: "Write a persuasive product description for [product] aimed at [customer].",
    starterContent:
      "<h2>Product Name</h2><p>Short value proposition.</p><h3>Key Benefits</h3><ul><li>Benefit one</li><li>Benefit two</li><li>Benefit three</li></ul>",
    tone: "Persuasive",
    tags: ["product", "sales", "marketing"]
  },
  {
    systemKey: "email-campaign",
    title: "Email Campaign",
    description: "Draft a focused campaign email with a strong call to action.",
    category: TEMPLATE_CATEGORIES.EMAIL,
    projectType: "text",
    starterPrompt: "Create an email campaign promoting [offer] to [audience].",
    starterContent:
      "<h2>Subject Line</h2><p>Opening hook</p><p>Main campaign message</p><p><strong>Call to action</strong></p>",
    tone: "Friendly",
    tags: ["email", "campaign", "conversion"]
  },
  {
    systemKey: "social-media-caption",
    title: "Social Media Caption",
    description: "Build an engaging caption that fits a social campaign.",
    category: TEMPLATE_CATEGORIES.SOCIAL_MEDIA,
    projectType: "text",
    starterPrompt: "Write a social media caption about [topic] for [platform].",
    starterContent:
      "<p>Attention-grabbing opening</p><p>Supporting message</p><p>Call to action and relevant hashtags</p>",
    tone: "Engaging",
    tags: ["social", "caption", "engagement"]
  },
  {
    systemKey: "business-proposal",
    title: "Business Proposal",
    description: "Start a professional proposal with a reusable section structure.",
    category: TEMPLATE_CATEGORIES.BUSINESS,
    projectType: "text",
    starterPrompt: "Draft a business proposal for [client] addressing [problem].",
    starterContent:
      "<h1>Business Proposal</h1><h2>Executive Summary</h2><h2>Objectives</h2><h2>Proposed Solution</h2><h2>Timeline</h2><h2>Next Steps</h2>",
    tone: "Professional",
    tags: ["proposal", "business", "client"]
  },
  {
    systemKey: "academic-summary",
    title: "Academic Summary",
    description: "Organise source material into a concise academic summary.",
    category: TEMPLATE_CATEGORIES.EDUCATION,
    projectType: "text",
    starterPrompt: "Summarise the key arguments and findings about [topic].",
    starterContent:
      "<h1>Academic Summary</h1><h2>Context</h2><h2>Key Arguments</h2><h2>Evidence</h2><h2>Conclusion</h2>",
    tone: "Academic",
    tags: ["academic", "summary", "education"]
  },
  {
    systemKey: "product-mockup",
    title: "Product Mockup",
    description: "Generate a clean product presentation suitable for a campaign.",
    category: TEMPLATE_CATEGORIES.MARKETING,
    projectType: "image",
    starterPrompt: "Create a polished studio mockup of [product] on a clean background.",
    style: "Photorealistic",
    tags: ["product", "mockup", "studio"]
  },
  {
    systemKey: "social-media-ad-image",
    title: "Social Media Ad Image",
    description: "Create a bold promotional visual sized for social media.",
    category: TEMPLATE_CATEGORIES.SOCIAL_MEDIA,
    projectType: "image",
    starterPrompt: "Design a high-impact social media advertisement for [offer].",
    style: "Modern advertising",
    tags: ["social", "advertising", "campaign"]
  },
  {
    systemKey: "logo-concept",
    title: "Logo Concept",
    description: "Explore a simple visual identity direction for a brand.",
    category: TEMPLATE_CATEGORIES.BUSINESS,
    projectType: "image",
    starterPrompt: "Create a clean logo concept for [brand] in the [industry] industry.",
    style: "Minimal vector",
    tags: ["logo", "brand", "identity"]
  },
  {
    systemKey: "poster-design",
    title: "Poster Design",
    description: "Generate a clear event or campaign poster concept.",
    category: TEMPLATE_CATEGORIES.MARKETING,
    projectType: "image",
    starterPrompt: "Design a striking poster for [event] with space for key information.",
    style: "Editorial poster",
    tags: ["poster", "event", "layout"]
  },
  {
    systemKey: "thumbnail-image",
    title: "Thumbnail Image",
    description: "Create a readable, high-contrast thumbnail concept.",
    category: TEMPLATE_CATEGORIES.SOCIAL_MEDIA,
    projectType: "image",
    starterPrompt: "Create an attention-grabbing thumbnail about [topic].",
    style: "High contrast",
    tags: ["thumbnail", "video", "social"]
  },
  {
    systemKey: "character-concept",
    title: "Character Concept",
    description: "Develop a distinctive character direction from a short brief.",
    category: TEMPLATE_CATEGORIES.OTHER,
    projectType: "image",
    starterPrompt: "Create a full character concept for [character description].",
    style: "Concept art",
    tags: ["character", "concept", "illustration"]
  }
];

module.exports = {
  SYSTEM_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_VALUES,
  TEMPLATE_MESSAGES,
  TEMPLATE_VISIBILITY,
  TEMPLATE_VISIBILITY_VALUES
};
