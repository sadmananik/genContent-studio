import Link from "next/link";
import Button from "../common/Button";
import { AvatarGroup, ProjectCard, StatCard } from "../common/Cards";

export default function DashboardScreen() {
  const projects = [
    ["▣", "Blog Post: Future of AI", "Text Project", "Updated 2 hours ago", "mint"],
    ["T", "Marketing Banner", "Image Project", "Updated 1 day ago", "lavender"],
    ["T", "Product Description", "Text Project", "Updated 2 days ago", "lavender"],
    ["▣", "Social Media Post", "Image Project", "Updated 3 days ago", "mint"]
  ];

  return (
    <main className="dashboard-content">
      <header className="dashboard-topbar">
        <button className="icon-button">☰</button>
        <div className="search-box">
          ⌕ <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </div>
        <div className="topbar-spacer" />
        <button className="icon-button">♧</button>
        <AvatarGroup />
        <strong>Anik Rahman⌄</strong>
      </header>
      <div className="title-row">
        <div>
          <h2>Welcome back, Anik! 👋</h2>
          <p>Let&apos;s create something amazing today.</p>
        </div>
        <Link className="btn btn-primary link-button" href="/editor">
          ＋ New Project
        </Link>
      </div>
      <div className="stats-grid">
        <StatCard icon="▣" value="12" label="Total Projects" />
        <StatCard icon="▤" value="7" label="Text Projects" tone="mint" />
        <StatCard icon="▧" value="5" label="Image Projects" tone="violet" />
        <StatCard icon="◩" value="34" label="AI Generations" tone="mint" />
      </div>
      <SectionTitle title="Recent Projects" />
      <div className="project-grid">
        {projects.map(([icon, title, type, updated, tone]) => (
          <Link href={title === "Marketing Banner" ? "/collaboration" : "/editor"} key={title}>
            <ProjectCard
              icon={icon}
              title={title}
              type={type}
              updated={updated}
              tone={tone}
              clickable
            />
          </Link>
        ))}
      </div>
      <SectionTitle title="Recent AI Chats" />
      <Link className="chat-summary clickable" href="/chat-history">
        <span className="soft-icon lavender">T</span>
        <div>
          <strong>Write a blog introduction about AI tools</strong>
          <p>Artificial Intelligence is transforming the way we work, create, and...</p>
        </div>
        <button>☆</button>
        <button>⋯</button>
      </Link>
    </main>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      <a href="#">View All</a>
    </div>
  );
}
