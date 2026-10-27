import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const SIDEBAR_KEY = 'homefinance-sidebar-collapsed';
function initialCollapsed() {
  try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
}

export default function AppLayout({children}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch { /* storage unavailable */ }
  }, [collapsed]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const close = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [drawerOpen]);

  return <div className="hf-app-shell app-clean-shell flex h-screen min-w-0 overflow-hidden">
    <div className="hidden h-screen shrink-0 md:block"><Sidebar collapsed={collapsed} onToggleCollapse={()=>setCollapsed(v=>!v)}/></div>
    <Sidebar drawerOpen={drawerOpen} onCloseDrawer={()=>setDrawerOpen(false)}/>
    <div className="flex min-w-0 flex-1 flex-col">
      <Topbar onToggleSidebar={()=>setCollapsed(v=>!v)} onOpenDrawer={()=>setDrawerOpen(true)}/>
      <main id="main-content" className="hf-shell-main app-clean-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto" tabIndex={-1}>
        <div className="hf-shell-content app-clean-content w-full">{children}</div>
      </main>
    </div>
  </div>;
}
