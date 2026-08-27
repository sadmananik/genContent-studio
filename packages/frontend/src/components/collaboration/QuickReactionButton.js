import { Smile } from "lucide-react";
import QuickReactionPopover from "./QuickReactionPopover";

export default function QuickReactionButton({ disabled, isOpen, onSelect, onToggle }) {
  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-label="Send quick reaction"
        className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        <Smile aria-hidden="true" size={18} />
      </button>
      {isOpen && <QuickReactionPopover onSelect={onSelect} />}
    </div>
  );
}
