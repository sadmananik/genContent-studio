import { Eye, FileText, Image as ImageIcon, Star } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../lib/styles";
import { TEMPLATE_TEXT } from "../../constants/templates";

export default function TemplateCard({
  actions,
  isFavoritePending = false,
  isUsing = false,
  onFavorite,
  onPreview,
  onUse,
  showFavorite = true,
  showManagementMeta = false,
  template
}) {
  const isImage = template.projectType === "image";

  return (
    <article className="group flex min-h-72 min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)]">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            isImage ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"
          )}
        >
          {isImage ? (
            <ImageIcon aria-hidden="true" size={19} />
          ) : (
            <FileText aria-hidden="true" size={19} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold text-slate-950">{template.title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {template.category} • {isImage ? "Image" : "Text"}
          </p>
        </div>
        {showFavorite && (
          <button
            aria-label={`${template.isFavorite ? "Remove" : "Add"} ${template.title} ${
              template.isFavorite ? "from" : "to"
            } favorites`}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-md border transition focus:outline-none focus:ring-2 focus:ring-amber-200",
              template.isFavorite
                ? "border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100"
                : "border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
            )}
            disabled={isFavoritePending}
            onClick={() => onFavorite?.(template)}
            type="button"
          >
            <Star
              aria-hidden="true"
              fill={template.isFavorite ? "currentColor" : "none"}
              size={18}
            />
          </button>
        )}
      </div>

      <p className="mt-4 line-clamp-3 min-h-18 text-sm leading-6 text-slate-600">
        {template.description || "Reusable project starting point."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(template.tags || []).slice(0, 3).map((tag) => (
          <span
            className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-bold",
              template.visibility === "public"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {template.visibility === "public" ? "Public" : "Hidden"}
          </span>
          <span className="text-slate-500">Published {formatDateTime(template.createdAt)}</span>
          {showManagementMeta && (
            <span className="text-slate-500">Updated {formatDateTime(template.updatedAt)}</span>
          )}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="min-w-0 truncate">By {template.creator?.name || "Creator"}</span>
          <span>{TEMPLATE_TEXT.usedCount(template.useCount || 0)}</span>
        </div>
        {actions || (
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => onPreview?.(template)} type="button" variant="secondary">
              <Eye aria-hidden="true" size={16} />
              {TEMPLATE_TEXT.PREVIEW_ACTION}
            </Button>
            <Button disabled={isUsing} onClick={() => onUse?.(template)} type="button">
              {isUsing ? TEMPLATE_TEXT.USING_ACTION : TEMPLATE_TEXT.USE_ACTION}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function formatDateTime(value) {
  if (!value) return "recently";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}
