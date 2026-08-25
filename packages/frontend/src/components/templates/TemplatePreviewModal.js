import { FileText, Image as ImageIcon, Tag, UserRound } from "lucide-react";
import AppModal from "../common/AppModal";
import Button from "../common/Button";
import { TEMPLATE_TEXT } from "../../constants/templates";

export default function TemplatePreviewModal({ isUsing, onClose, onUse, template }) {
  if (!template) return null;

  const isImage = template.projectType === "image";
  const starterContent = getContentPreview(template.starterContent);

  return (
    <AppModal description={template.description} onClose={onClose} title={template.title}>
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 font-bold text-violet-700">
            {isImage ? <ImageIcon size={15} /> : <FileText size={15} />}
            {template.category} • {isImage ? "Image" : "Text"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound aria-hidden="true" size={15} />
            {template.creator?.name || "Creator"}
          </span>
          <span>{TEMPLATE_TEXT.usedCount(template.useCount || 0)}</span>
        </div>

        {template.tags?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag aria-hidden="true" className="text-slate-400" size={16} />
            {template.tags.map((tag) => (
              <span
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {template.starterPrompt && (
          <PreviewSection title="Starter Prompt">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {template.starterPrompt}
            </p>
          </PreviewSection>
        )}

        {starterContent && (
          <PreviewSection title="Starter Content">
            <p className="max-h-44 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {starterContent}
            </p>
          </PreviewSection>
        )}

        {(template.tone || template.style) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {template.tone && <Detail label="Tone" value={template.tone} />}
            {template.style && <Detail label="Style" value={template.style} />}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button disabled={isUsing} onClick={onClose} type="button" variant="secondary">
            Close
          </Button>
          <Button disabled={isUsing} onClick={() => onUse(template)} type="button">
            {isUsing ? TEMPLATE_TEXT.USING_ACTION : TEMPLATE_TEXT.USE_ACTION}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}

function PreviewSection({ children, title }) {
  return (
    <section>
      <h4 className="mb-2 text-sm font-bold text-slate-950">{title}</h4>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">{children}</div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function getContentPreview(content) {
  if (typeof content === "string") {
    return content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return "";
}
