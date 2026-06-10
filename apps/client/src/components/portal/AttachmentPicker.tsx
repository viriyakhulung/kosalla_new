"use client";

import React, { useRef } from "react";

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function AttachmentPicker({
  files,
  setFiles,
  error,
  setError,
}: {
  files: File[];
  setFiles: (files: File[]) => void;
  error: string;
  setError: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateAndAdd = (incoming: File[]) => {
    setError("");

    const next = [...files];

    for (const f of incoming) {
      if (next.length >= MAX_FILES) {
        setError(`Maksimal ${MAX_FILES} file.`);
        break;
      }
      if (f.size > MAX_SIZE) {
        setError(`File "${f.name}" lebih dari 10MB.`);
        continue;
      }
      next.push(f);
    }

    setFiles(next);

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {/* <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => validateAndAdd(Array.from(e.target.files ?? []))}
        className="block w-full text-sm"
      /> */}
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => validateAndAdd(Array.from(e.target.files ?? []))}
        className="hidden"
      />


      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm hover:shadow inline-flex items-center gap-2"
      >
        <span>📎</span>
        Choose Files to Attach
      </button>

      <div className="text-xs text-slate-600">
        Max <b>{MAX_FILES}</b> files, max <b>10MB</b> per file. File type bebas.
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {files.length > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-3 py-2 text-sm font-semibold">
            Attachments ({files.length}/{MAX_FILES})
          </div>
          <ul className="divide-y">
            {files.map((f, idx) => (
              <li key={`${f.name}-${idx}`} className="flex items-center justify-between px-3 py-2">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{f.name}</div>
                  <div className="text-xs text-slate-500">
                    {(f.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                  onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
