import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import HFIcon from '../design/HFIcon';

const core = [
  { to: '/dashboard', label: 'হোম', icon: 'home' },
  { to: '/ledger', label: 'আয়-খরচ', icon: 'ledger' },
  { to: '/wallet', label: 'টাকার হিসাব', icon: 'wallet' },
];
const work = [
  { to: '/fixed', label: 'নিয়মিত বিল', icon: 'fixed' },
  { to: '/grocery', label: 'বাজার', icon: 'grocery' },
  { to: '/emi', label: 'কিস্তি', icon: 'emi' },
  { to: '/shared-purchases', label: 'ভাগ করে কেনাকাটা', icon: 'shared' },
  { to: '/savings', label: 'সঞ্চয়', icon: 'savings' },
];
const monthly = [
  { to: '/carry-forward', label: 'মাস শেষে হিসাব', icon: 'carry' },
  { to: '/year-overview', label: 'বছরের হিসাব', icon: 'reports' },
  { to: '/individual-summary', label: 'ব্যক্তিগত হিসাব', icon: 'individual' },
];
const planning = [
  { to: '/shopping-list', label: 'বাজারের তালিকা', icon: 'checklist' },
  { to: '/planned-purchases', label: 'ভবিষ্যতের কেনাকাটা', icon: 'planned' },
];
// Tax Center is intentionally hidden from navigation; its route and data remain intact.
const isPlanningRoute = (path) => planning.some((item) => item.to === path);

function NavItem({ item, collapsed, onNavigate }) {
  return <NavLink to={item.to} onClick={onNavigate} title={collapsed ? item.label : undefined} aria-label={item.label}
    className={({isActive})=>`hf-nav-item${isActive ? " hf-nav-active" : ""}`} style={collapsed ? {justifyContent:'center', paddingInline: 6} : undefined}>
    {({isActive}) => <span className="hf-nav-item-inner" style={{ display:'contents' }}>
      <span className="hf-nav-icon"><HFIcon name={item.icon} size={19}/></span>
      {!collapsed && <span className="hf-nav-item-text">{item.label}</span>}
      {isActive && <span className="sr-only"> (বর্তমান পেজ)</span>}
    </span>}
  </NavLink>;
}

function NavGroup({ heading, items, collapsed, onNavigate }) {
  return <section aria-label={heading}>
    {!collapsed && <div className="hf-nav-label">{heading}</div>}
    {collapsed && <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--hf-line)' }}/>}
    <div className="space-y-1">{items.map((item) => <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate}/>)}</div>
  </section>;
}

export default function Sidebar({ collapsed = false, onToggleCollapse, drawerOpen = false, onCloseDrawer }) {
  const location = useLocation();
  const mobile = typeof onCloseDrawer === 'function';
  const compact = collapsed && !mobile;
  const [moreOpen, setMoreOpen] = useState(() => isPlanningRoute(location.pathname));
  useEffect(() => { if (isPlanningRoute(location.pathname)) setMoreOpen(true); }, [location.pathname]);

  const handleExtra = () => {
    if (compact) { onToggleCollapse?.(); setMoreOpen(true); }
    else setMoreOpen((previous) => !previous);
  };

  const content = <aside className="hf-shell-sidebar app-sidebar-shell flex h-screen flex-col border-r overflow-hidden" style={{width: mobile ? 'min(19rem,88vw)' : compact ? 76 : 250}}>
    <div className="flex items-center gap-2 border-b px-3 py-3" style={{ borderColor: 'var(--hf-line)' }}>
      <div className="hf-logo-mark">হি</div>
      {!compact && <div className="min-w-0 flex-1"><div className="hf-shell-title text-[15px]">হিসাব নিকাশ</div><div className="hf-shell-subtitle">আমাদের দৈনন্দিন টাকার হিসাব</div></div>}
      {mobile ? <button onClick={onCloseDrawer} type="button" className="hf-toolbar-button" aria-label="মেনু বন্ধ করুন" title="বন্ধ করুন"><HFIcon name="close" size={17}/></button> :
        <button onClick={onToggleCollapse} type="button" className="hf-toolbar-button" aria-label={compact?'মেনু বড় করুন':'মেনু ছোট করুন'} title={compact?'মেনু বড় করুন':'মেনু ছোট করুন'}><HFIcon name={compact?'right':'left'} size={17}/></button>}
    </div>
    <nav className="sidebar-no-scrollbar flex-1 overflow-y-auto px-3 pb-7 pt-2" aria-label="প্রধান নেভিগেশন">
      <NavGroup heading="প্রধান" items={core} collapsed={compact} onNavigate={mobile?onCloseDrawer:undefined}/>
      <NavGroup heading="খরচ ও সঞ্চয়" items={work} collapsed={compact} onNavigate={mobile?onCloseDrawer:undefined}/>
      <NavGroup heading="হিসাব" items={monthly} collapsed={compact} onNavigate={mobile?onCloseDrawer:undefined}/>
      <div className="mt-2">
        <button type="button" className="hf-nav-group-toggle" onClick={handleExtra} title="পরিকল্পনা" aria-label="পরিকল্পনার পেজ" aria-expanded={moreOpen && !compact}>
          <span className="flex items-center gap-3"><HFIcon name="more" size={19}/>{!compact && 'পরিকল্পনা'}</span>
          {!compact && <HFIcon name="down" size={15} className="hf-nav-group-chevron" data-open={moreOpen}/>}
        </button>
        {!compact && moreOpen && <div className="space-y-1 pl-2">{planning.map(item => <NavItem key={item.to} item={item} onNavigate={mobile?onCloseDrawer:undefined}/>)}</div>}
      </div>
    </nav>
    <div className="px-3 pb-3 pt-3 border-t" style={{borderColor:'var(--hf-line)'}}><NavItem item={{to:'/settings',label:'সেটিংস',icon:'settings'}} collapsed={compact} onNavigate={mobile?onCloseDrawer:undefined}/></div>
  </aside>;

  if (!mobile) return content;
  return <div className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
    <button type="button" tabIndex={drawerOpen?0:-1} onClick={onCloseDrawer} className={`absolute inset-0 w-full bg-slate-950/65 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} aria-label="মেনু বন্ধ করুন"/>
    <div className={`relative h-full w-fit transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {content}
    </div>
  </div>;
}
