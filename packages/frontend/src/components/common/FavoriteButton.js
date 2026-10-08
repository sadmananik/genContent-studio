import { Star } from "lucide-react";

export default function FavoriteButton({ title, isFavorite = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      aria-label={`${isFavorite ? "Remove" : "Add"} ${title} ${isFavorite ? "from" : "to"} favorites`}
      aria-pressed={isFavorite}
      disabled={disabled}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-violet-200 bg-white text-violet-600 transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      <Star aria-hidden="true" size={18} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
