import React from 'react';

const paths = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-8h6v8" /></>,
  ledger: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  wallet: <><rect x="3" y="6" width="18" height="15" rx="3"/><path d="M3 10h18M16 15h5"/><path d="M6 6V4a1 1 0 0 1 1-1h11"/></>,
  fixed: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3m-3 3h7"/></>,
  grocery: <><path d="m3 5 2 2h16l-2 10H7L5 7"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></>,
  emi: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
  shared: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M15 17a5 5 0 0 1 7 4"/></>,
  savings: <><path d="M4 10a8 8 0 0 1 16 0v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M8 5V3m8 2V3M8 12h8m-4-4v8"/></>,
  carry: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 2v4m10-4v4M3 10h18m-12 5h6m-3-3 3 3-3 3"/></>,
  reports: <><path d="M4 20V5m0 15h16M9 17v-5m5 5V7m5 10v-7"/></>,
  planned: <><path d="M4 5h16v16H4zM8 3v4m8-4v4M7 11h10m-8 4 2 2 4-4"/></>,
  individual: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.7-1L15.1 5H8.9l-.3 2.7a8 8 0 0 0-1.7 1L4.5 8l-2 3.5L4.5 13a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-.7a8 8 0 0 0 1.7 1l.3 2.7h6.2l.3-2.7a8 8 0 0 0 1.7-1l2.4.7 2-3.5z" transform="translate(0 -2) scale(1 1.02)"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="M6 6l12 12M18 6 6 18"/>,
  left: <path d="m15 18-6-6 6-6"/>,
  right: <path d="m9 18 6-6-6-6"/>,
  down: <path d="m6 9 6 6 6-6"/>,
  up: <path d="m6 15 6-6 6 6"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3m18-8v16"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6L12 12.5V14m0 3h.01"/></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2 5"/><path d="M20 5v6h-6"/></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 18v3h16v-3"/></>,
  'chevron-up': <path d="m6 15 6-6 6 6"/>,
  'chevron-down': <path d="m6 9 6 6 6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  arrowDown: <path d="M12 3v17m-7-7 7 7 7-7"/>,
  arrowUp: <path d="M12 21V4M5 11l7-7 7 7"/>,
};

export default function HFIcon({ name, size = 20, className = '', ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...props}>{paths[name] || paths.info}</svg>;
}
