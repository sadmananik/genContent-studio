import { useEffect, useState } from "react";

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

const fontSizes = ["14px", "16px", "18px", "22px", "28px"];

export default function EditorToolbar({ editor, disabled = false }) {
  const [textColor, setTextColor] = useState("#334155");

  useEffect(() => {
    if (!editor) return;
    const updateColor = () => {
      const color = editor.getAttributes("textStyle").color || "#334155";
      const rgb = color.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      const hex = rgb
        ? `#${rgb
            .slice(1, 4)
            .map((value) => Number(value).toString(16).padStart(2, "0"))
            .join("")}`
        : /^#[0-9a-f]{3}$/i.test(color)
          ? `#${color
              .slice(1)
              .split("")
              .map((value) => value + value)
              .join("")}`
          : color;
      setTextColor(/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#334155");
    };
    updateColor();
    editor.on("selectionUpdate", updateColor);
    editor.on("update", updateColor);
    return () => {
      editor.off("selectionUpdate", updateColor);
      editor.off("update", updateColor);
    };
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
      {toolbarItems.map((tool) => {
        const isActive = editor && !disabled ? tool.isActive(editor) : false;

        return (
          <button
            className={`min-h-9 rounded-md border px-3 text-sm font-bold ${
              isActive
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            disabled={!editor || disabled}
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
        disabled={!editor || disabled}
        onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
        value={editor?.getAttributes("textStyle").fontSize || "16px"}
      >
        {fontSizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <label className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
        Color
        <input
          aria-label="Text color"
          className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
          disabled={!editor || disabled}
          onChange={(event) => {
            setTextColor(event.target.value);
            editor.chain().focus().setColor(event.target.value).run();
          }}
          type="color"
          value={textColor}
        />
      </label>
      <button
        className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        disabled={!editor || disabled}
        onClick={() => editor.chain().focus().unsetColor().unsetFontSize().run()}
        type="button"
      >
        Clear Style
      </button>
    </div>
  );
}
