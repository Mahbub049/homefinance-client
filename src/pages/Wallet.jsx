import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(v) {
  const n = Number(v || 0);
  return `৳ ${n.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function safeNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function shortMonth(value) {
  if (!value) return "Selected month";
  const [year, month] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function initials(name = "") {
  const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function openNativePicker(e) {
  const input = e.currentTarget.querySelector("input");
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers block showPicker unless the direct input is clicked.
    }
  }
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

  if (name === "wallet") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-14A2.5 2.5 0 0 1 2 17V7a2.5 2.5 0 0 1 2.5-2.5H17" />
        <path d="M4.5 4.5h12A2.5 2.5 0 0 1 19 7" />
        <path d="M17 13h4" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v6h-6" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
        <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "arrowUp") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    );
  }

  if (name === "arrowDown") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </svg>
    );
  }

  if (name === "swap") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M7 7h11" />
        <path d="m15 4 3 3-3 3" />
        <path d="M17 17H6" />
        <path d="m9 14-3 3 3 3" />
      </svg>
    );
  }

  return (
    <svg {...common} viewBox="0 0 24 24">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-5" />
      <path d="M12 15V7" />
      <path d="M16 15v-3" />
    </svg>
  );
}

function statusClasses(value) {
  const n = safeNumber(value);
  if (n > 0) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200";
  }
  if (n < 0) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100 dark:bg-white/10" />
      <div className="relative animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="h-5 w-36 rounded bg-slate-200 dark:bg-white/10" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="h-11 w-20 rounded-full bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-white/10" />
              <div className="mt-3 h-5 w-24 rounded bg-slate-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
        <div className="mt-5 h-2 w-full rounded-full bg-slate-100 dark:bg-white/10" />
      </div>
    </div>
  );
}

function SummaryCard({ title, value, sub, accent = "from-sky-500 to-indigo-600", icon = "wallet", hideOnMobile = false }) {
  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] sm:p-5",
        hideOnMobile && "hidden sm:block"
      )}
    >
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-15 transition group-hover:scale-110`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs">
            {title}
          </div>
          <div className="mt-2 break-words text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </div>
          {sub ? <div className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{sub}</div> : null}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-sm sm:h-11 sm:w-11`}>
          <Icon name={icon} className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
      : tone === "rose"
        ? "border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
        : tone === "sky"
          ? "border-sky-100 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100"
          : tone === "violet"
            ? "border-violet-100 bg-violet-50 text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100"
            : "border-slate-100 bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100";

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border p-2.5 sm:p-3 ${toneClass}`}>
      <div className="truncate text-[10px] font-bold uppercase tracking-wide opacity-75 sm:text-[11px]">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-black leading-5 sm:text-base">
        {value}
      </div>
    </div>
  );
}

