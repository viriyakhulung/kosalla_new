"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { login } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const search = useSearchParams();
  const next = search.get("next");

  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setError("");

      // 1) Login ke backend Laravel
      const resp: any = await login(values.email, values.password);

      // 2) Ambil token dengan fallback (penting)
      const token =
        resp?.token ??
        resp?.access_token ??
        resp?.data?.token ??
        resp?.data?.access_token;

      if (!token) {
        console.log("LOGIN RESPONSE =", resp);
        throw new Error("Token tidak ditemukan dari response login.");
      }

      // 3) Simpan token ke cookie via Next route handler
      const sess = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });

      if (!sess.ok) {
        const msg = await sess.text().catch(() => "");
        throw new Error(`Gagal set session. status=${sess.status}. ${msg}`);
      }

      // 4) Role logic (pakai master_role)
      const masterRole = resp?.user?.master_role ?? resp?.master_role ?? null;
      const isSuperAdmin =
        masterRole === "superadmin" || masterRole === "super_admin";

      const safeNext =
        next && next.startsWith("/") && !next.startsWith("/login") ? next : null;

      if (isSuperAdmin) {
        window.location.href = "/admin";
        return;
      }

      window.location.href = safeNext ?? "/portal";
    } catch (e: any) {
      console.error("❌ [LOGIN] error", e);
      setError(e?.message ?? "Login gagal");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Login</h1>
          <p className="text-slate-500 text-sm">Masuk untuk mengakses dashboard</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            🚨 {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="nama@perusahaan.com"
              {...form.register("email")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              type="password"
              {...form.register("password")}
            />
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Memproses..." : "Masuk Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
