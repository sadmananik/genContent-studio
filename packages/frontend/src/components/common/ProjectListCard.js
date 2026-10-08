import ContentCard from "./ContentCard";
import TemplateCover from "../templates/TemplateCover";
import Button from "./Button";
import { IconBadge } from "./Cards";

export default function ProjectListCard({
  actions,
  favoriteControl,
  active = false,
  children,
  cover,
  icon,
  layout = "list",
  onOpen,
  title,
  tone
}) {
  function handleKeyDown(event) {
    if (
      event.target !== event.currentTarget ||
      !onOpen ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    onOpen();
  }

  if (layout === "card") {
    return (
      <ContentCard
        active={active}
        cover={<TemplateCover template={cover || { title }} itemLabel="project" />}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        role={onOpen ? "link" : undefined}
        tabIndex={onOpen ? 0 : undefined}
      >
        <div className="flex min-w-0 items-start gap-3">
          <IconBadge tone={tone}>{icon}</IconBadge>
          <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-bold text-slate-950">
            {title}
          </h3>
          {favoriteControl}
        </div>
        <div className="mt-3 min-h-16 min-w-0 overflow-hidden text-sm leading-6">{children}</div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.();
            }}
          >
            Open Project
          </Button>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </ContentCard>
    );
  }

  return (
    <article
      className={`group relative ${layout === "card" ? "flex h-72 min-w-0 flex-col gap-3 p-5" : "grid gap-4 p-4 md:grid-cols-[2.75rem_minmax(0,1fr)_auto] md:items-center"} rounded-lg border bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/70 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)] focus:bg-violet-50/70 focus:outline-none focus:ring-4 focus:ring-violet-100 ${
        onOpen ? "cursor-pointer" : ""
      } ${active ? "z-30 border-violet-300 bg-violet-50/70" : "z-0 border-slate-200"}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role={onOpen ? "link" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <IconBadge tone={tone}>{icon}</IconBadge>
      <div className={layout === "card" ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-w-0"}>
        <div className="flex min-w-0 items-center">
          <strong
            className={`${layout === "card" ? "line-clamp-2 min-h-12 text-base" : "block truncate text-sm"} min-w-0 font-bold text-slate-950 group-hover:text-violet-700`}
          >
            {title}
          </strong>
        </div>
        {children}
      </div>
      {actions && (
        <div
          className={`${layout === "card" ? "mt-auto border-t border-slate-100 pt-3" : ""} flex flex-wrap items-center justify-end gap-2 md:flex-nowrap`}
        >
          {actions}
        </div>
      )}
    </article>
  );
}
