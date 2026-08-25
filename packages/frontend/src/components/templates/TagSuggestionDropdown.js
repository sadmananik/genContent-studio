"use client";

export default function TagSuggestionDropdown({ label, onSelect, suggestions }) {
  if (!suggestions.length) return null;

  return (
    <span className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg">
      <span className="block px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400">
        {label}
      </span>
      {suggestions.map((tag) => (
        <button
          className="block w-full px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          key={tag}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(tag)}
          type="button"
        >
          {tag}
        </button>
      ))}
    </span>
  );
}
