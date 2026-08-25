import { Loader2, Sparkles } from "lucide-react";
import Button from "../common/Button";

export default function AIPromptPanel({
  actions,
  error,
  isGenerating,
  onGenerate,
  onPromptFocus,
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
        disabled={isGenerating}
        maxLength={1200}
        onChange={(event) => onPromptChange(event.target.value)}
        onFocus={onPromptFocus}
        placeholder="Write a blog introduction about AI tools for small businesses..."
        value={prompt}
      />

      {error ? (
        <p
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              className="min-h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating}
              key={action}
              onClick={() => onQuickAction(action)}
              type="button"
            >
              {action}
            </button>
          ))}
        </div>
        <Button
          disabled={isGenerating || !String(prompt || "").trim()}
          onClick={() => onGenerate()}
          type="button"
        >
          {isGenerating && <Loader2 aria-hidden="true" className="animate-spin" size={16} />}
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>
    </section>
  );
}
