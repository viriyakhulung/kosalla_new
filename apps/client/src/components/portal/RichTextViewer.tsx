"use client";

import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Image } from "@tiptap/extension-image";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";

type Props = {
  html: string;
  className?: string;
};

export default function RichTextViewer({ html, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: html || "<p></p>",
    editable: false, // ✅ kunci read-only (tidak bisa edit)
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          className ??
          "h-[660px] overflow-y-auto w-full bg-white p-4 text-sm outline-none focus:outline-none border-t border-gray-200",
      },
    },
  });

  // sync kalau html berubah setelah fetch ticket
  useEffect(() => {
    if (!editor) return;
    const incoming = html || "<p></p>";
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming);
    }
  }, [html, editor]);

  if (!editor) {
    return (
      <div className="rounded border bg-white p-3 text-sm text-slate-500">
        Loading viewer...
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-300 rounded overflow-hidden bg-white">
      {/* ❌ tidak ada toolbar */}
      <EditorContent editor={editor} />
    </div>
  );
}

