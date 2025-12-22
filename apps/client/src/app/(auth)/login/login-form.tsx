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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            {...form.register("email")}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Password"
            type="password"
            {...form.register("password")}
          />
          <button
            className="w-full border rounded px-3 py-2"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
