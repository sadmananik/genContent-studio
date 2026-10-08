import { DOMParser } from "@tiptap/pm/model";

export function normalizeEditorHtml(value) {
  return String(value || "")
    .replace(/<p>(?:\s|<br\s*\/?>|&nbsp;)*<\/p>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasEditorContentChanged(currentHtml, persistedHtml, schema) {
  if (!schema) {
    return normalizeEditorHtml(currentHtml) !== normalizeEditorHtml(persistedHtml);
  }

  // Compare the documents Tiptap actually renders, rather than HTML serialization.
  const parser = DOMParser.fromSchema(schema);
  const parse = (html) => {
    const container = document.createElement("div");
    container.innerHTML = String(html || "");
    return parser.parse(container);
  };

  return !parse(currentHtml).eq(parse(persistedHtml));
}
