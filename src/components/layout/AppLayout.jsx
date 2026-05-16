import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const SIDEBAR_KEY = "homefinance-sidebar-collapsed";

function getInitialCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  } catch {
    return false;
  }
}

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  return (
    <div className="app-clean-shell h-screen overflow-hidden bg-white text-slate-900 transition-colors dark:bg-[#020617] dark:text-slate-100">
      <div className="flex h-screen min-h-0 w-full overflow-hidden bg-white dark:bg-[#020617]">
        <div className="hidden h-screen shrink-0 md:block">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>

        <div className="md:hidden">
          <Sidebar
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
        </div>

        <div className="flex h-screen min-w-0 flex-1 flex-col bg-white dark:bg-[#020617]">
          <Topbar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <main className="app-clean-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#020617]">
            <div className="app-clean-content w-full max-w-full bg-white p-3 dark:bg-[#020617] sm:p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
