"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Globe,
  Image as ImageIcon,
  Lightbulb,
  SearchCheck,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { UserAvatar } from "../common/UserAvatar";
import { API_PROJECT_TYPES, PROJECT_TYPES } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { stashPendingGenerate } from "../../lib/pendingGenerate";
import { useAppStore } from "../../store";
import "./dashboard.css";

const GENERATE_TABS = [
  { id: "text", label: "Text", type: API_PROJECT_TYPES.TEXT },
  { id: "image", label: "Image", type: API_PROJECT_TYPES.IMAGE }
];

const QUICK_ACTIONS = [
  {
    id: "generate-content",
    title: "Generate Content",
    description: "Create blogs, posts and more with AI.",
    href: ROUTES.TEMPLATES,
    icon: FileText,
    tone: "violet"
  },
  {
    id: "generate-image",
    title: "Generate Image",
    description: "Turn prompts into visual assets.",
    href: `${ROUTES.PROJECTS}?type=image`,
    icon: ImageIcon,
    tone: "green"
  },
  {
    id: "improve-content",
    title: "Improve Content",
    description: "Refine tone, clarity and structure.",
    href: ROUTES.TEMPLATES,
    icon: WandSparkles,
    tone: "blue"
  },
  {
    id: "seo-suggestions",
    title: "SEO Suggestions",
    description: "Optimise content for better ranking.",
    href: ROUTES.TEMPLATES,
    icon: SearchCheck,
    tone: "seo"
  }
];

const CONTENT_TYPES = ["Blog Post", "Social Post", "Article", "Product Description"];
const TONES = ["Professional", "Friendly", "Persuasive", "Casual"];
const LANGUAGES = ["English"];

