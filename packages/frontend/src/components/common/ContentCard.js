export const CONTENT_CARD_GRID =
  "grid min-w-0 items-stretch gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,24rem),24rem))]";

export default function ContentCard({ cover, children, active = false, ...props }) {
  return (
    <article
      {...props}
      className={`group relative flex h-full w-full min-w-0 flex-col rounded-lg border bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_16px_30px_rgba(101,69,246,0.12)] focus:outline-none focus:ring-4 focus:ring-violet-100 ${props.onClick ? "cursor-pointer" : ""} ${active ? "z-30 border-violet-300" : "z-0 border-slate-200"}`}
    >
      <div className="shrink-0 overflow-hidden rounded-t-lg">{cover}</div>
      <div className="flex min-h-0 flex-1 flex-col p-5">{children}</div>
    </article>
  );
}
