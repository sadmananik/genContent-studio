import { QUICK_REACTIONS } from "../../constants/quickReactions";

export default function QuickReactionPopover({ onSelect }) {
  return (
    <div className="absolute right-0 z-30 mt-2 grid w-56 max-w-[calc(100vw-2rem)] gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
      <p className="px-2 py-1 text-xs font-bold uppercase text-slate-500">Quick reactions</p>
      {QUICK_REACTIONS.map((reaction) => (
        <button
          className="flex min-h-9 items-center gap-2 rounded-md px-2 text-left text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700"
          key={reaction.id}
          onClick={() => onSelect(reaction.id)}
          type="button"
        >
          <span aria-hidden="true" className="text-lg">
            {reaction.emoji}
          </span>
          {reaction.label}
        </button>
      ))}
    </div>
  );
}
