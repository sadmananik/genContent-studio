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

const colorOptions = [
  { label: "Slate", value: "#334155" },
  { label: "Violet", value: "#6d28d9" },
  { label: "Emerald", value: "#047857" },
  { label: "Rose", value: "#be123c" }
];

const fontSizes = ["14px", "16px", "18px", "22px", "28px"];

export default function EditorToolbar({ editor }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
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
      <span className="mx-1 h-8 w-px bg-slate-200" />
      <select
        className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
        disabled={!editor}
        onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
        value={editor?.getAttributes("textStyle").fontSize || "16px"}
      >
        {fontSizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-1">
        {colorOptions.map((color) => (
          <button
            aria-label={`Set text color to ${color.label}`}
            className={`h-9 w-9 rounded-md border ${
              editor?.isActive("textStyle", { color: color.value })
                ? "border-violet-500 ring-2 ring-violet-100"
                : "border-slate-200"
            }`}
            disabled={!editor}
            key={color.value}
            onClick={() => editor.chain().focus().setColor(color.value).run()}
            style={{ backgroundColor: color.value }}
            type="button"
          />
        ))}
      </div>
      <button
        className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        disabled={!editor}
        onClick={() => editor.chain().focus().unsetColor().unsetFontSize().run()}
        type="button"
      >
        Clear Style
      </button>
    </div>
  );
}
