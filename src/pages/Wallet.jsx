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


function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultDateForMonth(month) {
  const today = todayYMD();
  if (month && today.startsWith(month)) return today;
  return month ? `${month}-01` : today;
}

function toLocalYMD(dateLike) {
  if (!dateLike) return todayYMD();
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return todayYMD();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v._id || v.id || "");
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


function SettlementCenter({ data, nameById, accounts, month, onSaved, topSurplus, topDeficit }) {
  const users = data?.users || [];
  const suggested = data?.settlement || null;
  const settlementSummary = data?.settlementSummary || [];
  const settlementTotals = data?.settlementTotals || {};
  const settlements = data?.settlements || [];

  const [mode, setMode] = useState("wallet");
  const [form, setForm] = useState({
    date: defaultDateForMonth(month),
    fromUserId: "",
    toUserId: "",
    amount: "",
    fromAccountId: "",
    toAccountId: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(String(u.userId), u));
    return m;
  }, [users]);

  const normalAccounts = useMemo(() => {
    return (accounts || []).filter((a) => {
      const type = String(a?.type || "").toLowerCase();
      return a?.isActive !== false && ["cash", "bank", "wallet"].includes(type);
    });
  }, [accounts]);

  function memberName(userId) {
    return nameById.get(String(userId)) || userById.get(String(userId))?.name || "Member";
  }

  function accountLabel(account) {
    if (!account) return "";
    const owner = account.owner ? ` (${account.owner})` : "";
    return `${account.name || "Account"}${owner}`;
  }

  function accountMatchesUser(account, userId) {
    const owner = String(account?.owner || "").trim().toLowerCase();
    if (!owner || owner === "joint") return false;

    const name = memberName(userId).trim().toLowerCase();
    const parts = name.split(/\s+/).filter(Boolean);

    return name.includes(owner) || owner.includes(name) || parts.some((part) => owner.includes(part) || part.includes(owner));
  }

  function accountOptionsForUser(userId) {
    const matched = normalAccounts.filter((account) => accountMatchesUser(account, userId));
    return matched.length ? matched : normalAccounts;
  }

  const fromAccountOptions = useMemo(
    () => accountOptionsForUser(form.fromUserId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalAccounts, form.fromUserId, nameById]
  );

  const toAccountOptions = useMemo(
    () => accountOptionsForUser(form.toUserId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalAccounts, form.toUserId, nameById]
  );

  useEffect(() => {
    if (!users.length) return;

    const suggestedFrom = getId(suggested?.fromUserId);
    const suggestedTo = getId(suggested?.toUserId);

    const defaultFrom = suggestedFrom || String(users[0]?.userId || "");
    const defaultTo = suggestedTo || String(users.find((u) => String(u.userId) !== String(defaultFrom))?.userId || "");
    const suggestedAmount = safeNumber(suggested?.amount);

    setForm((prev) => ({
      ...prev,
      date: prev.date?.startsWith(month) ? prev.date : defaultDateForMonth(month),
      fromUserId: prev.fromUserId || defaultFrom,
      toUserId: prev.toUserId || defaultTo,
      amount: suggestedAmount > 0 && (!prev.amount || safeNumber(prev.amount) === 0) ? String(suggestedAmount) : prev.amount,
    }));
  }, [users, suggested?.fromUserId, suggested?.toUserId, suggested?.amount, month]);

  useEffect(() => {
    if (mode !== "wallet") return;

    setForm((prev) => {
      const fromExists = fromAccountOptions.some((a) => String(a._id) === String(prev.fromAccountId));
      const toExists = toAccountOptions.some((a) => String(a._id) === String(prev.toAccountId));

      return {
        ...prev,
        fromAccountId: fromExists ? prev.fromAccountId : fromAccountOptions[0]?._id || "",
        toAccountId: toExists ? prev.toAccountId : toAccountOptions[0]?._id || "",
      };
    });
  }, [mode, form.fromUserId, form.toUserId, fromAccountOptions, toAccountOptions]);

  function fillSuggestion() {
    if (!suggested) return;
    setForm((prev) => ({
      ...prev,
      fromUserId: getId(suggested.fromUserId),
      toUserId: getId(suggested.toUserId),
      amount: String(safeNumber(suggested.amount)),
    }));
    setMsg("");
  }

  async function saveSettlement() {
    if (saving) return;

    setMsg("");

    const amount = safeNumber(form.amount);
    if (!form.date) return setMsg("Select a settlement date.");
    if (!form.fromUserId || !form.toUserId) return setMsg("Select both members.");
    if (String(form.fromUserId) === String(form.toUserId)) return setMsg("From and To member must be different.");
    if (!amount || amount <= 0) return setMsg("Amount must be greater than 0.");

    if (mode === "wallet") {
      if (!form.fromAccountId || !form.toAccountId) return setMsg("Select both accounts for wallet settlement.");
      if (String(form.fromAccountId) === String(form.toAccountId)) return setMsg("From and To accounts must be different.");
    }

    try {
      setSaving(true);

      await api.post("/api/wallet/settlements", {
        settlementType: mode,
        date: form.date,
        fromUserId: form.fromUserId,
        toUserId: form.toUserId,
        amount,
        fromAccountId: mode === "wallet" ? form.fromAccountId : null,
        toAccountId: mode === "wallet" ? form.toAccountId : null,
        note: form.note,
      });

      setMsg(mode === "wallet" ? "✅ Settlement saved and wallet transfer added to Ledger." : "✅ Past pending issue marked as settled.");
      setForm((prev) => ({ ...prev, amount: "", note: "" }));
      await onSaved?.();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to save settlement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSettlement(id) {
    if (!id) return;
    const ok = window.confirm("Delete this settlement record? If it created a wallet transfer, that transfer will also be removed.");
    if (!ok) return;

    try {
      setSaving(true);
      await api.delete(`/api/wallet/settlements/${id}`);
      setMsg("Settlement deleted.");
      await onSaved?.();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to delete settlement.");
    } finally {
      setSaving(false);
    }
  }

  const requiredTotal = safeNumber(settlementTotals.requiredTotal);
  const monthlySettled = safeNumber(settlementTotals.monthlySettled);
  const pendingTotal = safeNumber(settlementTotals.pendingTotal);
  const pastPendingSettled = safeNumber(settlementTotals.pastPendingSettled);

  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:rounded-[2rem] sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100">
            Settlement Center
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white sm:text-xl">Settle balances for {shortMonth(month)}</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
            Wallet settlement creates a real transfer, so wallet balance and Ledger transfer list will change. Past pending settlement only records that an older outside-app issue is settled.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Insights</div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Fast settlement signal for this month.</p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
              <Icon name="wallet" className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2.5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Highest Surplus</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <span className="break-words font-bold text-emerald-950 dark:text-emerald-100">{topSurplus?.name || "-"}</span>
                <span className="shrink-0 font-black text-emerald-950 dark:text-emerald-100">{formatMoney(topSurplus?.net || 0)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-2.5 dark:border-rose-400/20 dark:bg-rose-400/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-200">Highest Deficit</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <span className="break-words font-bold text-rose-950 dark:text-rose-100">{topDeficit?.name || "-"}</span>
                <span className="shrink-0 font-black text-rose-950 dark:text-rose-100">{formatMoney(topDeficit?.net || 0)}</span>
              </div>
            </div>
          </div>

          {suggested ? (
            <button
              type="button"
              onClick={fillSuggestion}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Use suggestion: {formatMoney(suggested.amount)}
            </button>
          ) : (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
              Monthly settlement settled
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MiniMetric label="Total Required" value={formatMoney(requiredTotal)} tone="violet" />
        <MiniMetric label="Wallet Settled" value={formatMoney(monthlySettled)} tone="emerald" />
        <MiniMetric label="Still Pending" value={formatMoney(pendingTotal)} tone={pendingTotal > 0 ? "rose" : "emerald"} />
        <MiniMetric label="Past Marked" value={formatMoney(pastPendingSettled)} tone="sky" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setMode("wallet")}
              className={cx(
                "rounded-xl px-3 py-2 text-xs font-black transition",
                mode === "wallet"
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
              )}
            >
              Wallet Settlement
            </button>
            <button
              type="button"
              onClick={() => setMode("past_pending")}
              className={cx(
                "rounded-xl px-3 py-2 text-xs font-black transition",
                mode === "past_pending"
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
              )}
            >
              Past Pending
            </button>
          </div>

          <div className={cx(
            "mt-3 rounded-2xl border p-3 text-xs leading-5",
            mode === "wallet"
              ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
          )}>
            {mode === "wallet"
              ? "Use this when money actually moved from one member/account to another. It will appear as a Transfer in Ledger."
              : "Use this for older cash issues that were never added to the app. It will not change wallet amount or Ledger."}
          </div>

          <div className="mt-4 grid gap-3">
            <label>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:[color-scheme:dark] dark:focus:ring-violet-400/10"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">From / Payer</span>
                <select
                  value={form.fromUserId}
                  onChange={(e) => setForm({ ...form, fromUserId: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                >
                  <option value="">Select payer</option>
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>{u.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">To / Receiver</span>
                <select
                  value={form.toUserId}
                  onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                >
                  <option value="">Select receiver</option>
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>{u.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {mode === "wallet" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">From Account</span>
                  <select
                    value={form.fromAccountId}
                    onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                  >
                    <option value="">Select account</option>
                    {fromAccountOptions.map((a) => (
                      <option key={a._id} value={a._id}>{accountLabel(a)}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">To Account</span>
                  <select
                    value={form.toAccountId}
                    onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                  >
                    <option value="">Select account</option>
                    {toAccountOptions.map((a) => (
                      <option key={a._id} value={a._id}>{accountLabel(a)}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <label>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Enter settlement amount"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-violet-400/10"
              />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Optional Note</span>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={mode === "wallet" ? "Example: May shared expense settlement" : "Example: old cash borrowed before using app"}
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-violet-400/10"
              />
            </label>

            {msg ? (
              <div className={cx(
                "rounded-2xl border px-3 py-2 text-xs font-bold",
                msg.startsWith("✅") || msg === "Settlement deleted."
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
              )}>
                {msg}
              </div>
            ) : null}

            <button
              type="button"
              onClick={saveSettlement}
              disabled={saving || !data}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving settlement..." : mode === "wallet" ? "Settle & Add Transfer" : "Mark Past Issue Settled"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/40">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">Per-person settlement status</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Green means settled. Red means still pending.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Pay</th>
                    <th className="px-4 py-3">Receive</th>
                    <th className="px-4 py-3">Settled</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {settlementSummary.length ? settlementSummary.map((row) => {
                    const pending = safeNumber(row.pendingPay) + safeNumber(row.pendingReceive);
                    const settled = safeNumber(row.settledPaid) + safeNumber(row.settledReceived);
                    const done = row.status === "settled";
                    return (
                      <tr key={row.userId} className="text-slate-700 dark:text-slate-200">
                        <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{row.name}</td>
                        <td className="px-4 py-3">{formatMoney(row.shouldPay)}</td>
                        <td className="px-4 py-3">{formatMoney(row.shouldReceive)}</td>
                        <td className="px-4 py-3">{formatMoney(settled)}</td>
                        <td className="px-4 py-3 font-black">{formatMoney(pending)}</td>
                        <td className="px-4 py-3">
                          <span className={cx(
                            "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                            done
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-400/20"
                              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-100 dark:ring-rose-400/20"
                          )}>
                            {done ? "Settled" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-5 text-center text-slate-500 dark:text-slate-400">No settlement data yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/40">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">Settlement history</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Wallet settlements are real transfers; past pending records are informational only.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {settlements.length ? settlements.map((item) => (
                    <tr key={item._id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 font-bold text-slate-950 dark:text-white">
                        {memberName(getId(item.fromUserId))} → {memberName(getId(item.toUserId))}
                      </td>
                      <td className="px-4 py-3 font-black">{formatMoney(item.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={cx(
                          "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1",
                          item.settlementType === "wallet"
                            ? "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-100 dark:ring-sky-400/20"
                            : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:ring-amber-400/20"
                        )}>
                          {item.settlementType === "wallet" ? "Wallet" : "Past"}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-slate-500 dark:text-slate-400">{item.note || "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteSettlement(item._id)}
                          disabled={saving}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-5 text-center text-slate-500 dark:text-slate-400">No settlement history for this month.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
  const [accounts, setAccounts] = useState([]);

  async function load() {
    try {
      setErr("");
      setLoading(true);

      const [summaryRes, accountsRes] = await Promise.all([
        api.get("/api/wallet/summary", { params: { month } }),
        api.get("/api/accounts"),
      ]);

      setData(summaryRes.data);
      setAccounts(accountsRes.data.items || []);
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
            <SummaryCard title="Settlement Gap" value={formatMoney(data?.settlementTotals?.pendingTotal ?? Math.max(totals.surplus, totals.deficit))} sub="Pending after recorded settlements" icon="swap" accent="from-amber-500 to-orange-600" />
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

          <SettlementCenter
            data={data}
            nameById={nameById}
            accounts={accounts}
            month={month}
            onSaved={load}
            topSurplus={topSurplus}
            topDeficit={topDeficit}
          />

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
