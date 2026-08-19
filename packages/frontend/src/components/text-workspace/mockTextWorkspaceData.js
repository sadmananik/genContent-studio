export const mockTextProject = {
  id: "project-future-ai",
  title: "Blog Post: Future of AI",
  category: "Blog Post",
  type: "Text Project",
  lastUpdated: "Last updated 5 minutes ago",
  saveStatus: "Draft saved",
  content:
    "<p>Start writing your content here...</p><p>Artificial Intelligence is changing the way small businesses create digital content, plan campaigns, and connect with customers. This workspace is now powered by TipTap and ready for future save/API integration.</p>"
};

export const mockPromptActions = [
  "Rewrite",
  "Improve Tone",
  "Summarise",
  "Expand",
  "SEO Suggestions"
];

export const mockAIResponses = [
  {
    id: "response-1",
    prompt: "Write an introduction about how AI tools help small businesses.",
    response:
      "Artificial Intelligence is changing the way small businesses create digital content. From drafting blog posts to refining product descriptions, AI tools help small teams move faster while keeping their messaging clear and consistent.",
    timestamp: "10 minutes ago",
    favourite: true
  },
  {
    id: "response-2",
    prompt: "Suggest SEO keywords for a blog post about AI tools.",
    response:
      "AI tools for small business, content automation, AI writing assistant, digital marketing tools, business productivity software.",
    timestamp: "20 minutes ago",
    favourite: false
  }
];

export const mockAIHistory = [
  {
    id: "history-1",
    prompt: "Blog introduction about AI",
    timestamp: "10 minutes ago",
    favourite: true
  },
  {
    id: "history-2",
    prompt: "Rewrite this paragraph",
    timestamp: "20 minutes ago",
    favourite: false
  },
  {
    id: "history-3",
    prompt: "SEO keyword suggestions",
    timestamp: "Yesterday",
    favourite: false
  }
];
