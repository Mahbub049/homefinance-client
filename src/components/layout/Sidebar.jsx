import { NavLink } from "react-router-dom";
import { useMemo } from "react";

/**
 * Usage examples:
 * 1) Normal desktop sidebar:
 *    <Sidebar />
 *
 * 2) With collapse toggle:
 *    const [collapsed, setCollapsed] = useState(false);
 *    <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(v=>!v)} />
 *
 * 3) Mobile drawer:
 *    const [open, setOpen] = useState(false);
 *    <Sidebar drawerOpen={open} onCloseDrawer={() => setOpen(false)} />
 */

function Icon({ name, className = "h-5 w-5" }) {
  // Simple inline icons (no extra library)
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10z" />
          <path d="M13 21h8V11h-8v10z" />
          <path d="M13 3h8v6h-8V3z" />
          <path d="M3 17h8v4H3v-4z" />
        </svg>
      );
    case "family":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M16 11a4 4 0 1 0-8 0" />
          <path d="M6 21a6 6 0 0 1 12 0" />
          <path d="M19 8a3 3 0 1 1 0 6" />
          <path d="M22 21a5 5 0 0 0-3-4.5" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4.7a7.7 7.7 0 0 0-1.7-1l-.3-2.5H9l-.3 2.5a7.7 7.7 0 0 0-1.7 1L4.6 8l-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.7a7.7 7.7 0 0 0 1.7 1l.3 2.5h6l.3-2.5a7.7 7.7 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5z" />
        </svg>
      );
    case "ledger":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </svg>
      );
    case "fixed":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
        </svg>
      );
    case "grocery":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M6 6h15l-1.5 9h-12z" />
          <path d="M6 6l-2-3H2" />
          <path d="M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
          <path d="M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      );
    case "emi":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 1v22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "savings":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 21s8-4 8-10a4 4 0 0 0-8-2 4 4 0 0 0-8 2c0 6 8 10 8 10z" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 7h18v14H3V7z" />
          <path d="M3 7l2-4h14l2 4" />
          <path d="M17 14h4" />
        </svg>
      );
    case "planned":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-5" />
          <path d="M12 15V7" />
          <path d="M16 15v-3" />
        </svg>
      );
    case "chev":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    default:
      return null;
  }
}

function GroupTitle({ collapsed, children }) {
  if (collapsed) return <div className="h-3" />;
  return (
    <div className="px-3 pt-4 pb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
      {children}
    </div>
  );
}

function Item({ to, label, icon, collapsed }) {
  const className = ({ isActive }) =>
    [
      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
      isActive
        ? "bg-black text-white"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");

  return (
    <NavLink to={to} className={className} title={collapsed ? label : undefined}>
      {/* active indicator */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-transparent group-[.active]:bg-white/80" />
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  drawerOpen = false, // for mobile overlay
  onCloseDrawer,
}) {
  const nav = useMemo(
    () => [
      {
        title: "Main",
        items: [
          { to: "/dashboard", label: "Dashboard", icon: <Icon name="dashboard" /> },
          //   { to: "/family", label: "Family", icon: <Icon name="family" /> },
          { to: "/settings", label: "Settings", icon: <Icon name="settings" /> },
        ],
      },
      {
        title: "Budget",
        items: [
          { to: "/ledger", label: "Ledger", icon: <Icon name="ledger" /> },
          { to: "/fixed", label: "Fixed Expenses", icon: <Icon name="fixed" /> },
          { to: "/grocery", label: "Grocery", icon: <Icon name="grocery" /> },
          { to: "/emi", label: "EMI", icon: <Icon name="emi" /> },
          { to: "/savings", label: "Savings", icon: <Icon name="savings" /> },
          { to: "/wallet", label: "Wallet", icon: <Icon name="wallet" /> },
          { to: "/planned-purchases", label: "Planned Purchases", icon: <Icon name="planned" /> },
        ],
      },
      {
        title: "Reports",
        items: [
          { to: "/carry-forward", label: "Carry Forward", icon: <Icon name="reports" /> },
          { to: "/year-overview", label: "Year Overview", icon: <Icon name="reports" /> },
        ],
      },
    ],
    []
  );

  const content = (
    <aside
      className={[
        "h-screen sticky top-0 border-r bg-white",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-5 truncate">
              {collapsed ? "HF" : "HomeFinance"}
            </h1>
            {!collapsed && (
              <p className="text-xs text-gray-500 mt-1">Track • Split • Plan</p>
            )}
          </div>

          {/* Collapse toggle (optional) */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:inline-flex items-center justify-center rounded-md border px-2 py-2 hover:bg-gray-50"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <Icon name="chev" className={["h-4 w-4 transition", collapsed ? "rotate-180" : ""].join(" ")} />
            </button>
          )}

          {/* Mobile close (only drawer) */}
          {onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="md:hidden inline-flex items-center justify-center rounded-md border px-2 py-2 hover:bg-gray-50"
              title="Close"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 overflow-y-auto h-[calc(100vh-73px)]">
        {nav.map((group) => (
          <div key={group.title}>
            <GroupTitle collapsed={collapsed}>{group.title}</GroupTitle>
            <div className="space-y-1">
              {group.items.map((it) => (
                <Item
                  key={it.to}
                  to={it.to}
                  label={it.label}
                  icon={it.icon}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  // If used as a mobile drawer:
  if (typeof onCloseDrawer === "function") {
    return (
      <>
        {/* overlay */}
        <div
          className={[
            "fixed inset-0 bg-black/30 z-40 transition",
            drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          ].join(" ")}
          onClick={onCloseDrawer}
        />

        {/* panel */}
        <div
          className={[
            "fixed left-0 top-0 z-50 transition-transform",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {content}
        </div>
      </>
    );
  }

  return content;
}

/**
 * Optional helper button for mobile (place in your top bar)
 *
 * <button onClick={()=>setOpen(true)} className="md:hidden border rounded-md p-2">
 *   <Icon name="menu" className="h-5 w-5" />
 * </button>
 */