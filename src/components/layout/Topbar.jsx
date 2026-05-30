import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUser } from "../../services/authStorage";

function applyTheme(isDark) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

function getInitialTheme() {
  if (typeof window === "undefined") return false;

  const saved = localStorage.getItem("homefinance-theme");
  if (saved === "dark") return true;
  if (saved === "light") return false;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false;
}

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
    case "menu":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
          <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 4v16" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Topbar({ onToggleSidebar, onOpenDrawer }) {
  const nav = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const initialDark = getInitialTheme();
    setDarkMode(initialDark);
    applyTheme(initialDark);
  }, []);

  function toggleTheme() {
    setDarkMode((prev) => {
      const next = !prev;
      applyTheme(next);
      localStorage.setItem("homefinance-theme", next ? "dark" : "light");
      return next;
    });
  }

  function logout() {
    clearAuth();

    requestAnimationFrame(() => {
      nav("/login", { replace: true });
    });
  }

  const firstName = user?.name?.split(" ")?.[0] || "Guest";
  const initials = firstName.charAt(0).toUpperCase() || "G";

  const pageInfo = useMemo(
    () => ({
      "/": {
        title: "Dashboard",
        subtitle: "Your complete financial command center",
        accent: "from-indigo-500 to-fuchsia-500",
      },
      "/dashboard": {
        title: "Dashboard",
        subtitle: "Your complete financial command center",
        accent: "from-indigo-500 to-fuchsia-500",
      },
      "/settings": {
        title: "Settings",
        subtitle: "Accounts, categories, and family preferences",
        accent: "from-slate-600 to-slate-900",
      },
      "/ledger": {
        title: "Ledger",
        subtitle: "Track every income, expense, and transfer",
        accent: "from-cyan-500 to-blue-600",
      },
      "/fixed": {
        title: "Fixed Expenses",
        subtitle: "Recurring monthly expenses and bills",
        accent: "from-orange-500 to-rose-500",
      },
      "/grocery": {
        title: "Grocery",
        subtitle: "Receipt-style grocery expense tracking",
        accent: "from-emerald-500 to-teal-600",
      },
      "/emi": {
        title: "EMI",
        subtitle: "Installments, monthly bills, and payments",
        accent: "from-violet-500 to-purple-700",
      },
      "/savings": {
        title: "Savings",
        subtitle: "Savings transfers, DPS, and investments",
        accent: "from-lime-500 to-emerald-600",
      },
      "/wallet": {
        title: "Wallet",
        subtitle: "Member-wise income, expense, and settlement",
        accent: "from-amber-500 to-orange-600",
      },
      "/individual-summary": {
        title: "Individual Summary",
        subtitle: "Member-wise spending, cash, and monthly insight",
        accent: "from-cyan-500 to-teal-600",
      },
      "/carry-forward": {
        title: "Carry Forward",
        subtitle: "Previous balance movement across months",
        accent: "from-sky-500 to-cyan-600",
      },
      "/year-overview": {
        title: "Year Overview",
        subtitle: "Yearly trend and financial comparison",
        accent: "from-pink-500 to-rose-600",
      },
      "/family": {
        title: "Family Setup",
        subtitle: "Manage members and household sharing",
        accent: "from-blue-500 to-indigo-600",
      },
      "/login": {
        title: "Login",
        subtitle: "Access your finance workspace",
        accent: "from-slate-600 to-slate-900",
      },
      "/register": {
        title: "Register",
        subtitle: "Create your finance account",
        accent: "from-slate-600 to-slate-900",
      },
      "/planned-purchases": {
        title: "Planned Purchases",
        subtitle: "Future purchases, priorities, and targets",
        accent: "from-fuchsia-500 to-pink-600",
      },
    }),
    []
  );

  const currentPage = pageInfo[location.pathname] || {
    title: "HomeFinance",
    subtitle: "Simple, visual, and organized budgeting",
    accent: "from-indigo-500 to-fuchsia-500",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm shadow-slate-200/40 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/80 dark:shadow-black/20">
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onOpenDrawer && (
            <button
              onClick={onOpenDrawer}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 md:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>
          )}

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 md:inline-flex"
              aria-label="Toggle sidebar"
            >
              <Icon name="menu" />
            </button>
          )}

          <div
            className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentPage.accent} text-white shadow-lg shadow-indigo-500/20 sm:flex`}
          >
            <Icon name="spark" className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-950 dark:text-white sm:text-lg">
              {currentPage.title}
            </div>
            <div className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
              {currentPage.subtitle}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="group inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:scale-105 dark:bg-slate-800 dark:text-amber-300">
              {darkMode ? <Icon name="sun" className="h-4 w-4" /> : <Icon name="moon" className="h-4 w-4" />}
            </span>
            <span className="hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
          </button>

          <div className="hidden flex-col text-right leading-tight md:flex">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Welcome back
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {firstName}
            </span>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-fuchsia-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 ring-2 ring-white dark:ring-slate-800">
            {initials}
          </div>

          {user && (
            <button
              onClick={logout}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
