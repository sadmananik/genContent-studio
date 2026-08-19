"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { useEffect } from "react";

export default function TipTapEditor({
  editorKey,
  initialContent,
  onContentChange,
  onEditorReady
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      Placeholder.configure({
        placeholder: "Start writing your content here..."
      })
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[32rem] max-w-none p-5 text-base leading-8 text-slate-700 outline-none md:p-7 prose prose-slate"
      }
    },
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      onContentChange({
        html: updatedEditor.getHTML(),
        text: updatedEditor.getText()
      });
    }
  });

  useEffect(() => {
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && editorKey) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, editorKey, initialContent]);

  return (
    <div className="bg-white [&_.ProseMirror:empty:before]:pointer-events-none [&_.ProseMirror:empty:before]:float-left [&_.ProseMirror:empty:before]:h-0 [&_.ProseMirror:empty:before]:text-slate-400 [&_.ProseMirror:empty:before]:content-[attr(data-placeholder)] [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6">
      <EditorContent editor={editor} />
    </div>
  );
}
