"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  Columns2,
  ClipboardList,
  CalendarDays,
  FileText,
  Paperclip,
  ArrowLeft,
  Send,
  Save,
  Ban,
  Loader2,
} from "lucide-react";
import RichTextEditor from "@/components/portal/RichTextEditor";
import AttachmentPicker from "@/components/portal/AttachmentPicker";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Me = {
  id: number;
  master_role_id?: number | null;
  master_role?: string | null;
  email?: string | null;
  name?: string | null;
};

type InventoryItem = {
  id: number;
  name: string;
};

type TeamLead = {
  id: number;
  name: string;
  email: string;
  team_group_name?: string | null;
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function initials(name?: string | null): string {
  return (
    String(name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 " +
  "placeholder-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30";

/* ─── Sub-components ──────────────────────────────────────────────────── */

function SectionCard({
  icon,
  iconBg,
  iconColor,
  title,
  required,
  subtitle,
  children,
  className,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  required?: boolean;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconBg,
            iconColor
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">
            {title}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SubmittingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="w-[360px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-900">Submitting ticket…</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Please wait. Do not refresh / click Submit again.
        </p>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function CreateTicketPage() {
  const router = useRouter();

  const [checkingRole, setCheckingRole] = useState(true);
  const [roleBlocked, setRoleBlocked] = useState(false);

  // Logged as
  const [meEmail, setMeEmail] = useState<string>("-");
  const [meName, setMeName] = useState<string>("");

  // Minimal fields
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState<number | "">("");
  const [priority, setPriority] = useState("Normal");
  const [requestedDate, setRequestedDate] = useState("");

  // Optional fields
  const [version, setVersion] = useState("");
  const [buildNo, setBuildNo] = useState("");
  const [patchNo, setPatchNo] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [project, setProject] = useState("");
  const [severity, setSeverity] = useState("N/A");
  const [expectedDate, setExpectedDate] = useState("");

  // Description ONLY
  const [descriptionHtml, setDescriptionHtml] = useState("<p></p>");

  // Attachments
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Handler (Team Lead) — diturunkan dari produk terpilih (team PIC master product)
  const [handlerLoading, setHandlerLoading] = useState(false);
  const [resolvedHandler, setResolvedHandler] = useState<TeamLead | null>(null);
  const [handlerTeamName, setHandlerTeamName] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const issueNumber = useMemo(() => "AUTO", []); // backend generate

  // ✅ Guard: viriyastaff (role 2) tidak boleh create ticket
  useEffect(() => {
    let alive = true;

    async function checkRole() {
      try {
        setCheckingRole(true);

        const meRes = await apiFetch<any>("/auth/me");
        const me = (meRes?.user ?? meRes?.data ?? meRes ?? null) as Me | null;

        if (!alive) return;

        setMeEmail(me?.email ?? "-");
        setMeName(me?.name ?? "");

        const roleId = (me?.master_role_id ?? null) as number | null;

        // master_roles: 1 superadmin, 2 viriyastaff, 3 custstaff
        if (roleId === 2) {
          setRoleBlocked(true);
          setTimeout(() => {
            router.replace("/portal/tickets");
          }, 300);
        }
      } catch {
        if (!alive) return;
        setMeEmail("-");
      } finally {
        if (!alive) return;
        setCheckingRole(false);
      }
    }

    checkRole();
    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        const res = await apiFetch<{ data: InventoryItem[] }>("/portal/inventory-items");
        setInventoryItems(res?.data ?? []);
      } catch (e: any) {
        console.error("Gagal load inventory items", e?.message);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // Handler REAKTIF ke Produk: resolve Team Lead dari team PIC produk terpilih.
  // Reset tiap Produk berubah. Produk kosong → tidak fetch.
  useEffect(() => {
    setResolvedHandler(null);
    setHandlerTeamName("");

    if (!inventoryItemId) {
      setHandlerLoading(false);
      return;
    }

    let alive = true;
    async function resolveHandler() {
      try {
        setHandlerLoading(true);
        const res = await apiFetch<{
          data: { team_group_id: number; team_group_name: string; lead: TeamLead | null } | null;
        }>(`/portal/product-team-lead?inventory_item_id=${inventoryItemId}`);
        if (!alive) return;
        const data = res?.data ?? null;
        setHandlerTeamName(data?.team_group_name ?? "");
        setResolvedHandler(data?.lead ?? null);
      } catch (e: any) {
        if (!alive) return;
        console.error("Gagal resolve handler", e?.message);
        setResolvedHandler(null);
        setHandlerTeamName("");
      } finally {
        if (alive) setHandlerLoading(false);
      }
    }
    resolveHandler();
    return () => {
      alive = false;
    };
  }, [inventoryItemId]);

  // ✅ Lock scroll saat submitting (biar halaman benar-benar "terkunci")
  useEffect(() => {
    if (!submitting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [submitting]);

  async function submit(status: "Draft" | "Open") {
    setError("");
    setFileError("");

    if (roleBlocked) return;

    // ✅ anti double submit (kalau user klik 2x / spam klik)
    if (submitting) return;

    if (!subject.trim()) return setError("Subject wajib diisi.");
    if (!category.trim()) return setError("Category wajib diisi.");
    if (!inventoryItemId) return setError("Product wajib dipilih.");

    const stripped = descriptionHtml.replace(/<[^>]*>/g, "").trim();
    if (!stripped) return setError("Description wajib diisi.");

    const selectedProductName = inventoryItems.find((p) => p.id === inventoryItemId)?.name ?? "";

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("status", status);
      fd.append("subject", subject);
      fd.append("category", category);
      if (selectedProductName) fd.append("product_type", selectedProductName);
      fd.append("inventory_item_id", String(inventoryItemId));
      fd.append("priority", priority.toLowerCase());
      fd.append("requested_resolution_date", requestedDate);
      fd.append("expected_date", expectedDate);
      fd.append("version", version);
      fd.append("build_no", buildNo);
      fd.append("patch_no", patchNo);
      fd.append("module", moduleName);
      fd.append("error_code", errorCode);
      fd.append("project", project);
      fd.append("severity", severity);
      if (resolvedHandler) fd.append("assigned_to", String(resolvedHandler.id));
      fd.append("description_html", descriptionHtml);

      files.forEach((f) => fd.append("attachments[]", f));

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Submit gagal (status ${res.status})`);
      }

      // ✅ SENGAJA tidak setSubmitting(false) di sini.
      // Biar overlay tetap tampil sampai user pindah halaman (anti dobel submit).
      router.push("/portal/tickets");
      router.refresh();
      return;
    } catch (e: any) {
      setError(e?.message ?? "Submit gagal");
      setSubmitting(false); // ✅ unlock kalau gagal saja
    }
  }

  if (checkingRole) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" /> Checking access…
      </div>
    );
  }

  if (roleBlocked) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        <div className="flex items-start gap-3">
          <Ban className="mt-0.5 size-4 shrink-0" />
          <span>
            Forbidden: viriyastaff tidak dapat membuat ticket. Mengalihkan ke Ticket History…
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {submitting && <SubmittingOverlay />}

      <div className={cn("mx-auto max-w-5xl pb-24", submitting && "pointer-events-none select-none")}>
        {/* Top toolbar: Template + Back */}
        <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
          <select
            className="h-10 w-[200px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50"
            defaultValue=""
            disabled
            title="Template belum diaktifkan"
          >
            <option value="">— Select Template —</option>
          </select>

          <button
            type="button"
            onClick={() => router.push("/portal/tickets")}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        <div className="space-y-5">
          {/* Knowledge base hint */}
          <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-500" />
            <span>
              Cek <strong>Knowledge Base</strong> dulu — mungkin solusinya sudah tersedia tanpa perlu
              membuat tiket.
            </span>
          </div>

          {/* Error alert */}
          {(error || fileError) && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Ban className="mt-0.5 size-4 shrink-0" />
              <span>{error || fileError}</span>
            </div>
          )}

          {/* SUBJECT */}
          <SectionCard
            icon={<Columns2 className="size-4" />}
            iconBg="bg-teal-100"
            iconColor="text-teal-600"
            title="Subject"
            required
          >
            <input
              className={inputCls}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Masukkan ringkasan singkat dari issue Anda…"
            />
          </SectionCard>

          {/* BASIC + ADDITIONAL */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
            {/* BASIC INFORMATION */}
            <SectionCard
              icon={<ClipboardList className="size-4" />}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
              title="Basic Information"
              required
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Issue Number">
                  <input
                    className={cn(inputCls, "cursor-not-allowed bg-slate-50 text-slate-500")}
                    value={issueNumber}
                    readOnly
                  />
                </Field>

                <Field label="Category" required>
                  <select
                    className={inputCls}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">— Pilih Kategori —</option>
                    <option value="Installation">Installation</option>
                    <option value="General Error">General Error</option>
                    <option value="Performance Issue">Performance Issue</option>
                    <option value="Bug">Bug</option>
                    <option value="Others">Others</option>
                  </select>
                </Field>

                <Field label="Product" required>
                  <select
                    className={inputCls}
                    value={inventoryItemId}
                    onChange={(e) =>
                      setInventoryItemId(e.target.value ? Number(e.target.value) : "")
                    }
                    disabled={loadingProducts}
                  >
                    <option value="">— Select Product —</option>
                    {inventoryItems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Version">
                  <input
                    className={inputCls}
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Masukkan version"
                  />
                </Field>

                <Field label="Build No">
                  <input
                    className={inputCls}
                    value={buildNo}
                    onChange={(e) => setBuildNo(e.target.value)}
                    placeholder="Masukkan build number"
                  />
                </Field>

                <Field label="Patch No">
                  <input
                    className={inputCls}
                    value={patchNo}
                    onChange={(e) => setPatchNo(e.target.value)}
                    placeholder="Masukkan patch number"
                  />
                </Field>

                <Field label="Module">
                  <input
                    className={inputCls}
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="Masukkan module"
                  />
                </Field>

                <Field label="Error Code">
                  <input
                    className={inputCls}
                    value={errorCode}
                    onChange={(e) => setErrorCode(e.target.value)}
                    placeholder="Masukkan error code"
                  />
                </Field>

                <Field label="Priority">
                  <select
                    className={inputCls}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </Field>

                {/* Reporter + Project */}
                <Field label="Reporter">
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                      {initials(meName)}
                    </div>
                    <span className="truncate text-sm font-medium text-slate-800">
                      {meName || "Anda"}
                    </span>
                    <span className="text-xs text-slate-400">· otomatis</span>
                  </div>
                </Field>

                {/* Handler (Team Lead) — otomatis dari team PIC produk terpilih */}
                <Field label="Handler">
                  {!inventoryItemId ? (
                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                      Pilih produk dulu
                    </div>
                  ) : handlerLoading ? (
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
                      <Loader2 className="size-4 animate-spin" /> Menentukan Handler…
                    </div>
                  ) : resolvedHandler ? (
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        {initials(resolvedHandler.name)}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-800">
                        {resolvedHandler.name}
                      </span>
                      {handlerTeamName && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                          {handlerTeamName}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">· otomatis</span>
                    </div>
                  ) : (
                    <div
                      className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400"
                      title="Produk ini belum punya Team Lead PIC untuk organisasi Anda"
                    >
                      Belum ada Team Lead untuk produk ini
                    </div>
                  )}
                </Field>

                <Field label="Project">
                  <input
                    className={inputCls}
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="Masukkan nama project"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ADDITIONAL INFORMATION */}
            <SectionCard
              icon={<CalendarDays className="size-4" />}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              title="Additional Information"
            >
              <div className="space-y-4">
                <Field label="Requested Date for Resolution">
                  <input
                    type="date"
                    className={inputCls}
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                  />
                </Field>

                <Field label="Expected Date (PS)">
                  <input
                    type="date"
                    className={inputCls}
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </Field>

                <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-800">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                  <span>Tanggal target membantu tim memprioritaskan tiket sesuai SLA Anda.</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ISSUE DETAILS */}
          <SectionCard
            icon={<FileText className="size-4" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            title="Issue Details"
            required
            subtitle="Deskripsi lengkap masalah"
          >
            <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} />
          </SectionCard>

          {/* ATTACHMENT */}
          <SectionCard
            icon={<Paperclip className="size-4" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            title="Attachment"
            subtitle="Maks 5 file, 10MB / file"
          >
            <AttachmentPicker
              files={files}
              setFiles={setFiles}
              error={fileError}
              setError={setFileError}
            />
          </SectionCard>
        </div>
      </div>

      {/* Sticky action bar */}
      <div
        className={cn(
          "sticky bottom-0 z-20 -mx-4 mt-5 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
          submitting && "pointer-events-none select-none"
        )}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            <span className="text-red-500">*</span> wajib diisi
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/portal/tickets")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => submit("Draft")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <Save className="size-4" />
              Simpan Draft
            </button>

            <button
              type="button"
              onClick={() => submit("Open")}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="size-4" /> Submit Ticket
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
