export default function FloatingReaction({ reaction }) {
  return (
    <div className="pointer-events-none animate-[reaction-float_3s_ease-out_forwards] rounded-lg border border-violet-100 bg-white/95 px-3 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="text-xl" aria-hidden="true">
          {reaction.reaction.emoji}
        </span>
        {reaction.reaction.label}
      </div>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">{reaction.sender.name}</p>
    </div>
  );
}
