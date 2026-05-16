import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-clean-shell min-h-screen overflow-hidden bg-white text-slate-900 transition-colors dark:bg-[#020617] dark:text-slate-100">
      <div className="relative flex min-h-screen bg-white dark:bg-[#020617]">
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
        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#020617]">
          <Topbar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          {/* Scroll area */}
          <main className="app-clean-main flex-1 overflow-y-auto bg-white dark:bg-[#020617]">
            <div className="app-clean-content mx-auto w-full max-w-full bg-white p-3 dark:bg-[#020617] sm:p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}