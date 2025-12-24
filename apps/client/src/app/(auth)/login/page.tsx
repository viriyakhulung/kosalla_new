import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = {
  title: "Sign In | Kosalla Ticketing System",
  description: "Sign in to your Kosalla account to access the ticketing system",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center border border-primary/10 dark:border-primary/20">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-foreground font-medium">Preparing your login...</p>
        <p className="text-muted-foreground text-sm mt-1">This should only take a moment</p>
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
