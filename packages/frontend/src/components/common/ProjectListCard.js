import { IconBadge } from "./Cards";

export default function ProjectListCard({
  actions,
  active = false,
  children,
  icon,
  onOpen,
  title,
  tone
}) {
  function handleKeyDown(event) {
    if (!onOpen || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    onOpen();
  }

  return (
    <article
      className={`group relative grid gap-4 rounded-lg border bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/70 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)] focus:bg-violet-50/70 focus:outline-none focus:ring-4 focus:ring-violet-100 md:grid-cols-[2.75rem_minmax(0,1fr)_auto] md:items-center ${
        onOpen ? "cursor-pointer" : ""
      } ${active ? "z-30 border-violet-300 bg-violet-50/70" : "z-0 border-slate-200"}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role={onOpen ? "link" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <IconBadge tone={tone}>{icon}</IconBadge>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center">
          <strong className="block min-w-0 truncate text-sm font-bold text-slate-950 group-hover:text-violet-700">
            {title}
          </strong>
        </div>
        {children}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap">
          {actions}
        </div>
      )}
    </article>
  );
}
