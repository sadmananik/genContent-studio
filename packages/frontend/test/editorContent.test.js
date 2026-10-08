import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { hasEditorContentChanged } from "../src/components/text-workspace/editorContent";

const schema = getSchema([StarterKit]);

test("opening saved content does not count Tiptap HTML normalization as an edit", () => {
  const persisted = "<div>Hello <b>team</b></div><p><span>Welcome &amp; enjoy.</span></p>";
  const rendered = "<p>Hello <strong>team</strong></p><p>Welcome &amp; enjoy.</p>";
  expect(hasEditorContentChanged(rendered, persisted, schema)).toBe(false);
  expect(hasEditorContentChanged("<p></p>", "", schema)).toBe(false);
});

test("actual text or formatting changes still require saving", () => {
  const persisted = "<p>Hello team</p>";
  expect(hasEditorContentChanged("<p>Hello everyone</p>", persisted, schema)).toBe(true);
  expect(hasEditorContentChanged("<p>Hello <strong>team</strong></p>", persisted, schema)).toBe(
    true
  );
  expect(hasEditorContentChanged("<p></p>", persisted, schema)).toBe(true);
  expect(hasEditorContentChanged(persisted, persisted, schema)).toBe(false);
});

test("saved blank paragraphs and spacing remain unchanged when reopening a draft", () => {
  const persisted = "<p>Saved draft</p><p></p><p>Next paragraph</p><p></p>";
  expect(hasEditorContentChanged(persisted, persisted, schema)).toBe(false);
  expect(
    hasEditorContentChanged("<p>Saved draft</p><p>Next paragraph</p>", persisted, schema)
  ).toBe(true);
});
