import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-rose-50/50 text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-600/10" />
        <div className="absolute -right-32 top-36 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-600/10" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-600/10" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>

        {/* Mobile drawer sidebar */}
        <div className="md:hidden">
          <Sidebar
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          {/* Scroll area */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
