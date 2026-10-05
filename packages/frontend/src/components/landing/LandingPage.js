"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Download,
  FolderKanban,
  Github,
  ImageIcon,
  Linkedin,
  Menu,
  Paintbrush,
  PenLine,
  SearchCheck,
  Sparkles,
  Users,
  WandSparkles,
  X,
  Youtube
} from "lucide-react";
import { ROUTES } from "../../constants/navigation";
import { getAuthSession } from "../../lib/auth";
import "./landing.css";

const FEATURES = [
  {
    title: "AI Writing",
    description: "Generate high-quality blog posts, articles, social media content and more.",
    icon: PenLine,
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.12)"
  },
  {
    title: "Content Improvement",
    description: "Refine your content with grammar correction, summarisation, paraphrasing and tone adjustment.",
    icon: WandSparkles,
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)"
  },
  {
    title: "SEO Assistant",
    description: "Get AI-driven SEO suggestions to make your content rank higher on search engines.",
    icon: SearchCheck,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)"
  },
  {
    title: "AI Image Generation",
    description: "Create stunning images from text prompts for your blogs, ads and social projects.",
    icon: ImageIcon,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)"
  },
  {
    title: "Visual Editor",
    description: "Edit and enhance images with AI-powered tools built for creative workflows.",
    icon: Paintbrush,
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.12)"
  },
  {
    title: "Real-Time Collaboration",
    description: "Work together with your team on documents and visual content in one shared workspace.",
    icon: Users,
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.12)"
  }
];

const STEPS = [
  {
    num: "01",
    title: "Create a Project",
    description: "Start a new workspace for your blog, campaign or creative brief.",
    icon: FolderKanban,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)"
  },
  {
    num: "02",
    title: "Generate with AI",
    description: "Turn a short prompt into drafts, images and structured outlines.",
    icon: Sparkles,
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.12)"
  },
  {
    num: "03",
    title: "Refine & Collaborate",
    description: "Improve quality, invite teammates and iterate together in real time.",
    icon: Users,
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)"
  },
  {
    num: "04",
    title: "Export",
    description: "Publish or download polished content ready for every channel.",
    icon: Download,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)"
  }
];

function BrandMark({ text = true }) {
  return (
    <Link className="lp-brand" href="/">
      <Image alt="" aria-hidden="true" height={34} src="/gencontent-logo.png" width={34} />
      {text ? <span>GenContent Studio</span> : null}
    </Link>
  );
}

