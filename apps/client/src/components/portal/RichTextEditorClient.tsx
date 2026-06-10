// apps/client/src/components/portal/RichTextEditorClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Node, mergeAttributes, CommandProps } from "@tiptap/core";

import { Image } from "@tiptap/extension-image";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";

import { OrderedList } from "@tiptap/extension-ordered-list";
import { BulletList } from "@tiptap/extension-bullet-list";
import { ListItem } from "@tiptap/extension-list-item";

// ✅ Table extensions (Turbopack ESM-safe: no default import)
import * as TableExt from "@tiptap/extension-table";
import * as TableRowExt from "@tiptap/extension-table-row";
import * as TableHeaderExt from "@tiptap/extension-table-header";
import * as TableCellExt from "@tiptap/extension-table-cell";

// pick named export if exists, fallback if package uses default
const Table: any = (TableExt as any).Table ?? (TableExt as any).default;
const TableRow: any = (TableRowExt as any).TableRow ?? (TableRowExt as any).default;
const TableHeader: any = (TableHeaderExt as any).TableHeader ?? (TableHeaderExt as any).default;
const TableCell: any = (TableCellExt as any).TableCell ?? (TableCellExt as any).default;

type Props = {
  value: string;
  onChange: (html: string) => void;
};

// ============================
// ✅ Image auto-compress helpers (NO URL, stays base64)
// ============================
const IMAGE_MAX_W = 1280;
const IMAGE_MAX_H = 1280;
const IMAGE_TARGET_BYTES = 220 * 1024; // ~220KB per image (binary). Base64 will be bigger.

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // @ts-ignore
    if (typeof createImageBitmap === "function") {
      // @ts-ignore
      return await createImageBitmap(file);
    }
  } catch {
    // ignore
  }

  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement("img");
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Failed to load image"));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function isWebpSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    const d = c.toDataURL("image/webp");
    return d.startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mime,
      quality
    );
  });
}

type CompressOptions = {
  maxW: number;
  maxH: number;
  targetBytes: number;
  startQuality: number;
  minQuality: number;
};

async function compressImageFile(
  file: File,
  opt: CompressOptions
): Promise<{ dataUrl: string; outBlob: Blob; mime: string; before: number; after: number }> {
  const before = file.size;

  const src = await loadBitmap(file);

  const isBitmap = typeof ImageBitmap !== "undefined" && src instanceof ImageBitmap;

  const srcW = isBitmap
    ? (src as ImageBitmap).width
    : (src as HTMLImageElement).naturalWidth || (src as any).width;

  const srcH = isBitmap
    ? (src as ImageBitmap).height
    : (src as HTMLImageElement).naturalHeight || (src as any).height;

  const scale0 = Math.min(1, opt.maxW / srcW, opt.maxH / srcH);
  let scale = scale0;

  const mime = isWebpSupported() ? "image/webp" : "image/jpeg";
  let quality = opt.startQuality;

  for (let attempt = 0; attempt < 12; attempt++) {
    const outW = Math.max(1, Math.round(srcW * scale));
    const outH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas ctx missing");

    ctx.drawImage(src as any, 0, 0, outW, outH);

    const blob = await canvasToBlob(canvas, mime, quality);

    if (blob.size <= opt.targetBytes) {
      const dataUrl = await blobToDataURL(blob);
      return { dataUrl, outBlob: blob, mime, before, after: blob.size };
    }

    if (quality > opt.minQuality) {
      quality = Math.max(opt.minQuality, quality - 0.08);
      continue;
    }

    if (scale > 0.5) {
      scale = scale * 0.9;
      quality = opt.startQuality;
      continue;
    }

    const dataUrl = await blobToDataURL(blob);
    return { dataUrl, outBlob: blob, mime, before, after: blob.size };
  }

  const dataUrl = await blobToDataURL(file);
  return { dataUrl, outBlob: file, mime: file.type || "image/*", before, after: before };
}

// ============================
// ✅ Admonition block (custom node)
// ============================
type AdmonitionType = "note" | "info" | "tip" | "warning" | "danger";

