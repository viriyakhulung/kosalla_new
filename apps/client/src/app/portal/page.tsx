export default function PortalPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 rounded-xl p-8 border border-primary/20 dark:border-primary/30">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Your Portal</h1>
            <p className="text-muted-foreground max-w-2xl">
              Manage your support tickets, track issues, and collaborate with our team. Everything you need is right here.
            </p>
          </div>
          <div className="text-5xl">🏠</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Open Tickets Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border dark:border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Open Tickets</p>
              <p className="text-3xl font-bold text-foreground mt-2">5</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">🎫</div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Awaiting resolution</p>
        </div>

        {/* In Progress Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border dark:border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-foreground mt-2">3</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center text-xl">⚙️</div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Being worked on</p>
        </div>

        {/* Resolved Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border dark:border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Resolved</p>
              <p className="text-3xl font-bold text-foreground mt-2">28</p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center text-xl">✅</div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">This month</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-border/50 shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-border dark:border-border/50 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-foreground">Recent Tickets</h2>
          </div>
          <div className="divide-y divide-border dark:divide-border/50">
            {[
              { id: "TKT-001", title: "Cannot login to account", status: "Open", priority: "High" },
              { id: "TKT-002", title: "Feature request: Dark mode", status: "In Progress", priority: "Medium" },
              { id: "TKT-003", title: "Payment processing error", status: "Open", priority: "High" },
            ].map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">{ticket.id}</span>
                      <h3 className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {ticket.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Updated 2 hours ago</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      ticket.priority === "High"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === "Open"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/10 text-secondary"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border dark:border-border/50 bg-slate-50/50 dark:bg-slate-800/50 text-center">
            <a href="/portal/tickets" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              View all tickets →
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Create Ticket */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border dark:border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">➕</div>
              <div>
                <h3 className="font-semibold text-foreground">Create Ticket</h3>
                <p className="text-xs text-muted-foreground">Report a new issue</p>
              </div>
            </div>
            <a href="/portal/tickets/create" className="mt-4 block text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold">
              New Ticket
            </a>
          </div>

          {/* Documentation */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border dark:border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:border-secondary/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center text-2xl">📚</div>
              <div>
                <h3 className="font-semibold text-foreground">Documentation</h3>
                <p className="text-xs text-muted-foreground">Help & guides</p>
              </div>
            </div>
            <a href="#" className="mt-4 block text-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-semibold">
              Learn More
            </a>
          </div>

          {/* Contact Support */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-border dark:border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:border-accent/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-2xl">💬</div>
              <div>
                <h3 className="font-semibold text-foreground">Contact Support</h3>
                <p className="text-xs text-muted-foreground">Chat with our team</p>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-semibold">
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
