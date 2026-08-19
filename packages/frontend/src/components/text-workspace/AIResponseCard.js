import { Copy, MoreHorizontal, Star, TextCursorInput } from "lucide-react";
import Button from "../common/Button";

export default function AIResponseCard({ response }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Prompt</p>
          <h3 className="mt-1 text-sm font-bold text-slate-950">{response.prompt}</h3>
        </div>
        <span className="text-xs text-slate-500">{response.timestamp}</span>
      </div>

      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase text-slate-500">AI Response</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{response.response}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" type="button">
          <Star
            aria-hidden="true"
            className={response.favourite ? "fill-amber-400 text-amber-500" : ""}
            size={16}
          />
          Favourite
        </Button>
        <Button variant="secondary" type="button">
          <Copy aria-hidden="true" size={16} />
          Copy
        </Button>
        <Button variant="secondary" type="button">
          <TextCursorInput aria-hidden="true" size={16} />
          Insert into Editor
        </Button>
        <Button aria-label="More response options" variant="icon" type="button">
          <MoreHorizontal aria-hidden="true" size={17} />
        </Button>
      </div>
    </article>
  );
}