// Tailwind class literal (biar ke-detect tailwind content scan)
const ADMONITION_CLASS: Record<AdmonitionType, string> = {
  note:
    "admonition admonition-note my-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3",
  info:
    "admonition admonition-info my-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3",
  tip:
    "admonition admonition-tip my-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3",
  warning:
    "admonition admonition-warning my-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3",
  danger:
    "admonition admonition-danger my-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3",
};

const Admonition = Node.create({
  name: "admonition",

  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-admonition") || "note",
        renderHTML: (attrs) => ({ "data-admonition": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-admonition]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const t = String((HTMLAttributes as any)?.type || (HTMLAttributes as any)?.["data-admonition"] || "note")
      .toLowerCase() as AdmonitionType;

    const cls = ADMONITION_CLASS[t] ?? ADMONITION_CLASS.note;

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: cls,
      }),
      0,
    ];
  },

 addCommands() {
  return {
    insertAdmonition:
      (type: AdmonitionType) =>
      ({ commands }: CommandProps) => {
        return commands.insertContent({
          type: "admonition",
          attrs: { type },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Tulis catatan di sini..." }],
            },
          ],
        });
      },
  } as any;
},
});

// ✅ TextStyle versi kita: support fontSize supaya dropdown size bener-bener ngaruh
const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      fontSize: {
        default: null,
        parseHTML: (element) => (element as HTMLElement).style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

// ✅ disable auto "1." => ordered list (input rule)
const OrderedListNoInput = OrderedList.extend({
  addInputRules() {
    return [];
  },
}).configure({ keepMarks: true });

const BulletListNoInput = BulletList.extend({
  addInputRules() {
    return [];
  },
}).configure({ keepMarks: true });

// ✅ Lazy loader untuk PM tables (hindari crash saat page load)
let _pmCache: null | {
  TableMap: any;
  CellSelection: any;
} = null;

async function loadPMTables() {
  if (_pmCache) return _pmCache;

  const mod: any = await import("@tiptap/pm/tables");
  const ns: any = mod?.default ?? mod;

  _pmCache = {
    TableMap: ns.TableMap ?? mod.TableMap,
    CellSelection: ns.CellSelection ?? mod.CellSelection,
  };

  return _pmCache;
}

// cari table node & start pos dari selection (tanpa helper findTable)
function findTableFromPos($pos: any) {
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    const role = node?.type?.spec?.tableRole;
    if (role === "table" || node?.type?.name === "table") {
      return { node, start: $pos.start(d) };
    }
  }
  return null;
}

// cari cell pos (tableCell / tableHeader) dari selection
function findCellPosFromPos($pos: any) {
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    const role = node?.type?.spec?.tableRole;
    if (
      role === "cell" ||
      role === "header_cell" ||
      node?.type?.name === "tableCell" ||
      node?.type?.name === "tableHeader"
    ) {
      return $pos.before(d); // position before the cell node
    }
  }
  return null;
}

