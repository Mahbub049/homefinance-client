import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import HFIcon from '../design/HFIcon';
import './sidebar-refinement.css';

// Keep the section order consistent on desktop, on mobile, and in the collapsed rail.
const primaryLinks = [
  { to: '/dashboard', label: 'হোম', icon: 'home' },
  { to: '/ledger', label: 'আয়-খরচ', icon: 'ledger' },
  { to: '/wallet', label: 'টাকার হিসাব', icon: 'wallet' },
];
const planningLinks = [
  { to: '/shopping-list', label: 'বাজারের তালিকা', icon: 'checklist' },
  { to: '/planned-purchases', label: 'পরিকল্পিত কেনাকাটা', icon: 'planned' },
];
const spendingLinks = [
  { to: '/fixed', label: 'নিয়মিত বিল', icon: 'fixed' },
  { to: '/grocery', label: 'বাজার', icon: 'grocery' },
  { to: '/emi', label: 'কিস্তি', icon: 'emi' },
  { to: '/shared-purchases', label: 'ভাগ করে কেনাকাটা', icon: 'shared' },
  { to: '/savings', label: 'সঞ্চয়', icon: 'savings' },
];
const reportLinks = [
  { to: '/carry-forward', label: 'মাস শেষে হিসাব', icon: 'carry' },
  { to: '/year-overview', label: 'বছরের হিসাব', icon: 'reports' },
  { to: '/individual-summary', label: 'ব্যক্তিগত হিসাব', icon: 'individual' },
];
// The Tax Center is intentionally hidden from navigation, not deleted.
const inGroup = (links, path) => links.some((item) => item.to === path);

function NavItem({ item, collapsed, onNavigate }) {
  return <NavLink to={item.to} onClick={onNavigate}
    title={collapsed ? item.label : undefined}
    aria-label={item.label}
    className={({ isActive }) => `hf-nav-item hf-refined-nav-link${isActive ? ' hf-nav-active' : ''}${collapsed ? ' is-rail' : ''}`}>
    {({ isActive }) => <>
      <span className="hf-nav-icon"><HFIcon name={item.icon} size={19}/></span>
      {!collapsed && <span className="hf-nav-item-text">{item.label}</span>}
      {isActive && <span className="sr-only"> (বর্তমান পেজ)</span>}
    </>}
  </NavLink>;
}

function NavSection({ title, items, collapsed, onNavigate, collapsible = false, expanded = true, onToggle, forceExpanded = false }) {
  const isOpen = forceExpanded || expanded;
  return <section className={`hf-refined-section${collapsed ? ' is-rail' : ''}`} aria-label={title}>
    {collapsed ? <div className="hf-refined-rail-divider" aria-hidden="true"/> : collapsible && !forceExpanded ?
      <button type="button" className="hf-refined-section-toggle" onClick={onToggle} aria-expanded={isOpen} aria-label={`${title} ${isOpen ? 'বন্ধ করুন' : 'খুলুন'}`}>
        <span className="hf-refined-section-name">{title}</span>
        <HFIcon name="down" className={`hf-refined-section-arrow${isOpen ? ' is-open' : ''}`} size={15}/>
      </button> :
      <div className="hf-refined-section-name hf-refined-section-label">{title}</div>}
    {(collapsed || isOpen) && <div className="hf-refined-section-links">
      {items.map((item) => <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate}/>)}
    </div>}
  </section>;
}

export default function Sidebar({ collapsed = false, onToggleCollapse, drawerOpen = false, onCloseDrawer }) {
  const location = useLocation();
  const mobile = typeof onCloseDrawer === 'function';
  const compact = Boolean(collapsed && !mobile);
  const [spendingOpen, setSpendingOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(() => inGroup(reportLinks, location.pathname));

  // Never hide the currently selected route behind a collapsed group.
  useEffect(() => {
    if (inGroup(spendingLinks, location.pathname)) setSpendingOpen(true);
    if (inGroup(reportLinks, location.pathname)) setReportOpen(true);
  }, [location.pathname]);

  const onNavigate = mobile ? onCloseDrawer : undefined;
  const content = <aside className={`hf-shell-sidebar hf-refined-sidebar app-sidebar-shell flex h-screen flex-col border-r overflow-hidden${compact ? ' is-collapsed' : ''}`}
    style={{ width: mobile ? 'min(19rem,88vw)' : compact ? 76 : 250 }}>
    <div className="hf-refined-brand-row">
      {compact ?
        <button type="button" onClick={onToggleCollapse} className="hf-refined-brand-expand" aria-label="সাইডবার বড় করুন" title="সাইডবার বড় করুন">
          <span className="hf-logo-mark">হি</span>
        </button> : <>
          <span className="hf-logo-mark" aria-hidden="true">হি</span>
          <div className="hf-refined-brand-copy">
            <div className="hf-shell-title text-[15px]">হিসাব নিকাশ</div>
            <div className="hf-shell-subtitle">আমাদের দৈনন্দিন টাকার হিসাব</div>
          </div>
          {mobile ? <button type="button" onClick={onCloseDrawer} className="hf-refined-brand-control" aria-label="মেনু বন্ধ করুন" title="বন্ধ করুন"><HFIcon name="close" size={17}/></button>
            : <button type="button" onClick={onToggleCollapse} className="hf-refined-brand-control" aria-label="সাইডবার ছোট করুন" title="সাইডবার ছোট করুন"><HFIcon name="menu" size={17}/></button>}
        </>}
    </div>

    <nav className="hf-refined-nav sidebar-no-scrollbar flex-1 overflow-y-auto" aria-label="প্রধান নেভিগেশন">
      <NavSection title="প্রধান" items={primaryLinks} collapsed={compact} onNavigate={onNavigate}/>
      <NavSection title="পরিকল্পনা" items={planningLinks} collapsed={compact} onNavigate={onNavigate}/>
      <NavSection title="খরচ ও সঞ্চয়" items={spendingLinks} collapsed={compact} onNavigate={onNavigate}
        collapsible expanded={spendingOpen} onToggle={() => setSpendingOpen((v) => !v)} forceExpanded={mobile}/>
      <NavSection title="হিসাব" items={reportLinks} collapsed={compact} onNavigate={onNavigate}
        collapsible expanded={reportOpen} onToggle={() => setReportOpen((v) => !v)}/>
    </nav>
    <div className="hf-refined-settings"><NavItem item={{ to: '/settings', label: 'সেটিংস', icon: 'settings' }} collapsed={compact} onNavigate={onNavigate}/></div>
  </aside>;

  if (!mobile) return content;
  return <div className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
    <button type="button" tabIndex={drawerOpen ? 0 : -1} onClick={onCloseDrawer}
      className={`absolute inset-0 w-full bg-slate-950/65 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} aria-label="মেনু বন্ধ করুন"/>
    <div className={`relative h-full w-fit transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>{content}</div>
  </div>;
}
