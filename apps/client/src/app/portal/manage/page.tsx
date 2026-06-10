import Link from "next/link";

export default function ManageHomePage() {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Manage</h1>
          <p className="text-sm text-slate-600">Portal Manage (Viriyastaff)</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href="/portal/manage/tutorial"
            className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"
          >
            <div className="text-lg font-semibold">Tutorial</div>
            <div className="mt-1 text-sm text-slate-600">Modul tutorial yang sudah ada</div>
          </Link>

          <Link
            href="/portal/manage/user-articles"
            className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"
          >
            <div className="text-lg font-semibold">User Articles</div>
            <div className="mt-1 text-sm text-slate-600">
              Create/Review/Publish sesuai permission flags
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
