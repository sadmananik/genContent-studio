import { FileText } from "lucide-react";

export default function WorkspaceExportMenu({ onExport }) {
  return (
    <div className="absolute right-0 z-20 mt-2 grid w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
      <button
        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => onExport?.("txt")}
        type="button"
      >
        <FileText aria-hidden="true" size={17} />
        Text file
      </button>
      <button
        className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => onExport?.("pdf")}
        type="button"
      >
        <FileText aria-hidden="true" size={17} />
        PDF file
      </button>
    </div>
  );
}
