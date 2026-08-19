import { FileText } from "lucide-react";

const defaultExportOptions = [
  { label: "Text file", value: "txt" },
  { label: "PDF file", value: "pdf" }
];

export default function WorkspaceExportMenu({ onExport, options = defaultExportOptions }) {
  return (
    <div className="absolute right-0 z-20 mt-2 grid w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
      {options.map((option) => (
        <button
          className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
          key={option.value}
          onClick={() => onExport?.(option.value)}
          type="button"
        >
          <FileText aria-hidden="true" size={17} />
          {option.label}
        </button>
      ))}
    </div>
  );
}
