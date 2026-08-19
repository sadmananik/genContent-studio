import { Loader2, Sparkles } from "lucide-react";
import Button from "../common/Button";

export default function AIPromptPanel({
  actions,
  isGenerating,
  onGenerate,
  onPromptChange,
  onQuickAction,
  prompt
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles aria-hidden="true" className="text-violet-600" size={18} />
        <h2 className="text-base font-bold text-slate-950">Ask AI to create or improve content</h2>
      </div>

      <textarea
        className="min-h-32 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        maxLength={1200}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Write a blog introduction about AI tools for small businesses..."
        value={prompt}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              className="min-h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-white"
              key={action}
              onClick={() => onQuickAction(action)}
              type="button"
            >
              {action}
            </button>
          ))}
        </div>
        <Button disabled={isGenerating} onClick={onGenerate} type="button">
          {isGenerating && <Loader2 aria-hidden="true" className="animate-spin" size={16} />}
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>
    </section>
  );
}
