export function StatCard({ icon, value, label, tone = "violet" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span className="soft-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}

export function ProjectCard({ icon, title, type, updated, tone = "mint", clickable = false }) {
  return (
    <article className={`project-card ${clickable ? "clickable" : ""}`}>
      <div className="card-topline">
        <span className={`soft-icon ${tone}`}>{icon}</span>
        <button aria-label="Project options">⋮</button>
      </div>
      <strong>{title}</strong>
      <p>{type}</p>
      <small>{updated}</small>
    </article>
  );
}

export function AvatarGroup({ extra = false }) {
  const people = ["AR", "SR", "AH", "JD"];

  return (
    <div className="avatar-group" aria-label="Collaborators">
      {people.map((person, index) => (
        <span className={`avatar avatar-${index + 1}`} key={person}>
          {person}
        </span>
      ))}
      {extra && <span className="avatar-more">+2</span>}
    </div>
  );
}
