const toolbarItems = [
  {
    label: "Bold",
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run()
  },
  {
    label: "Italic",
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run()
  },
  {
    label: "H1",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    label: "H2",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    label: "Bullet List",
    isActive: (editor) => editor.isActive("bulletList"),
    run: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    label: "Numbered List",
    isActive: (editor) => editor.isActive("orderedList"),
    run: (editor) => editor.chain().focus().toggleOrderedList().run()
  }
];

export default function EditorToolbar({ editor }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
      {toolbarItems.map((tool) => {
        const isActive = editor ? tool.isActive(editor) : false;

        return (
          <button
            className={`min-h-9 rounded-md border px-3 text-sm font-bold ${
              isActive
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            disabled={!editor}
            key={tool.label}
            onClick={() => tool.run(editor)}
            type="button"
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
