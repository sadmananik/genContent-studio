import { ChevronLeft, ChevronRight, Star, Trash2 } from "lucide-react";
import EmptyAIHistory from "./EmptyAIHistory";

export default function AIHistorySidebar({
  history,
  isCollapsed,
  onDeleteHistory,
  onToggleFavourite,
  onSelectHistory,
  onToggleCollapsed,
  selectedHistoryId
}) {
  return (
    <aside
      className={`border-r border-slate-200 bg-white transition-all ${
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
          {history.length === 0 ? (
            <EmptyAIHistory />
          ) : (
            history.map((item) => (
              <div
                className={`rounded-lg border p-3 text-left transition ${
                  selectedHistoryId === item.id
                    ? "border-violet-300 bg-violet-50"
                    : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
                key={item.id}
              >
                <button
                  className="block w-full text-left"
                  onClick={() => onSelectHistory(item.id)}
                  type="button"
                >
                  <span className="flex items-start gap-2 text-sm font-bold text-slate-800">
                    <button
                      aria-label={
                        item.favourite ? `Unfavourite ${item.prompt}` : `Favourite ${item.prompt}`
                      }
                      aria-pressed={item.favourite}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                        item.favourite
                          ? "bg-amber-50 text-amber-500"
                          : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavourite?.(item.id);
                      }}
                      type="button"
                    >
                      <Star
                        aria-hidden="true"
                        className={item.favourite ? "fill-amber-400" : ""}
                        size={16}
                      />
                    </button>
                    <span>{item.prompt}</span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{item.timestamp}</span>
                </button>
                {onDeleteHistory && (
                  <button
                    aria-label={`Delete ${item.prompt}`}
                    className="mt-2 inline-flex h-8 items-center gap-2 rounded-md border border-transparent px-2 text-xs font-bold text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDeleteHistory(item.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