export default function DashboardScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const projectState = useAppStore((state) => state.projectState);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const fetchSharedProjects = useAppStore((state) => state.fetchSharedProjects);
  const user = auth.user || { name: "Creator" };
  const first = firstName(user.name);
  const [activeTab, setActiveTab] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const recentProjects = useMemo(
    () => [...projectState.projects].slice(0, 4).map(formatProjectCard),
    [projectState.projects]
  );

  const sharedProjects = useMemo(
    () => (projectState.sharedProjects || []).slice(0, 4).map(formatSharedCard),
    [projectState.sharedProjects]
  );

  const recentActivity = useMemo(
    () => buildActivityFeed(projectState.projects).slice(0, 5),
    [projectState.projects]
  );

  useEffect(() => {
    if (!auth.token) {
      return;
    }

    fetchProjects().catch(() => {});
    fetchSharedProjects().catch(() => {});
  }, [auth.token, fetchProjects, fetchSharedProjects]);

  function handleGenerate(event) {
    event.preventDefault();
    const trimmed = prompt.trim();

    if (!trimmed) {
      setGenerateError("Describe what you want to create first.");
      return;
    }

    const tab = GENERATE_TABS.find((item) => item.id === activeTab) || GENERATE_TABS[0];
    setIsGenerating(true);
    setGenerateError("");

    const title = trimmed.length > 48 ? `${trimmed.slice(0, 48).trim()}…` : trimmed;
    const fullPrompt = `${trimmed}\n\nTone: ${tone}. Language: ${language}.`;

    stashPendingGenerate({
      title,
      type: tab.type,
      category: contentType,
      description: fullPrompt,
      starterPrompt: fullPrompt,
      tone,
      style: language
    });

    router.push(`${ROUTES.EDITOR}?type=${tab.type}&autogenerate=1`);
  }

  return (
    <main className="dash-page">
      <section className="dash-hero">
        <div>
          <h1>
            {greeting()}, {first} 👋
          </h1>
          <p>Turn your ideas into high-quality content with the power of AI.</p>
        </div>
        <Link className="dash-hero-banner" href={ROUTES.TEMPLATES}>
          <span className="dash-hero-banner-icon">
            <Sparkles size={18} />
          </span>
          <span>
            Create amazing content faster with AI
            <small>Browse templates and start in seconds</small>
          </span>
          <ArrowRight size={18} />
        </Link>
      </section>

      <form className="dash-generate" onSubmit={handleGenerate}>
        <div className="dash-generate-top">
          <div className="dash-tabs" role="tablist" aria-label="Generation mode">
            {GENERATE_TABS.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link className="dash-examples" href={ROUTES.TEMPLATES}>
            <Lightbulb size={15} />
            Examples
          </Link>
        </div>

        <label className="dash-prompt" htmlFor="dash-prompt">
          <span className="sr-only">Prompt</span>
          <textarea
            id="dash-prompt"
            maxLength={4000}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe what you want to create..."
            rows={5}
            value={prompt}
          />
          <span className="dash-counter">{prompt.length}/4000</span>
        </label>

        <div className="dash-generate-bar">
          <div className="dash-selects">
            <label className="dash-select-chip">
              <FileText aria-hidden="true" size={15} strokeWidth={1.9} />
              <span className="dash-select-chip-label">{contentType}</span>
              <ChevronDown aria-hidden="true" className="dash-select-chevron" size={14} strokeWidth={2.2} />
              <span className="sr-only">Content type</span>
              <select
                aria-label="Content type"
                onChange={(event) => setContentType(event.target.value)}
                value={contentType}
              >
                {CONTENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="dash-select-chip">
              <Sparkles aria-hidden="true" size={15} strokeWidth={1.9} />
              <span className="dash-select-chip-label">Tone: {tone}</span>
              <ChevronDown aria-hidden="true" className="dash-select-chevron" size={14} strokeWidth={2.2} />
              <span className="sr-only">Tone</span>
              <select aria-label="Tone" onChange={(event) => setTone(event.target.value)} value={tone}>
                {TONES.map((option) => (
                  <option key={option} value={option}>
                    Tone: {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="dash-select-chip">
              <Globe aria-hidden="true" size={15} strokeWidth={1.9} />
              <span className="dash-select-chip-label">Language: {language}</span>
              <ChevronDown aria-hidden="true" className="dash-select-chevron" size={14} strokeWidth={2.2} />
              <span className="sr-only">Language</span>
              <select
                aria-label="Language"
                onChange={(event) => setLanguage(event.target.value)}
                value={language}
              >
                {LANGUAGES.map((option) => (
                  <option key={option} value={option}>
                    Language: {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="dash-generate-btn" disabled={isGenerating} type="submit">
            <Sparkles size={16} />
            {isGenerating ? "Starting..." : "Generate"}
            <ArrowRight size={16} />
          </button>
        </div>
        {generateError ? <p className="dash-error">{generateError}</p> : null}
      </form>

      <section className="dash-section">
        <div className="dash-section-head">
          <h2>Quick Actions</h2>
        </div>
        <div className="dash-quick-grid">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link className={`dash-quick-card tone-${action.tone}`} href={action.href} key={action.id}>
                <span className="dash-quick-icon">
                  <Icon size={18} />
                </span>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
                <span className="dash-quick-arrow">
                  <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-section-head">
          <h2>Recent Projects</h2>
          <Link href={ROUTES.PROJECTS}>
            View all <ArrowRight size={15} />
          </Link>
        </div>
        {projectState.loading && recentProjects.length === 0 ? (
          <p className="dash-empty">Loading projects...</p>
        ) : recentProjects.length > 0 ? (
          <div className="dash-project-grid">
            {recentProjects.map((project) => (
              <Link className="dash-project-card" href={project.href} key={project.id}>
                <div className={`dash-project-thumb tone-${project.tone}`} />
                <div className="dash-project-body">
                  <strong>{project.title}</strong>
                  <div className="dash-project-meta">
                    <span className={`dash-tag tone-${project.tone}`}>{project.type}</span>
                    <span>{project.updated}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="dash-empty">
            No projects yet.{" "}
            <Link href={ROUTES.PROJECTS}>Create your first project</Link>
          </p>
        )}
      </section>

      <section className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-section-head">
            <h2>Recent Activity</h2>
          </div>
          {recentActivity.length > 0 ? (
            <ul className="dash-activity-list">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <span className={`dash-activity-icon tone-${item.tone}`}>
                    {item.tone === "green" ? <ImageIcon size={15} /> : <FileText size={15} />}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty">Activity will appear as you create and edit projects.</p>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-section-head">
            <h2>Shared with Me</h2>
            <Link href={ROUTES.SHARED}>
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {sharedProjects.length > 0 ? (
            <ul className="dash-shared-list">
              {sharedProjects.map((project) => (
                <li key={project.id}>
                  <Link href={project.href}>
                    <div className={`dash-shared-thumb tone-${project.tone}`} />
                    <div className="dash-shared-copy">
                      <strong>{project.title}</strong>
                      <p>
                        {project.ownerName}
                        <span>{project.updated}</span>
                      </p>
                    </div>
                    <div className="dash-shared-avatars">
                      {project.collaborators.slice(0, 3).map((person) => (
                        <UserAvatar
                          className="h-7 w-7 text-[10px]"
                          key={person._id || person.id || person.email || person.name}
                          user={person}
                        />
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty">Nothing shared with you yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name = "") {
  return name.trim().split(/\s+/)[0] || "there";
}

function formatProjectCard(project) {
  const type = project.type === API_PROJECT_TYPES.IMAGE ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT;
  const projectId = project._id || project.id;

  return {
    id: projectId,
    title: project.title,
    type,
    tone: type === PROJECT_TYPES.IMAGE ? "green" : "violet",
    updated: formatRelativeTime(project.updatedAt),
    href: `${ROUTES.EDITOR}?projectId=${projectId}&type=${
      type === PROJECT_TYPES.IMAGE ? API_PROJECT_TYPES.IMAGE : API_PROJECT_TYPES.TEXT
    }`
  };
}

function formatSharedCard(project) {
  const card = formatProjectCard(project);
  return {
    ...card,
    ownerName: project.owner?.name || "Collaborator",
    collaborators: [
      project.owner,
      ...(project.collaborators || [])
    ].filter(Boolean)
  };
}

function buildActivityFeed(projects) {
  return [...projects]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .map((project) => {
      const isImage = project.type === API_PROJECT_TYPES.IMAGE;
      return {
        id: project._id || project.id,
        title: isImage
          ? `You updated image project “${project.title}”`
          : `You updated “${project.title}”`,
        time: formatRelativeTime(project.updatedAt),
        tone: isImage ? "green" : "violet"
      };
    });
}

function formatRelativeTime(value) {
  if (!value) {
    return "Just now";
  }

  const updatedAt = new Date(value);
  const diffInSeconds = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 1000));

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}
