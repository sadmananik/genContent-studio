import Image from "next/image";
import { ImageIcon, PenLine, SearchCheck, WandSparkles } from "lucide-react";

const FEATURE_CHIPS = [
  { label: "AI Writing", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.12)", icon: PenLine },
  {
    label: "Content Improvement",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    icon: WandSparkles
  },
  { label: "SEO Suggestions", color: "#f90c0c", bg: "rgb(245 11 11 / 12%)", icon: SearchCheck },
  {
    label: "AI Image Generation",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    icon: ImageIcon
  }
];

export default function AuthPageLayout({ children }) {
  return (
    <section className="signin-page">
      <a className="signin-home-link" href="/">
        ← Back to home
      </a>

      <div className="signin-layout">
        <div className="signin-marketing">
          <span className="signin-pill">All-in-one AI content workspace</span>
          <h1>
            Create, Improve and <span>Collaborate</span> with AI.
          </h1>
          <p className="signin-lead">
            From blog posts to social media content, images and more — everything you need in one
            intelligent workspace.
          </p>

          <div className="signin-chips">
            {FEATURE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  className="signin-chip"
                  key={chip.label}
                  style={{ background: chip.bg, color: chip.color }}
                >
                  <Icon size={14} />
                  {chip.label}
                </span>
              );
            })}
          </div>

          <div className="signin-preview">
            <Image
              alt="GenContent Studio 3D workspace preview"
              className="signin-preview-img"
              height={1020}
              priority
              quality={100}
              sizes="(max-width: 979px) 92vw, min(720px, 52vw)"
              src="/images/signin-showcase.png"
              unoptimized
              width={1530}
            />
          </div>
        </div>

        <div className="signin-form-wrap">{children}</div>
      </div>
    </section>
  );
}
