const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="workspace">
        <div className="intro">
          <p className="eyebrow">AI-driven content creation platform</p>
          <h1>GenContent Studio</h1>
          <p>
            A capstone-ready monorepo foundation with a Next.js frontend, an
            Express backend, and room to connect the ChatGPT API in the next
            sprint.
          </p>
        </div>

        <div className="status-grid" aria-label="Project services">
          <article>
            <span>Frontend</span>
            <strong>Next.js</strong>
            <p>Running on port 3000.</p>
          </article>
          <article>
            <span>Backend</span>
            <strong>Express</strong>
            <p>API expected at {API_BASE_URL}.</p>
          </article>
          <article>
            <span>AI</span>
            <strong>ChatGPT API</strong>
            <p>Prepared for OpenAI integration.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
