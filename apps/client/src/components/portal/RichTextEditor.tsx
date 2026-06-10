"use client";

import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("./RichTextEditorClient"), {
  ssr: false,
});

export default RichTextEditor;
