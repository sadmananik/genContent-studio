import Link from "next/link";
import { cn } from "../../lib/styles";

const badgeTones = {
  violet: "bg-violet-50 text-violet-600",
  lavender: "bg-violet-50 text-violet-600",
  mint: "bg-emerald-50 text-emerald-700"
};

export function IconBadge({ children, tone = "" }) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-extrabold",
        badgeTones[tone] || badgeTones.violet
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({ icon, value, label, tone = "violet" }) {
  return (
    <article className="flex min-h-22 items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <IconBadge>{icon}</IconBadge>
      <div>
        <strong className="text-2xl text-slate-950">{value}</strong>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </article>
  );
}

export function StatGrid({ items, label }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={label}>
      {items.map((item) => (
        <StatCard
          icon={item.icon}
          value={item.value}
          label={item.label}
          tone={item.tone}
          key={item.label}
        />
      ))}
    </section>
  );
}

export function WelcomePanel({ title, description, action }) {
  return (
    <section className="mb-6 flex flex-col items-start justify-between gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_22px_rgba(16,24,40,0.04)] md:flex-row md:items-center">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 md:text-3xl">{title}</h2>
        <p className="mt-2 text-slate-500">{description}</p>
      </div>
      {action}
    </section>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="mb-4 mt-8 flex items-center justify-between gap-4">
      <h3 className="m-0 text-xl font-bold text-slate-950">{title}</h3>
      {action}
    </div>
  );
}

export function ProjectCard({ icon, title, type, updated, tone = "mint", clickable = false }) {
  return (
    <article
      className={cn(
        "min-h-36 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)]",
        clickable && "cursor-pointer"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <IconBadge tone={tone}>{icon}</IconBadge>
        <button
          className="grid h-9 w-9 place-items-center rounded-md bg-white text-slate-500 hover:bg-slate-50"
          aria-label="Project options"
        >
          ⋮
        </button>
      </div>
      <strong className="block text-sm text-slate-950">{title}</strong>
      <p className="mt-1 text-xs text-slate-500">{type}</p>
      <small className="mt-1 block text-xs text-slate-500">{updated}</small>
    </article>
  );
}

export function RecentProjectCard({ project, href = "/editor" }) {
  return (
    <Link
      className="grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:bg-violet-50/70 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)] sm:grid-cols-[2.625rem_minmax(0,1fr)] sm:gap-4"
      href={href}
    >
      <IconBadge tone={project.tone}>{project.icon}</IconBadge>
      <div>
        <strong className="block [overflow-wrap:anywhere] text-sm text-slate-950">
          {project.title}
        </strong>
        <p className="mt-1 text-xs text-slate-500">
          {project.category} • {project.type} Project
        </p>
        <small className="mt-1 block text-xs text-slate-500">{project.updated}</small>
      </div>
    </Link>
  );
}

export function CategorySummary({ items }) {
  return (
    <div className="grid rounded-lg border border-slate-200 bg-white p-2 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      {items.map((item) => (
        <div
          className="flex min-h-12 items-center justify-between border-t border-slate-100 px-3 first:border-t-0"
          key={item.label}
        >
          <span className="text-slate-700">{item.label}</span>
          <strong className="text-slate-950">{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="grid min-h-60 content-center justify-items-start gap-3 rounded-lg border border-slate-200 bg-white p-7 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <strong className="text-slate-950">{title}</strong>
      <p className="max-w-md leading-6 text-slate-500">{description}</p>
      {action}
    </div>
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