function WalletPersonCard({ user, maxAbsNet }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const income = safeNumber(user.income);
  const paid = safeNumber(user.paidExpense);
  const share = safeNumber(user.shareExpense);
  const transferIn = safeNumber(user.transferIn);
  const transferOut = safeNumber(user.transferOut);
  const transferNet = safeNumber(user.transferNet);
  const net = safeNumber(user.net);
  const remaining = safeNumber(user.remaining ?? income - share + transferNet);

  const netPositive = net >= 0;
  const pct = Math.round((Math.abs(net) / Math.max(1, maxAbsNet)) * 100);
  const shareCoverage = share > 0 ? Math.min(100, Math.round((paid / share) * 100)) : paid > 0 ? 100 : 0;

  return (
    <article className="wallet-card group relative w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] sm:p-5 lg:hover:-translate-y-0.5">
      <div className={`absolute -right-14 -top-14 h-36 w-36 rounded-full ${netPositive ? "bg-emerald-100 dark:bg-emerald-400/10" : "bg-rose-100 dark:bg-rose-400/10"} opacity-80 transition lg:group-hover:scale-110`} />
      <div className="relative min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`hidden h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black text-white shadow-sm sm:grid ${netPositive ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-rose-500 to-pink-600"}`}>
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="break-words text-base font-black text-slate-950 dark:text-white sm:text-lg">{user.name}</h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:mt-1">
                {netPositive ? "Paid more than personal share" : "Needs to balance the month"}
              </p>
            </div>
          </div>

          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black sm:px-3 sm:py-1.5 sm:text-xs ${statusClasses(net)}`}>
            Net {netPositive ? "+" : ""}{formatMoney(net)}
          </span>
        </div>

        <div className="mt-3 rounded-3xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:mt-5 sm:p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs">Remaining Balance</div>
              <div className="mt-1 break-words text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{formatMoney(remaining)}</div>
            </div>
            <div className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:block">
              Share coverage: <b className="text-slate-900 dark:text-white">{shareCoverage}%</b>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-2.5 dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200 sm:text-[11px]">Inflow</div>
              <div className="mt-1 break-words text-sm font-black text-emerald-900 dark:text-emerald-100 sm:text-base">{formatMoney(income + transferIn)}</div>
            </div>
            <div className="hidden h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-xs font-black text-white dark:bg-white dark:text-slate-950 sm:grid">VS</div>
            <div className="rounded-2xl border border-rose-100 bg-white p-2.5 dark:border-rose-400/20 dark:bg-rose-400/10 sm:p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-200 sm:text-[11px]">Outflow</div>
              <div className="mt-1 break-words text-sm font-black text-rose-900 dark:text-rose-100 sm:text-base">{formatMoney(share + transferOut)}</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:hidden"
        >
          {detailsOpen ? "Hide detailed values" : "Show detailed values"}
          <Icon name="chevron" className={cx("h-4 w-4 transition", detailsOpen && "rotate-180")} />
        </button>

        <div className={cx("wallet-details-grid mt-3 w-full max-w-full min-w-0 grid-cols-1 gap-2 overflow-hidden sm:mt-4 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3", detailsOpen ? "grid" : "hidden")}>
          <MiniMetric label="Income" value={formatMoney(income)} tone="emerald" />
          <MiniMetric label="Paid Expense" value={formatMoney(paid)} tone="violet" />
          <MiniMetric label="Expense Share" value={formatMoney(share)} tone="rose" />
          <MiniMetric label="Transfer In" value={formatMoney(transferIn)} tone="sky" />
          <MiniMetric label="Transfer Out" value={formatMoney(transferOut)} tone="rose" />
          <MiniMetric label="Transfer Net" value={formatMoney(transferNet)} tone={transferNet >= 0 ? "emerald" : "rose"} />
        </div>

        <div className="mt-4 hidden sm:block">
          <div className="mb-1 flex justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Net impact</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${netPositive ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-pink-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 hidden rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 lg:block">
          Same-owner transfers are ignored for personal settlement. Cross-owner transfers reduce one person and increase the other.
        </div>
      </div>
    </article>
  );
}

function QuickInsight({ topSurplus, topDeficit }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Quick Insights</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Fast settlement signals for this month.</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
          <Icon name="wallet" className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Highest Surplus</div>
          <div className="mt-1 flex items-center justify-between gap-3 text-sm">
            <span className="break-words font-bold text-emerald-950 dark:text-emerald-100">{topSurplus?.name || "-"}</span>
            <span className="font-black text-emerald-950 dark:text-emerald-100">{formatMoney(topSurplus?.net || 0)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 dark:border-rose-400/20 dark:bg-rose-400/10">
          <div className="text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-200">Highest Deficit</div>
          <div className="mt-1 flex items-center justify-between gap-3 text-sm">
            <span className="break-words font-bold text-rose-950 dark:text-rose-100">{topDeficit?.name || "-"}</span>
            <span className="font-black text-rose-950 dark:text-rose-100">{formatMoney(topDeficit?.net || 0)}</span>
          </div>
        </div>
        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 sm:block">
          Use the settlement suggestion to balance shared expenses after cross-owner transfers.
        </div>
      </div>
    </section>
  );
}

