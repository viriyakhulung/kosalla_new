// app/portal/page.tsx
import Link from "next/link";

export default function PortalPage() {
  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to Kosalla Portal.
        </p>
      </div>

      <div className="flex gap-3">
        <Link className="px-4 py-2 rounded bg-slate-900 text-white" href="/portal/tickets/new">
          Create Ticket
        </Link>

        <Link className="px-4 py-2 rounded border" href="/portal/tickets">
          Ticket History
        </Link>
      </div>
    </main>
  );
}
