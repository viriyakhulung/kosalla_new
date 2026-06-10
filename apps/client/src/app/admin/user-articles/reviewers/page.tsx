"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

type Product = { id: number; name: string };
type Organization = { id: number; name: string };

type User = {
  id: number;
  name?: string | null;
  email: string;
  master_role_id?: number | null; // penting untuk filter internal
};

type ReviewerAssignment = {
  id: number;
  organization_id: number | null;
  product_id: number;
  reviewer_user_id: number;

  // optional (kalau backend return relasi)
  organization?: { id: number; name: string } | null;
  product?: { id: number; name: string } | null;
  reviewer?: { id: number; email: string; name?: string | null } | null;
};

type Paginated<T> = {
  data: T[];
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
};

type AdminProductsResponse = Product[] | { data?: Product[] };
type AdminOrgsResponse = Paginated<Organization> | Organization[] | { data?: Organization[] };
type AdminUsersResponse = Paginated<User> | User[] | { data?: User[] };
type ReviewerAssignmentsResponse = ReviewerAssignment[] | { data?: ReviewerAssignment[] };

function parseArray<T>(json: any): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json?.data && Array.isArray(json.data)) return json.data as T[];
  return [];
}

function buildQuery(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default function AdminUserArticleReviewersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // filter state (opsional)
  const [scopeFilter, setScopeFilter] = useState<string>(searchParams.get("scope") || "");
  const [productFilter, setProductFilter] = useState<string>(searchParams.get("product_id") || "");
  const [orgFilter, setOrgFilter] = useState<string>(searchParams.get("org_id") || "");

  // form state
  const [scope, setScope] = useState<"global" | "org">("global");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [picked, setPicked] = useState<User | null>(null);

  // data
  const [products, setProducts] = useState<Product[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [assignments, setAssignments] = useState<ReviewerAssignment[]>([]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  // user search
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState<User[]>([]);

  const doLogout = async () => {
    await logout().catch(() => {});
    router.replace("/login");
  };

  async function loadRef() {
    const [p, o] = await Promise.all([
      apiFetch<AdminProductsResponse>("/admin/master-products"),
      apiFetch<AdminOrgsResponse>("/admin/organizations?per_page=200"),
    ]);
    setProducts(parseArray<Product>(p));
    setOrgs(parseArray<Organization>(o));
  }

  async function loadAssignments() {
    // kalau backend support filter param, kita ikut; kalau tidak, aman (ignored)
    const qs = buildQuery({
      scope: scopeFilter,
      product_id: productFilter,
      org_id: orgFilter,
    });

    const a = await apiFetch<ReviewerAssignmentsResponse>(`/admin/user-article-reviewers${qs}`);
    setAssignments(parseArray<ReviewerAssignment>(a));
  }

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      await loadRef();
      await loadAssignments();

      router.replace(
        `/admin/user-articles/reviewers${buildQuery({
          scope: scopeFilter,
          product_id: productFilter,
          org_id: orgFilter,
        })}`
      );
    } catch (e: any) {
      setErr(e?.message || "Gagal load reviewer assignment");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchUser() {
    const q = email.trim();
    if (!q) return;

    setSearching(true);
    setErr("");
    setPicked(null);
    try {
      // asumsi admin users support q=
      const res = await apiFetch<AdminUsersResponse>(
        `/admin/users${buildQuery({ per_page: 10, q })}`
      );

      const list = parseArray<User>(res);

      // ✅ FE enforce: hanya internal role 1/2 yang muncul di picker
      const internal = list.filter((u) => u.master_role_id === 1 || u.master_role_id === 2);

      setUserResults(internal);
    } catch (e: any) {
      setUserResults([]);
      setErr(e?.message || "Gagal cari user");
    } finally {
      setSearching(false);
    }
  }

  const canSave = useMemo(() => {
    if (!picked) return false;
    if (!productId) return false;
    if (scope === "org" && !organizationId) return false;
    return true;
  }, [picked, productId, scope, organizationId]);

  async function onSave() {
    if (!canSave) return;

    setSaving(true);
    setErr("");
    try {
      await apiFetch(`/admin/user-article-reviewers`, {
        method: "POST",
        body: JSON.stringify({
          organization_id: scope === "global" ? null : Number(organizationId),
          product_id: Number(productId),
          reviewer_user_id: picked!.id,
        }),
      });

      setEmail("");
      setPicked(null);
      setUserResults([]);
      setScope("global");
      setOrganizationId("");
      setProductId("");

      await loadAssignments();
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan reviewer");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Hapus reviewer assignment ini?")) return;
    setSaving(true);
    setErr("");
    try {
      await apiFetch(`/admin/user-article-reviewers/${id}`, { method: "DELETE" });
      await loadAssignments();
    } catch (e: any) {
      setErr(e?.message || "Gagal hapus");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Article Reviewers</h1>
            <div className="text-sm text-slate-600">
              Admin Module • Assign reviewer per product (global atau per organization)
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              href="/admin/user-articles"
            >
              ← Back
            </Link>
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              onClick={doLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}

        {/* FORM */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Scope</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                value={scope}
                onChange={(e) => {
                  const v = e.target.value as "global" | "org";
                  setScope(v);
                  if (v === "global") setOrganizationId("");
                }}
              >
                <option value="global">Global</option>
                <option value="org">Per Organization</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Organization</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                disabled={scope === "global"}
              >
                <option value="">{scope === "global" ? "Global (disabled)" : "Pilih organization"}</option>
                {orgs.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Product</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Pilih product</option>
                {products.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Reviewer Email (internal)</label>
              <div className="mt-1 flex gap-2">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="contoh: staff@viriya..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setPicked(null);
                  }}
                />
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                  disabled={searching || !email.trim()}
                  onClick={searchUser}
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                *Picker hanya tampilkan user role 1/2 (internal).
              </div>
            </div>
          </div>

          {picked ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              Picked Reviewer: <b>{picked.email}</b> <span className="text-slate-600">({picked.name ?? "-"})</span>
            </div>
          ) : null}

          {!picked && userResults.length > 0 ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              {userResults.map((u) => (
                <button
                  key={u.id}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b last:border-b-0"
                  onClick={() => {
                    setPicked(u);
                    setUserResults([]);
                  }}
                >
                  <div className="font-semibold text-slate-900">{u.email}</div>
                  <div className="text-xs text-slate-600">{u.name ?? "-"}</div>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={!canSave || saving}
              onClick={onSave}
            >
              {saving ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <div>
                <label className="text-xs font-semibold text-slate-600">Filter Scope</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="global">Global</option>
                  <option value="org">Per Org</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Filter Product</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Filter Org</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                onClick={() => loadAssignments().catch(() => {})}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Tidak ada assignment.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        {a.organization_id ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            Org
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            Global
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {a.organization?.name ?? (a.organization_id ? `Org #${a.organization_id}` : "-")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {a.product?.name ?? `Product #${a.product_id}`}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {a.reviewer?.email ?? `User #${a.reviewer_user_id}`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                          disabled={saving}
                          onClick={() => onDelete(a.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