function SettlementCard({ data, nameById }) {
  if (!data) return null;

  if (!data?.settlement) {
    return (
      <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100 sm:p-5">
        <div className="font-black">No settlement needed</div>
        <div className="mt-1">This month already looks balanced based on the available wallet summary.</div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-4 shadow-sm dark:border-amber-400/20 dark:from-amber-400/10 dark:via-orange-400/10 dark:to-white/[0.04] sm:p-5">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-200/40 blur-2xl dark:bg-amber-400/10" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-400/20 dark:bg-white/10 dark:text-amber-100 sm:text-xs">
          Settlement Suggestion
        </div>
        <h4 className="mt-3 text-lg font-black text-amber-950 dark:text-white sm:text-xl">Quick way to balance this month</h4>
        <p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-100/80 sm:text-sm">
          This suggestion uses the calculated net position of each member.
        </p>

        <div className="mt-4 rounded-3xl border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-400/20 dark:bg-slate-950/50 sm:p-4">
          <p className="break-words text-sm leading-7 text-slate-700 dark:text-slate-200">
            <span className="rounded-full bg-rose-50 px-2.5 py-1 font-black text-rose-700 dark:bg-rose-400/10 dark:text-rose-100">
              {nameById.get(String(data.settlement.fromUserId)) || `User ${data.settlement.fromUserId}`}
            </span>{" "}
            should pay{" "}
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100">
              {nameById.get(String(data.settlement.toUserId)) || `User ${data.settlement.toUserId}`}
            </span>{" "}
            <span className="font-black text-slate-950 dark:text-white">{formatMoney(data.settlement.amount)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Wallet() {
  const [month, setMonth] = useState(monthNow());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get("/api/wallet/summary", { params: { month } });
      setData(res.data);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load wallet summary");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const nameById = useMemo(() => {
    const m = new Map();
    (data?.users || []).forEach((u) => m.set(String(u.userId), u.name));
    return m;
  }, [data]);

  const users = data?.users || [];

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => String(u.name || "").toLowerCase().includes(q));
  }, [users, search]);

  const totals = useMemo(() => {
    const initial = {
      income: 0,
      paid: 0,
      share: 0,
      transferIn: 0,
      transferOut: 0,
      transferNet: 0,
      remaining: 0,
      surplus: 0,
      deficit: 0,
    };

    users.forEach((u) => {
      const income = safeNumber(u.income);
      const paid = safeNumber(u.paidExpense);
      const share = safeNumber(u.shareExpense);
      const transferIn = safeNumber(u.transferIn);
      const transferOut = safeNumber(u.transferOut);
      const transferNet = safeNumber(u.transferNet);
      const net = safeNumber(u.net);
      const remaining = safeNumber(u.remaining ?? income - share + transferNet);

      initial.income += income;
      initial.paid += paid;
      initial.share += share;
      initial.transferIn += transferIn;
      initial.transferOut += transferOut;
      initial.transferNet += transferNet;
      initial.remaining += remaining;
      if (net >= 0) initial.surplus += net;
      else initial.deficit += Math.abs(net);
    });

    return initial;
  }, [users]);

  const maxAbsNet = useMemo(() => {
    if (!users.length) return 1;
    return Math.max(...users.map((u) => Math.abs(safeNumber(u.net))), 1);
  }, [users]);

  const topSurplus = useMemo(() => {
    if (!users.length) return null;
    return [...users].sort((a, b) => safeNumber(b.net) - safeNumber(a.net))[0];
  }, [users]);

  const topDeficit = useMemo(() => {
    if (!users.length) return null;
    return [...users].sort((a, b) => safeNumber(a.net) - safeNumber(b.net))[0];
  }, [users]);

  return (
    <AppLayout>
      <main className="wallet-page min-h-[calc(100vh-64px)] w-full max-w-none min-w-0 overflow-x-hidden bg-slate-50 px-2 py-3 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4">
        <div className="w-full max-w-none min-w-0 space-y-3 sm:space-y-5">
          <section className="relative w-full max-w-none min-w-0 overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-950 via-sky-900 to-indigo-900 p-4 text-white shadow-xl dark:border dark:border-white/10 sm:rounded-[2rem] sm:p-7">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 hidden w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-sky-100 backdrop-blur sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Owner-aware wallet summary
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Wallet Summary</h2>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-sky-100 sm:text-base sm:leading-6">
                  Track personal remaining balance and settlement for {shortMonth(month)}.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-[420px]">
                <label
                  onClick={openNativePicker}
                  className="cursor-pointer rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur sm:p-3"
                >
                  <span className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-sky-100 sm:text-xs">
                    <Icon name="calendar" className="h-3.5 w-3.5" /> Month
                  </span>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    onClick={(e) => {
                      e.currentTarget.focus();
                      e.currentTarget.showPicker?.();
                    }}
                    className="w-full min-w-0 cursor-pointer bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] sm:text-base"
                    aria-label="Select month"
                  />
                </label>

                <button
                  onClick={load}
                  disabled={loading}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[58px] sm:text-sm lg:hover:-translate-y-0.5"
                >
                  <Icon name="refresh" className={cx("h-4 w-4", loading && "animate-spin")} />
                  {loading ? "Refreshing" : "Refresh"}
                </button>
              </div>
            </div>
          </section>

          {err && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
              <div className="font-black">Couldn’t load data</div>
              <div className="mt-1 break-words text-sm">{err}</div>
            </div>
          )}

          <section className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Total Income" value={formatMoney(totals.income)} sub={shortMonth(month)} icon="arrowUp" accent="from-emerald-500 to-teal-600" />
            <SummaryCard title="Expense Share" value={formatMoney(totals.share)} sub="Split-aware total share" icon="arrowDown" accent="from-rose-500 to-pink-600" />
            <SummaryCard title="Remaining" value={formatMoney(totals.remaining)} sub="Income − share + transfer net" icon="wallet" accent="from-sky-500 to-indigo-600" />
            <SummaryCard title="Settlement Gap" value={formatMoney(Math.max(totals.surplus, totals.deficit))} sub="Amount needed to balance" icon="swap" accent="from-amber-500 to-orange-600" />
          </section>

          <section className="w-full max-w-none min-w-0 rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:rounded-[2rem] sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">Individual Wallet</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  Member-wise remaining balance and settlement status.
                </p>
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-400/40 dark:focus:ring-sky-400/10"
                />
              </div>
            </div>

            <div className="grid w-full max-w-none min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
              {loading && !data ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : !data ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 xl:col-span-2">
                  No wallet data yet. Add income, expenses, or transfer entries first.
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 xl:col-span-2">
                  No member matched your search.
                </div>
              ) : (
                filteredUsers.map((u) => <WalletPersonCard key={u.userId} user={u} maxAbsNet={maxAbsNet} />)
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <SettlementCard data={data} nameById={nameById} />
            <QuickInsight topSurplus={topSurplus} topDeficit={topDeficit} />
          </section>

          <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] lg:block">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Monthly Flow Overview</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Total money movement for {shortMonth(month)} from the wallet summary data.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniMetric label="Paid Expenses" value={formatMoney(totals.paid)} tone="violet" />
              <MiniMetric label="Transfer In" value={formatMoney(totals.transferIn)} tone="sky" />
              <MiniMetric label="Transfer Out" value={formatMoney(totals.transferOut)} tone="rose" />
              <MiniMetric label="Transfer Net" value={formatMoney(totals.transferNet)} tone={totals.transferNet >= 0 ? "emerald" : "rose"} />
            </div>
          </section>

          <div className="h-6" />
        </div>
      </main>
    </AppLayout>
  );
}
