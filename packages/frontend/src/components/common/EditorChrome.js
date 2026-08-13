import Button from "./Button";
import { AvatarGroup } from "./Cards";
import { EditorRail } from "./Sidebar";

export function EditorTopbar({ title, savedLabel = "Saved", collaboration = false }) {
  return (
    <header className="editor-topbar">
      <Button variant="ghost">← Back to Project</Button>
      <strong>{title}</strong>
      <span className="saved-dot">◎ {savedLabel}</span>
      <div className="topbar-spacer" />
      <AvatarGroup extra={collaboration} />
      <Button>♙ Share</Button>
      <Button variant="icon">⇩</Button>
    </header>
  );
}

export function FormatToolbar() {
  const tools = ["Paragraph", "B", "I", "U", "⌁", "≡", "☷", "↙", "🔗", "▧", "↶", "↷", "⋯"];

  return (
    <div className="format-toolbar">
      {tools.map((tool) => (
        <button className={tool === "Paragraph" ? "select-tool" : ""} key={tool}>
          {tool}
        </button>
      ))}
    </div>
  );
}

export default function EditorChrome({ children, title, aside, collaboration = false }) {
  return (
    <div className="editor-shell">
      <EditorTopbar
        title={title}
        collaboration={collaboration}
        savedLabel={collaboration ? "All changes saved" : "Saved"}
      />
      <div className="editor-body">
        <EditorRail />
        <main className="document-area">
          <FormatToolbar />
          {children}
        </main>
        {aside}
      </div>
    </div>
  );
}
