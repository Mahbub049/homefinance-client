import { NavLink } from "react-router-dom";
import { useMemo } from "react";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

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
    case "close":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
          <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
        </svg>
      );
    default:
      return null;
  }
}

function GroupTitle({ collapsed, children }) {
  if (collapsed) return <div className="h-4" />;

  return (
    <div className="px-3 pb-2 pt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      {children}
    </div>
  );
}

function Item({ to, label, icon, collapsed }) {
  const className = ({ isActive }) =>
    [
      "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
      isActive
        ? "active bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/25"
        : "text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
    ].join(" ");

  return (
    <NavLink to={to} className={className} title={collapsed ? label : undefined}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200 group-hover:text-slate-950 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700 dark:group-hover:text-white group-[.active]:bg-white/20 group-[.active]:text-white">
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function SidebarFooter({ collapsed }) {
  return (
    <div className="border-t border-slate-200/70 p-3 dark:border-slate-800">
      <div
        className={[
          "rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20",
          collapsed ? "p-2" : "p-4",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Icon name="spark" className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold">Smart Budgeting</div>
              <div className="mt-0.5 text-xs text-white/75">Track • Split • Plan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  drawerOpen = false,
  onCloseDrawer,
}) {
  const nav = useMemo(
    () => [
      {
        title: "Main",
        items: [
          { to: "/dashboard", label: "Dashboard", icon: <Icon name="dashboard" /> },
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
        "sticky top-0 flex h-screen flex-col border-r border-white/70 bg-white/85 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-black/30",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      <div className="border-b border-slate-200/70 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-sm font-black text-white shadow-lg shadow-indigo-500/30">
              {collapsed ? "HF" : <Icon name="spark" className="h-5 w-5" />}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-black leading-5 text-slate-950 dark:text-white">
                  HomeFinance
                </h1>
                <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  Beautiful budgeting workspace
                </p>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:inline-flex"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <Icon
                name="chev"
                className={[
                  "h-4 w-4 transition-transform duration-200",
                  collapsed ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>
          )}

          {onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
              title="Close"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {nav.map((group) => (
          <div key={group.title}>
            <GroupTitle collapsed={collapsed}>{group.title}</GroupTitle>
            <div className="space-y-1.5">
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

      <SidebarFooter collapsed={collapsed} />
    </aside>
  );

  if (typeof onCloseDrawer === "function") {
    return (
      <>
        <div
          className={[
            "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity",
            drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          ].join(" ")}
          onClick={onCloseDrawer}
        />

        <div
          className={[
            "fixed left-0 top-0 z-50 transition-transform duration-300",
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
