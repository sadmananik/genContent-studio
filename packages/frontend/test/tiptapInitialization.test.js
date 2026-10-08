import { render } from "@testing-library/react";
import * as Y from "yjs";
import TipTapEditor from "../src/components/text-workspace/TipTapEditor";

let mockOptions;
jest.mock("@tiptap/react", () => ({
  EditorContent: () => null,
  useEditor: (options) => {
    mockOptions = options;
    return null;
  }
}));

test("collaboration hydration is reported as initialization, not a user edit", () => {
  const onContentChange = jest.fn();
  const doc = new Y.Doc();
  render(
    <TipTapEditor
      initialContent="<p>Saved project</p>"
      collaborationProvider={{ doc }}
      onContentChange={onContentChange}
      onEditorReady={jest.fn()}
    />
  );
  const editor = {
    commands: { setContent: jest.fn() },
    getHTML: () => "<p>Saved project</p>",
    getText: () => "Saved project",
    schema: {}
  };
  mockOptions.onUpdate({ editor });
  expect(onContentChange).not.toHaveBeenCalled();
  mockOptions.onCreate({ editor });
  expect(onContentChange).toHaveBeenCalledWith(
    { html: "<p>Saved project</p>", text: "Saved project" },
    editor.schema,
    { isInitialization: true }
  );
  doc.destroy();
});

test("normal editor updates still report content changes", () => {
  const onContentChange = jest.fn();
  render(
    <TipTapEditor
      initialContent="<p>Saved project</p>"
      onContentChange={onContentChange}
      onEditorReady={jest.fn()}
    />
  );
  const editor = {
    getHTML: () => "<p>Edited project</p>",
    getText: () => "Edited project",
    schema: {}
  };
  mockOptions.onUpdate({ editor });
  expect(onContentChange).toHaveBeenCalledWith(
    { html: "<p>Edited project</p>", text: "Edited project" },
    editor.schema
  );
});
