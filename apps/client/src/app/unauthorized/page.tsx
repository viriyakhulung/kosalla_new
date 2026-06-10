import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-600 mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-slate-900">Access Denied</h2>
        </div>

        <p className="text-slate-600 mb-8">
          You don't have permission to access this page. Your current role doesn't allow access to this resource.
        </p>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/profile"
            className="flex-1 border border-slate-300 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
