import { FileText, Image as ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";

export default function TemplateCover({ template, itemLabel = "template" }) {
  const isImage = template.projectType === "image";
  const imageSrc = isImage ? findImageSource(template.starterContent) : null;
  const excerpt = getTextExcerpt(template.starterContent);

  return (
    <div
      className={`relative isolate aspect-[16/7] overflow-hidden border-b border-slate-200 ${
        isImage
          ? "bg-gradient-to-br from-violet-100 via-indigo-50 to-sky-100"
          : "bg-gradient-to-br from-emerald-50 via-white to-violet-100"
      }`}
    >
      {imageSrc ? (
        <Image
          alt={`${template.title} preview`}
          className="object-cover"
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          src={imageSrc}
          unoptimized
        />
      ) : isImage ? (
        <ImageCoverArt />
      ) : (
        <TextCoverArt excerpt={excerpt} />
      )}

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">
        {isImage ? (
          <ImageIcon aria-hidden="true" size={13} />
        ) : (
          <FileText aria-hidden="true" size={13} />
        )}
        {`${isImage ? "Image" : "Text"} ${itemLabel}`}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 to-transparent px-4 pb-3 pt-10">
        <p className="truncate text-sm font-bold text-white">{template.category || "Creative"}</p>
      </div>
    </div>
  );
}

function ImageCoverArt() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-violet-300/50 blur-2xl" />
      <div className="absolute -bottom-20 left-10 h-40 w-56 rotate-[-12deg] rounded-[2rem] bg-gradient-to-br from-violet-500/80 to-blue-400/70 shadow-xl" />
      <div className="absolute left-[28%] top-[20%] grid h-24 w-32 rotate-[-5deg] place-items-center rounded-2xl border border-white/80 bg-white/85 shadow-xl">
        <ImageIcon className="text-violet-600" size={42} strokeWidth={1.6} />
      </div>
      <Sparkles className="absolute right-[24%] top-[22%] text-violet-600" size={25} />
      <span className="absolute right-[18%] top-[57%] h-3 w-3 rounded-full bg-sky-400" />
      <span className="absolute left-[19%] top-[27%] h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
    </div>
  );
}

function TextCoverArt({ excerpt }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden px-[13%] pt-5">
      <div className="mx-auto h-[170%] max-w-md -rotate-2 rounded-t-xl border border-slate-200 bg-white p-5 shadow-lg">
        <span className="block h-2 w-12 rounded-full bg-violet-500/80" />
        <span className="mt-3 block h-3 w-3/4 rounded bg-slate-800/80" />
        <span className="mt-2 block h-2 w-1/2 rounded bg-slate-300" />
        <p className="mt-4 line-clamp-3 text-left text-xs leading-5 text-slate-500">{excerpt}</p>
        <span className="mt-3 block h-2 w-full rounded bg-slate-100" />
        <span className="mt-2 block h-2 w-5/6 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function findImageSource(starterContent) {
  const objects = Array.isArray(starterContent?.objects) ? starterContent.objects : [];
  const imageObject = objects.find(
    (object) => String(object.type).toLowerCase() === "image" && isSafeImageSource(object.src)
  );
  return imageObject?.src || null;
}

function isSafeImageSource(value) {
  return (
    typeof value === "string" &&
    (/^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value))
  );
}

function getTextExcerpt(starterContent) {
  const text = typeof starterContent === "string" ? starterContent : "Start with a clear idea.";
  const excerpt = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return excerpt || "A reusable starting point for your next project.";
}
