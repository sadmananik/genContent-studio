import Button from "../common/Button";
import { AppSidebar } from "../common/Sidebar";

const chats = [
  ["Write a blog introduction about AI tools", "2 hours ago", "active"],
  ["Generate 10 social media post ideas", "1 day ago", ""],
  ["Improve this product description", "2 days ago", ""],
  ["Create image of futuristic city", "3 days ago", ""],
  ["SEO keywords for digital marketing", "4 days ago", ""]
];

export default function ChatHistoryScreen({ onNavigate }) {
  return (
    <section className="screen chat-frame">
      <AppSidebar active="AI Chat History" onNavigate={onNavigate} />
      <aside className="chat-list-panel">
        <div className="panel-heading">
          <h2>AI Chat History</h2>
          <Button>＋ New Chat</Button>
        </div>
        <div className="chat-search">⌕ Search chats... <button>⌯</button></div>
        {chats.map(([title, time, active]) => (
          <article className={`chat-list-item ${active}`} key={title}>
            <span className="soft-icon lavender">◉</span>
            <div>
              <strong>{title}</strong>
              <p>{time}</p>
            </div>
          </article>
        ))}
        <a className="load-link" href="#">Load more chats</a>
      </aside>
      <main className="conversation">
        <header>
          <strong>Write a blog introduction about AI tools</strong>
          <span>☆ ⋯</span>
        </header>
        <div className="message user-message">
          <strong>You</strong>
          <p>Write a blog introduction about AI tools.</p>
          <time>2:30 PM</time>
        </div>
        <div className="message ai-message">
          <strong>✦ AI Assistant</strong>
          <p>Artificial Intelligence (AI) tools are revolutionizing the way we work, create, and solve problems. From automation to content generation, these tools empower businesses and individuals to achieve more in less time.</p>
          <div className="message-actions">▣ ♡ ♧</div>
        </div>
        <div className="composer">Ask anything... <span>▷</span></div>
      </main>
    </section>
  );
}
