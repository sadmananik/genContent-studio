import { ChevronLeft, ChevronRight, Star, Trash2 } from "lucide-react";
import StatusText from "../common/StatusText";
import EmptyAIHistory from "./EmptyAIHistory";
import { AI_HISTORY_TEXT } from "../../constants/notifications";

export default function AIHistorySidebar({
  history,
  error,
  isCollapsed,
  isLoading,
  onDeleteHistory,
  onToggleFavourite,
  onSelectHistory,
  onToggleCollapsed,
  selectedHistoryId
}) {
  return (
    <aside
      className={`ai-history-sidebar border-r border-slate-200 bg-white transition-all ${
        isCollapsed ? "lg:w-16" : "lg:w-72"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
        {!isCollapsed && <h2 className="text-sm font-bold text-slate-950">AI Prompt History</h2>}
        <button
          aria-label={isCollapsed ? "Expand AI history" : "Collapse AI history"}
          className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          onClick={onToggleCollapsed}
          type="button"
        >
          {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid gap-2 p-3">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {AI_HISTORY_TEXT.LOADING}
            </div>
          ) : error ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : history.length === 0 ? (
            <EmptyAIHistory />
          ) : (
            history.map((item) => (
              <div
                className={`group rounded-lg border p-3 text-left transition ${
                  selectedHistoryId === item.id
                    ? "border-violet-300 bg-violet-50"
                    : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
                }`}
                key={item.id}
              >
                <div className="flex items-start gap-2">
                  <button
                    aria-label={
                      item.favourite ? `Unfavourite ${item.prompt}` : `Favourite ${item.prompt}`
                    }
                    aria-pressed={item.favourite}
                    className={`group/favourite grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                      item.favourite
                        ? "bg-amber-50 text-amber-500"
                        : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                    }`}
                    onClick={() => onToggleFavourite?.(item.id)}
                    type="button"
                  >
                    <Star
                      aria-hidden="true"
                      className={
                        item.favourite ? "fill-amber-400" : "group-hover/favourite:fill-amber-400"
                      }
                      size={16}
                    />
                  </button>
                  <button
                    className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                    onClick={() => onSelectHistory(item.id)}
                    type="button"
                  >
                    <span className="line-clamp-2 block break-words text-sm font-bold text-slate-800 transition group-hover:text-violet-700 group-hover:underline group-hover:decoration-violet-300 group-hover:underline-offset-4">
                      {item.prompt}
                    </span>
                    <StatusText className="transition group-hover:text-slate-600">
                      {item.timestamp}
                    </StatusText>
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  {onDeleteHistory && (
                    <button
                      aria-label={`Delete ${item.prompt}`}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-transparent px-2 text-xs font-bold text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                      onClick={() => onDeleteHistory(item.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
