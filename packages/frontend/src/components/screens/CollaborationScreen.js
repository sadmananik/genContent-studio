import EditorChrome from "../common/EditorChrome";

export default function CollaborationScreen() {
  return (
    <section className="screen">
      <EditorChrome title="Marketing Campaign ⌄" collaboration aside={<CollaborationPanel />}>
        <article className="document-card collaborative-doc">
          <h2>Summer Sale Campaign ☀</h2>
          <p>
            Our summer sale campaign is designed to bring amazing deals to our customers. We&apos;ll
            focus on digital platforms to reach a wider audience and drive more engagement.
          </p>
          <p>Key highlights of the campaign:</p>
          <ul>
            <li>Exclusive discounts</li>
            <li>Limited time offers</li>
            <li>Free shipping on orders over $50</li>
            <li>24/7 customer support</li>
          </ul>
          <span className="cursor-tag anik">Anik</span>
          <span className="cursor-tag sravya">Sravya</span>
          <span className="cursor-tag akramul">Akramul</span>
          <p className="prompt-line">Start typing or use AI Assistant to generate content...</p>
        </article>
        <footer className="editor-status">
          <span>♟ 4 people editing</span>
          <span>128 words</span>
          <input type="range" defaultValue="70" />
          <span>100%</span>
        </footer>
      </EditorChrome>
    </section>
  );
}

function CollaborationPanel() {
  const users = [
    ["Anik Rahman (You)", "green"],
    ["Sravya R.", "blue"],
    ["Akramul H.", "pink"],
    ["John D.", "cyan"]
  ];
  const feed = [
    "Sravya R. edited the document",
    "Akramul H. added a comment",
    "John D. joined the document"
  ];

  return (
    <aside className="collab-panel">
      <h4>Collaboration</h4>
      <strong>Active Users (4)</strong>
      {users.map(([name, color]) => (
        <div className="active-user" key={name}>
          <span className={`avatar-dot ${color}`} />
          <span>{name}</span>
          <i />
        </div>
      ))}
      <strong>Activity Feed</strong>
      {feed.map((item, index) => (
        <div className="feed-item" key={item}>
          <span className="avatar avatar-2">{item.slice(0, 2)}</span>
          <p>
            {item}
            <small>{index * 3 + 2} min ago</small>
          </p>
        </div>
      ))}
      <div className="mini-composer">
        Type a message... <span>▷</span>
      </div>
    </aside>
  );
}
