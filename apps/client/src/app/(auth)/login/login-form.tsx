"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { login, me } from "@/lib/auth";

// NOTE: sesuaikan role string kamu (Spatie biasanya: super-admin, engineer-staff, dll)
function routeByRole(role: string) {
  if (role === "super-admin") return "/admin/organizations";
  if (role === "engineer-manager" || role === "engineer-staff") return "/engineer";
  return "/portal";
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
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

      // 1) login -> set cookie session by backend (Sanctum SPA)
      await login(values.email, values.password);

      // 2) fetch /me -> dapat roles
      const data = await me();
      const role = data?.user?.roles?.[0] ?? "enduser";

      // 3) redirect
      router.replace(next ?? routeByRole(role));
    } catch (e: any) {
      setError(e?.message ?? "Login gagal");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl dark:bg-primary/5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl dark:bg-secondary/5"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm relative z-10">
        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-2xl border border-primary/10 dark:border-primary/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-primary to-secondary/80 text-white">
            <div className="mb-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">Sign in to your Kosalla account</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none border-border bg-background/80 text-foreground placeholder:text-muted-foreground dark:border-border dark:bg-slate-950/50 hover:border-primary/50 hover:bg-background dark:hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:bg-background dark:focus-visible:border-primary dark:focus-visible:ring-primary/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                  {...form.register("email")}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none border-border bg-background/80 text-foreground placeholder:text-muted-foreground dark:border-border dark:bg-slate-950/50 hover:border-primary/50 hover:bg-background dark:hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:bg-background dark:focus-visible:border-primary dark:focus-visible:ring-primary/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                  {...form.register("password")}
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="rounded border-border w-4 h-4 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2.5 text-sm text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors">
                  Remember me
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/110 dark:hover:bg-primary/110 shadow-md hover:shadow-lg active:shadow-sm font-semibold text-sm transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-800/50 text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{" "}
              <a href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V15a1 1 0 11-2 0V5.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span>Your login is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}
