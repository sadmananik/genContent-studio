import Button from "../common/Button";
import EditorChrome from "../common/EditorChrome";
import { MOCK_RECENT_PROJECTS } from "../../constants/dashboard";

export default function EditorScreen() {
  return (
    <section className="screen">
      <EditorChrome title={MOCK_RECENT_PROJECTS[0].title} aside={<AssistantPanel />}>
        <article className="document-card">
          <h2>The Future of AI Tools</h2>
          <p>Artificial Intelligence (AI) tools are revolutionizing the way we work and create.</p>
          <p>
            From content generation to data analysis, AI tools are becoming essential for businesses
            and individuals alike.
          </p>
          <p>
            In this blog, we&apos;ll explore the most impactful AI tools, their use cases, and how
            they can boost productivity and creativity.
          </p>
        </article>
        <footer className="editor-status">
          <span>Words: 232</span>
          <span>Characters: 1,542</span>
          <span>100%</span>
          <input type="range" defaultValue="55" />
          <span>↔</span>
        </footer>
      </EditorChrome>
    </section>
  );
}

function AssistantPanel() {
  return (
    <aside className="assistant-panel">
      <h4>AI Assistant</h4>
      <textarea defaultValue="Improve this content" />
      <Button className="full-width">✦ Generate</Button>
      <h4>Suggestions</h4>
      {[
        "Improve clarity",
        "Make it more engaging",
        "Shorten this paragraph",
        "Expand this paragraph"
      ].map((item) => (
        <button className="suggestion" key={item}>
          ✧ {item}
        </button>
      ))}
    </aside>
  );
}
