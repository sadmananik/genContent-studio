const toolbarItems = ["Bold", "Italic", "H1", "H2", "Bullet List", "Numbered List"];

export default function EditorToolbar({ activeTool, onSelectTool }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
      {toolbarItems.map((tool) => (
        <button
          className={`min-h-9 rounded-md border px-3 text-sm font-bold ${
            activeTool === tool
              ? "border-violet-500 bg-violet-50 text-violet-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          key={tool}
          onClick={() => onSelectTool(tool)}
          type="button"
        >
          {tool}
        </button>
      ))}
    </div>
  );
}
