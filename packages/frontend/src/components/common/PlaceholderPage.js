export default function PlaceholderPage({
  title,
  description = "Protected route placeholder for future workspace content."
}) {
  return (
    <main className="dashboard-content">
      <div className="placeholder-panel">
        <span className="soft-icon lavender">▱</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </main>
  );
}