function Menu({
  label,
  disabled,
  children,
}: {
  label: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className={`px-2 py-1 rounded text-xs border ${
          disabled ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 hover:bg-gray-50"
        }`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
      >
        {label}
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 top-[110%] z-50 min-w-[190px] rounded-md border border-slate-200 bg-white shadow-lg p-1">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // prevent editor losing focus
      onClick={() => !disabled && onClick()}
      className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-slate-50 ${
        disabled ? "text-slate-300 cursor-not-allowed hover:bg-transparent" : "text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditorClient({ value, onChange }: Props) {
  const [fontFamily, setFontFamily] = useState("Courier New");
  const [fontSize, setFontSize] = useState(12);

  const [hint, setHint] = useState("");
  const flashHint = (msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint(""), 2400);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        // (codeBlock tetap aktif via StarterKit)
      }),

      // ✅ Custom admonition
      Admonition,

      ListItem,
      BulletListNoInput,
      OrderedListNoInput,

      Underline,
      TextStyleWithFontSize,
      Color,
      FontFamily,

      Image.configure({
        inline: true,
        allowBase64: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      // ✅ TABLE
      Table?.configure ? Table.configure({ resizable: true }) : Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "h-[660px] overflow-y-auto w-full bg-white p-4 text-sm outline-none focus:outline-none border-t border-gray-200",
      },

      // ✅ Paste image: auto compress BEFORE insert
      handlePaste: (view, event) => {
        const items = (event as ClipboardEvent).clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf("image") === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file && editor) {
              (async () => {
                try {
                  const { dataUrl, before, after, mime } = await compressImageFile(file, {
                    maxW: IMAGE_MAX_W,
                    maxH: IMAGE_MAX_H,
                    targetBytes: IMAGE_TARGET_BYTES,
                    startQuality: 0.82,
                    minQuality: 0.5,
                  });

                  editor.chain().focus().setImage({ src: dataUrl }).run();
                  flashHint(`Image compressed: ${formatBytes(before)} → ${formatBytes(after)} (${mime})`);
                } catch {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const base64 = e.target?.result as string;
                    if (base64 && editor) {
                      editor.chain().focus().setImage({ src: base64 }).run();
                    }
                  };
                  reader.readAsDataURL(file);
                  flashHint("Compression failed, inserted original image.");
                }
              })();
            }
            return true;
          }
        }
        return false;
      },

      // ✅ Drag & drop image: auto compress BEFORE insert
      handleDrop: (view, event) => {
        const e = event as DragEvent;
        const dt = e.dataTransfer;
        const file = dt?.files?.[0];
        if (!file) return false;
        if (!file.type.startsWith("image/")) return false;

        e.preventDefault();
        if (!editor) return true;

        (async () => {
          try {
            const { dataUrl, before, after, mime } = await compressImageFile(file, {
              maxW: IMAGE_MAX_W,
              maxH: IMAGE_MAX_H,
              targetBytes: IMAGE_TARGET_BYTES,
              startQuality: 0.82,
              minQuality: 0.5,
            });

            editor.chain().focus().setImage({ src: dataUrl }).run();
            flashHint(`Image compressed: ${formatBytes(before)} → ${formatBytes(after)} (${mime})`);
          } catch {
            flashHint("Drop image failed to compress.");
          }
        })();

        return true;
      },
    },
  });

  // Sync value from parent
  useEffect(() => {
    if (!editor) return;
    const incoming = value || "<p></p>";
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="rounded border bg-white p-3 text-sm text-slate-500">Loading editor...</div>;
  }

  const ed = editor;
  const inTable = ed.isActive("table");

  // --- One-click merge helper ---
  async function setSelectionToNeighbor(direction: "right" | "down"): Promise<boolean> {
    try {
      const pm = await loadPMTables();
      const TableMap = pm.TableMap;
      const CellSelection = pm.CellSelection;
      if (!TableMap || !CellSelection) return false;

      const view = ed.view;
      const state = view.state;
      const $from = state.selection.$from;

      const table = findTableFromPos($from);
      if (!table) return false;

      const cellPos = findCellPosFromPos($from);
      if (cellPos == null) return false;

      const map = TableMap.get(table.node);
      const tableStart = table.start;

      const rect = map.findCell(cellPos - tableStart);

      const anchorIndex = rect.top * map.width + rect.left;
      const anchorPos = tableStart + map.map[anchorIndex];

      let headIndex: number;

      if (direction === "right") {
        if (rect.right >= map.width) return false;
        headIndex = rect.top * map.width + rect.right;
      } else {
        if (rect.bottom >= map.height) return false;
        headIndex = rect.bottom * map.width + rect.left;
      }

      const headPos = tableStart + map.map[headIndex];

      const sel = new CellSelection(state.doc.resolve(anchorPos), state.doc.resolve(headPos));
      view.dispatch(state.tr.setSelection(sel));
      return true;
    } catch {
      return false;
    }
  }

  async function mergeRightOneClick() {
    ed.chain().focus().run();
    if (!inTable) return flashHint("Klik di dalam tabel dulu.");

    const ok = await setSelectionToNeighbor("right");
    if (!ok) return flashHint("Tidak bisa merge ke kanan (kolom terakhir / cell sudah merge).");

    const merged = ed.commands.mergeCells();
    if (!merged) flashHint("Merge gagal. Pastikan cell kanan masih tersedia.");
  }

  async function mergeDownOneClick() {
    ed.chain().focus().run();
    if (!inTable) return flashHint("Klik di dalam tabel dulu.");

    const ok = await setSelectionToNeighbor("down");
    if (!ok) return flashHint("Tidak bisa merge ke bawah (baris terakhir / cell sudah merge).");

    const merged = ed.commands.mergeCells();
    if (!merged) flashHint("Merge gagal. Pastikan cell bawah masih tersedia.");
  }

  // can() checks
  const canInsertRowAbove = inTable && ed.can().chain().focus().addRowBefore().run();
  const canInsertRowBelow = inTable && ed.can().chain().focus().addRowAfter().run();
  const canDeleteRow = inTable && ed.can().chain().focus().deleteRow().run();

  const canInsertColLeft = inTable && ed.can().chain().focus().addColumnBefore().run();
  const canInsertColRight = inTable && ed.can().chain().focus().addColumnAfter().run();
  const canDeleteCol = inTable && ed.can().chain().focus().deleteColumn().run();

  const canMerge = inTable && ed.can().chain().focus().mergeCells().run();
  const canSplit = inTable && ed.can().chain().focus().splitCell().run();

  // best-effort enable
  const canMergeRight = inTable;
  const canMergeDown = inTable;

  const btnBase = "px-2 py-1 rounded text-xs border";
  const btnOk = "border-gray-300 hover:bg-gray-50";
  const btnDis = "border-gray-200 text-gray-400 cursor-not-allowed";

  // ✅ Admonition insert helper
  const insertAdmonition = (type: AdmonitionType) => {
    ed.chain().focus().command(({ editor }) => {
      // @ts-ignore (command typed in extension)
      return editor.commands.insertAdmonition(type);
    }).run();
  };

  return (
    <div className="w-full border border-gray-300 rounded overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
        {/* Undo/Redo */}
        <button
          type="button"
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={() => ed.chain().focus().undo().run()}
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={() => ed.chain().focus().redo().run()}
          title="Redo"
        >
          ↷
        </button>

        <div className="w-px h-6 bg-gray-300" />

        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => {
            const v = e.target.value;
            setFontFamily(v);
            ed.chain().focus().setFontFamily(v).run();
          }}
          className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 cursor-pointer"
        >
          <option value="Courier New">Courier New</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </select>

        <div className="w-px h-6 bg-gray-300" />

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFontSize(v);
            ed.chain().focus().setMark("textStyle", { fontSize: `${v}px` }).run();
          }}
          className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 cursor-pointer w-14"
        >
          {[9, 10, 11, 12, 14, 16, 18, 20, 24, 28].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-300" />

        {/* List Dropdown */}
        <select
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v === "bullet") ed.chain().focus().toggleBulletList().run();
            if (v === "ordered") ed.chain().focus().toggleOrderedList().run();
            e.currentTarget.value = "";
          }}
          className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 cursor-pointer"
        >
          <option value="">≡</option>
          <option value="bullet">Bullet List</option>
          <option value="ordered">Numbered List</option>
        </select>

        <div className="w-px h-6 bg-gray-300" />

        {/* Formatting */}
        <button
          type="button"
          onClick={() => ed.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
            ed.isActive("bold") ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => ed.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-xs italic transition-colors ${
            ed.isActive("italic") ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => ed.chain().focus().toggleUnderline().run()}
          className={`px-2 py-1 rounded text-xs underline transition-colors ${
            ed.isActive("underline") ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
        >
          U
        </button>
        <button
          type="button"
          onClick={() => ed.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-xs line-through transition-colors ${
            ed.isActive("strike") ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
        >
          S
        </button>

        <div className="w-px h-6 bg-gray-300" />

        {/* Color */}
        <input
          type="color"
          onChange={(e) => ed.chain().focus().setColor(e.target.value).run()}
          className="w-6 h-6 rounded cursor-pointer border border-gray-300"
          title="Text Color"
        />

        <div className="w-px h-6 bg-gray-300" />

        {/* Align */}
        <button
          type="button"
          onClick={() => ed.chain().focus().setTextAlign("left").run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            ed.isActive({ textAlign: "left" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
          title="Align Left"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => ed.chain().focus().setTextAlign("center").run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            ed.isActive({ textAlign: "center" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
          title="Align Center"
        >
          ⬇
        </button>
        <button
          type="button"
          onClick={() => ed.chain().focus().setTextAlign("right").run()}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            ed.isActive({ textAlign: "right" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100"
          }`}
          title="Align Right"
        >
          ➡
        </button>

        <div className="w-px h-6 bg-gray-300" />

        {/* TABLE */}
        <button
          type="button"
          className={`${btnBase} ${btnOk}`}
          onClick={() => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table (3x3)"
        >
          ⊞ table
        </button>

        {/* ✅ Row dropdown */}
        <Menu label="Row ▾" disabled={!inTable}>
          <MenuItem disabled={!canInsertRowAbove} onClick={() => ed.chain().focus().addRowBefore().run()}>
            Insert row above
          </MenuItem>
          <MenuItem disabled={!canInsertRowBelow} onClick={() => ed.chain().focus().addRowAfter().run()}>
            Insert row below
          </MenuItem>
          <div className="my-1 h-px bg-slate-100" />
          <MenuItem disabled={!canDeleteRow} onClick={() => ed.chain().focus().deleteRow().run()}>
            Delete row
          </MenuItem>
        </Menu>

        {/* ✅ Column dropdown */}
        <Menu label="Column ▾" disabled={!inTable}>
          <MenuItem disabled={!canInsertColLeft} onClick={() => ed.chain().focus().addColumnBefore().run()}>
            Insert column left
          </MenuItem>
          <MenuItem disabled={!canInsertColRight} onClick={() => ed.chain().focus().addColumnAfter().run()}>
            Insert column right
          </MenuItem>
          <div className="my-1 h-px bg-slate-100" />
          <MenuItem disabled={!canDeleteCol} onClick={() => ed.chain().focus().deleteColumn().run()}>
            Delete column
          </MenuItem>
        </Menu>

        {/* ✅ Merge dropdown */}
        <Menu label="Merge ▾" disabled={!inTable}>
          <MenuItem disabled={!canMerge} onClick={() => ed.chain().focus().mergeCells().run()}>
            Merge selected
          </MenuItem>

          <MenuItem disabled={!canMergeRight} onClick={() => void mergeRightOneClick()}>
            Merge right (→)
          </MenuItem>

          <MenuItem disabled={!canMergeDown} onClick={() => void mergeDownOneClick()}>
            Merge down (↓)
          </MenuItem>

          <div className="my-1 h-px bg-slate-100" />

          <MenuItem disabled={!canSplit} onClick={() => ed.chain().focus().splitCell().run()}>
            Split (unmerge)
          </MenuItem>
        </Menu>

        {/* ✅ NEW: Admonition menu (di samping Delete) */}
        <Menu label="Admonition ▾">
          <MenuItem onClick={() => insertAdmonition("note")}>Note</MenuItem>
          <MenuItem onClick={() => insertAdmonition("info")}>Info</MenuItem>
          <MenuItem onClick={() => insertAdmonition("tip")}>Tip</MenuItem>
          <MenuItem onClick={() => insertAdmonition("warning")}>Warning</MenuItem>
          <MenuItem onClick={() => insertAdmonition("danger")}>Danger</MenuItem>
        </Menu>

        {/* ✅ NEW: Code Block / <pre> (toggle) */}
        <button
          type="button"
          className={`px-2 py-1 rounded text-xs border ${
            ed.isActive("codeBlock") ? "border-slate-400 bg-slate-100" : btnOk
          }`}
          onClick={() => ed.chain().focus().toggleCodeBlock().run()}
          title="Code Block (<pre>)"
        >
          {"</>"} pre
        </button>

        {/* Delete table */}
        <button
          type="button"
          className={`${btnBase} ${inTable ? "border-red-300 text-red-700 hover:bg-red-50" : btnDis}`}
          disabled={!inTable}
          onClick={() => ed.chain().focus().deleteTable().run()}
          title="Delete Table"
        >
          Delete
        </button>
      </div>

      {hint ? <div className="border-b bg-slate-50 px-3 py-2 text-xs text-slate-600">{hint}</div> : null}

      <EditorContent editor={ed} />
    </div>
  );
}