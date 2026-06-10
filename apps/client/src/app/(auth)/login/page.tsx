import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = {
  title: "Login - Kosalla Ticketing System",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg animate-spin"
              style={{ animationDuration: "3s" }}
            ></div>
            <div className="absolute inset-1 bg-slate-800 rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-slate-300 text-lg font-semibold">Kosalla</p>
          <p className="text-slate-500 text-sm">Loading authentication...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