function HeroProductMock() {
  return (
    <div className="lp-product-shell" aria-hidden="true">
      <aside className="lp-product-side">
        <div className="mini-brand">
          <Sparkles size={14} color="#4f46e5" />
          GenContent
        </div>
        {[
          ["Workspace", true],
          ["Projects", false],
          ["AI Assistant", false],
          ["Templates", false],
          ["Shared", false]
        ].map(([label, active]) => (
          <div className={`lp-side-item${active ? " active" : ""}`} key={label}>
            {label}
          </div>
        ))}
      </aside>
      <div className="lp-product-main">
        <h3>Create Amazing Content</h3>
        <p>Describe what you want to create and let AI do the heavy lifting.</p>
        <div className="lp-composer">
          <div className="placeholder">Write a blog post about sustainable living tips for beginners...</div>
          <div className="lp-composer-row">
            <div className="lp-chip-row">
              <span className="lp-chip">Blog</span>
              <span className="lp-chip">SEO</span>
              <span className="lp-chip">Friendly</span>
            </div>
            <span className="lp-mini-btn">Generate</span>
          </div>
        </div>
        <div className="lp-recent-label">Recent Projects</div>
        <div className="lp-recent-grid">
          <div className="lp-recent-card">
            <div className="thumb" />
            <div className="meta">Eco Lifestyle Guide</div>
          </div>
          <div className="lp-recent-card">
            <div className="thumb t2" />
            <div className="meta">Product Launch Copy</div>
          </div>
          <div className="lp-recent-card">
            <div className="thumb t3" />
            <div className="meta">Social Campaign</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.token) {
      return;
    }

    // Replace so authenticated users don't keep "/" in history and break Back.
    router.replace(ROUTES.DASHBOARD);
  }, [router]);

  return (
    <div className="landing-page">
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <BrandMark />
          <nav className="lp-nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#about">About</a>
          </nav>
          <div className="lp-nav-actions">
            <a className="lp-link-btn lp-desktop-auth" href={ROUTES.LOGIN}>
              Sign In
            </a>
            <a className="lp-btn lp-btn-primary lp-desktop-auth" href={ROUTES.REGISTER}>
              Get Started
            </a>
            <button
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              className="lp-menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        <div className={`lp-container lp-mobile-menu${menuOpen ? " is-open" : ""}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it Works
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>
          <a className="lp-mobile-link" href={ROUTES.LOGIN} onClick={() => setMenuOpen(false)}>
            Sign In
          </a>
          <a
            className="lp-btn lp-btn-primary lp-mobile-cta"
            href={ROUTES.REGISTER}
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </a>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-reveal">
            <span className="lp-pill">AI-Powered Content Creation Platform</span>
            <h1>
              Create better content with AI. <span className="accent">Together.</span>
            </h1>
            <p className="lp-hero-copy">
              Generate, improve, optimise and collaborate on written and visual content — all from
              one intelligent workspace.
            </p>
            <div className="lp-hero-ctas">
              <a className="lp-btn lp-btn-primary lp-btn-lg" href={ROUTES.REGISTER}>
                Start Creating <ArrowRight size={18} />
              </a>
              <a className="lp-btn lp-btn-secondary lp-btn-lg" href="#features">
                Explore Features
              </a>
            </div>
            <div className="lp-hero-points">
              <div className="lp-hero-point">
                <span>
                  <Sparkles size={14} />
                </span>
                AI Powered
              </div>
              <div className="lp-hero-point">
                <span>
                  <Users size={14} />
                </span>
                Real-Time Collaboration
              </div>
              <div className="lp-hero-point">
                <span>
                  <FolderKanban size={14} />
                </span>
                All-in-One Workspace
              </div>
            </div>
          </div>
          <div className="lp-hero-visual lp-reveal lp-reveal-delay">
            <HeroProductMock />
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-pill">Features</span>
            <h2>Everything you need to create, improve and collaborate</h2>
            <p>
              Powerful AI tools for writing, visuals, SEO and teamwork — designed to keep your
              content workflow in one place.
            </p>
          </div>
          <div className="lp-feature-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="lp-feature-card" key={feature.title}>
                  <div className="lp-feature-top">
                    <span className="lp-feature-icon" style={{ background: feature.bg, color: feature.color }}>
                      <Icon size={20} />
                    </span>
                    <ArrowRight className="lp-feature-arrow" size={16} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-alt" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-pill">How it Works</span>
            <h2>From idea to amazing content in four simple steps</h2>
            <p>A clear path from first prompt to polished, shareable content.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <article className="lp-step" key={step.num}>
                  <div className="lp-step-icon" style={{ background: step.bg, color: step.color }}>
                    <Icon size={24} />
                  </div>
                  <span className="lp-step-num">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-showcase" id="see-it-in-action">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-pill">See it in Action</span>
            <h2>A smarter way to create content</h2>
            <p>
              Draft, refine, optimise and illustrate in a single workspace built for creators and
              teams.
            </p>
          </div>
          <div className="lp-showcase-image">
            <Image
              alt="GenContent Studio workspace with AI Assistant, SEO suggestions, image generation, and export tools"
              className="lp-showcase-img"
              height={900}
              priority={false}
              src="/landing/dashboard-showcase.jpg"
              width={1400}
            />
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-alt" id="about">
        <div className="lp-container">
          <div className="lp-about">
            <div>
              <span className="lp-pill">About</span>
              <h2>Built for modern content teams</h2>
              <p>
                GenContent Studio brings AI writing, image creation, SEO guidance and real-time
                collaboration together so students, marketers and creators can ship better content
                faster — without juggling disconnected tools.
              </p>
            </div>
            <div className="lp-about-stats">
              <div className="lp-about-stat">
                <strong>1</strong>
                <span>Unified workspace</span>
              </div>
              <div className="lp-about-stat">
                <strong>AI</strong>
                <span>Writing + visuals</span>
              </div>
              <div className="lp-about-stat">
                <strong>Live</strong>
                <span>Team collaboration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-banner">
            <h2>Ready to turn your ideas into content?</h2>
            <p>Create your first AI-powered project with GenContent Studio.</p>
            <a className="lp-btn lp-btn-primary lp-btn-lg" href={ROUTES.REGISTER}>
              Get Started <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <BrandMark />
              <p>Create. Improve. Collaborate. All with AI.</p>
            </div>
            <div className="lp-footer-links">
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="lp-footer-social" aria-label="Social links">
              <a aria-label="GitHub" className="lp-social" href="https://github.com" rel="noreferrer" target="_blank">
                <Github size={16} />
              </a>
              <a aria-label="LinkedIn" className="lp-social" href="https://linkedin.com" rel="noreferrer" target="_blank">
                <Linkedin size={16} />
              </a>
              <a aria-label="X" className="lp-social" href="https://x.com" rel="noreferrer" target="_blank">
                <X size={16} />
              </a>
              <a aria-label="YouTube" className="lp-social" href="https://youtube.com" rel="noreferrer" target="_blank">
                <Youtube size={16} />
              </a>
            </div>
          </div>
          <div className="lp-footer-copy">© 2026 GenContent Studio. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
