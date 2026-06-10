"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";

import { login } from "@/lib/auth";
import { ViriyaLogo } from "@/components/ViriyaLogo";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
  captcha: z.string().min(1, "Captcha wajib diisi"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const search = useSearchParams();
  const next = search.get("next");

  const [error, setError] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captchaImage, setCaptchaImage] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", captcha: "" },
  });

  // generate captcha saat load awal
  useEffect(() => {
    regenCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // generate captcha sederhana (kombinasi huruf besar/kecil + angka, min 1 digit)
  function regenCaptcha() {
    const newCode = generateCode();
    setCaptchaText(newCode);
    setCaptchaImage(generateImage(newCode));
    form.setValue("captcha", "");
  }

    function generateCode() {
    const lowers = "abcdefghijkmnopqrstuvwxyz";
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const all = lowers + uppers + digits;

    let out = "";
    // pastikan ada minimal 1 digit, 1 lower, 1 upper
    const length = 6;
    while (true) {
      out = "";
      for (let i = 0; i < length; i++) {
        out += all[Math.floor(Math.random() * all.length)];
      }
      if (/[0-9]/.test(out) && /[a-z]/.test(out) && /[A-Z]/.test(out)) break;
    }

      return out;
    }

    function generateImage(text: string) {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      // background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // noise
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(255,255,255,0.${Math.floor(Math.random() * 4) + 2})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillStyle = "#e2e8f0";
      const chars = text.split("");
      const spacing = canvas.width / (chars.length + 1);
      chars.forEach((ch, i) => {
        const x = spacing * (i + 1);
        const y = canvas.height / 2 + 10;
        const angle = (Math.random() - 0.5) * 0.4;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(ch, -8, 0);
        ctx.restore();
      });

      return canvas.toDataURL("image/png");
  }

  const onSubmit = async (values: FormValues) => {
    try {
      setError("");

      // validasi captcha sederhana di sisi client
      const input = values.captcha.trim();
      if (input !== captchaText) {
        setError("Captcha salah, silakan coba lagi.");
        regenCaptcha();
        return;
      }

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
      console.error("Г?O [LOGIN] error", e);
      setError(e?.message ?? "Login gagal");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - Brand section */}
          <div className="hidden md:flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/20 rounded-lg mb-6 w-fit">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm font-semibold text-blue-300">KOSALLA TICKETING SYSTEM & KMS</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Kelola Tiket Anda Dengan Mudah
              </h1>
              <p className="text-lg text-slate-300 mb-8">
                Platform manajemen tiket profesional & knowledge management untuk meningkatkan efisiensi tim
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-lg mt-1 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Antarmuka Intuitif</h3>
                    <p className="text-slate-400 text-sm">Mudah digunakan untuk semua level pengguna</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-lg mt-1 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Kolaborasi Real-time</h3>
                    <p className="text-slate-400 text-sm">Tim dapat bekerja sama dengan lebih efisien</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-lg mt-1 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Keamanan Terjamin</h3>
                    <p className="text-slate-400 text-sm">Data Anda dilindungi dengan enkripsi tingkat enterprise</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-700">
              <p className="text-slate-400 text-sm">Ac 2025 Viriya. Solusi Ticketing Terdepan.</p>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Logo Section */}
            <div className="flex justify-center mb-6">
              <ViriyaLogo size="md" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Selamat Datang</h2>
              <p className="text-slate-600">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                  placeholder="nama@viriya.com"
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-red-600 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                   
                  </a>
                </div>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                  placeholder=""
                  type="password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-red-600 text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Captcha</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                      placeholder="Masukkan kode di samping"
                      {...form.register("captcha")}
                    />
                    {form.formState.errors.captcha && (
                      <p className="text-red-600 text-xs mt-1">
                        {form.formState.errors.captcha.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="px-2 py-1 rounded-md border bg-slate-900 text-white font-mono tracking-widest shadow-inner">
                      {captchaImage ? (
                        <img
                          src={captchaImage}
                          alt="captcha"
                          className="h-[50px] w-[160px] object-cover select-none"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-sm">------</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-700"
                      onClick={regenCaptcha}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Atau</span>
                </div>
              </div>

              <p className="text-center text-sm text-slate-600">
                Belum punya akun?{" "}
                <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Hubungi Admin
                </a>
              </p>
            </form>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-center text-xs text-slate-500">
                Sistem ini dilindungi oleh enkripsi tingkat enterprise. Data Anda aman bersama kami.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
