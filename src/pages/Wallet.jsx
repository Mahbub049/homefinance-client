import HFPageLead from "../components/design/HFPageLead";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(v) {
  const n = Number(v || 0);
  const formatted = Math.abs(n).toLocaleString("bn-BD", { maximumFractionDigits: 2 });
  return n < 0 ? `-৳ ${formatted}` : `৳ ${formatted}`;
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
  return date.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
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

function MonthlyRemainingPanel({ month, monthlyCashFlow, accountStatus }) {
  const summary = monthlyCashFlow?.household;
  const issueCount = monthlyCashFlow?.issues?.length || 0;
  const ready = !!summary && accountStatus === 'ok' && issueCount === 0;
  return <section className="hf-v2-wallet-month">
    <div><span className="hf-v2-eyebrow">{shortMonth(month)} · মাসের আয় থেকে</span><h2>এই মাসে বাকি</h2><strong className={safeNumber(summary?.remainingFromMonth)<0?'hf-v2-negative':''}>{ready ? formatMoney(summary.remainingFromMonth) : 'হিসাব যাচাই করুন'}</strong><p>আগের মাসের জমা টাকা এখানে যোগ করা হয়নি।</p></div>
    {summary && <div className="hf-v2-wallet-month-parts">
      <div><span>আয়</span><b>{formatMoney(summary.income)}</b></div>
      <div><span>পরিশোধিত খরচ</span><b>{formatMoney(summary.expenses)}</b></div>
      <div><span>সঞ্চয়ে জমা</span><b>{formatMoney(summary.savedOrInvested)}</b></div>
      {safeNumber(summary.savingsWithdrawn)>0 && <div><span>সঞ্চয় থেকে তোলা</span><b>{formatMoney(summary.savingsWithdrawn)}</b></div>}
    </div>}
    {!!issueCount && <p className="hf-v2-inline-warning">{issueCount.toLocaleString('bn-BD')}টি রেকর্ডের হিসাব মিলিয়ে দেখা দরকার।</p>}
  </section>;
}

function WalletPersonCard({ user, maxAbsNet, accountStatus }) {
  const [detailsOpen,setDetailsOpen] = useState(false);
  const net = safeNumber(user.net);
  const m = user.monthlyCashFlow;
  const valid = m && !m.unreconciled;
  return <article className="hf-v2-wallet-person">
    <div className="hf-v2-wallet-person-top"><div><h3>{user.name}</h3><span>এই মাসের ব্যক্তিগত হিসাব</span></div><span className={net<0?'hf-v2-negative':'hf-v2-positive'}>{net<0?'দেবেন':'পাবেন'} {formatMoney(Math.abs(net))}</span></div>
    <div className="hf-v2-wallet-person-big"><span>মাসের আয় থেকে বাকি</span><strong className={safeNumber(m?.remainingFromMonth)<0?'hf-v2-negative':''}>{valid ? formatMoney(m.remainingFromMonth) : 'যাচাই প্রয়োজন'}</strong></div>
    {valid && <div className="hf-v2-wallet-person-breakdown"><div><span>আয়</span><b>{formatMoney(m.income)}</b></div><div><span>পরিশোধ</span><b>{formatMoney(m.expenses)}</b></div><div><span>সঞ্চয়</span><b>{formatMoney(m.savedOrInvested)}</b></div></div>}
    <button type="button" className="hf-v2-person-toggle" onClick={()=>setDetailsOpen(x=>!x)} aria-expanded={detailsOpen}>{detailsOpen?'বিস্তারিত বন্ধ করুন':'খরচ ও অ্যাকাউন্টের বিস্তারিত দেখুন'} <Icon name="chevron" className={cx('h-4 w-4',detailsOpen&&'rotate-180')}/></button>
    {detailsOpen && <div className="hf-v2-wallet-person-details">
      <div><span>সাধারণ খরচ দিয়েছেন</span><b>{formatMoney(user.paidExpense)}</b></div>
      <div><span>সাধারণ খরচে নিজের ভাগ</span><b>{formatMoney(user.shareExpense)}</b></div>
      <div><span>অ্যাকাউন্টে মোট টাকা (আগের মাসসহ)</span><b>{user.availableCash==null?'যাচাই প্রয়োজন':formatMoney(user.availableCash)}</b></div>
      <div><span>বড় কেনাকাটায় দেওয়া বাকি</span><b>{formatMoney(user.sharedPurchaseDue)}</b></div>
      <div><span>বড় কেনাকাটায় পাওনা</span><b>{formatMoney(user.sharedPurchaseReceivable)}</b></div>
    </div>}
  </article>;
}

function SettlementCenter({ data, nameById, accounts, month, onSaved, topSurplus, topDeficit }) {
  const users = data?.users || [];
  const managedDue = users.reduce((sum, row) => sum + safeNumber(row.sharedPurchaseDue), 0);
  const mustPaySharedFirst = managedDue > 0.009;
  const reconciliationBlocked = Number(data?.financialReconciliation?.blocking || 0) > 0;

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
  // Reuse one key when retrying the exact same submission after a lost response.
  const settlementRequest = useRef(null);

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(String(u.userId), u));
    return m;
  }, [users]);

  const normalAccounts = useMemo(() => {
    return (accounts || []).filter((a) => {
      const type = String(a?.type || "").toLowerCase();
      return a?.isActive !== false && ["cash", "bank", "wallet"].includes(type) &&
        a?.owner !== "Joint" && !/credit\s*card/i.test(String(a?.name || ""));
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
    // Never silently fall back to another person's bank account.
    return matched;
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
    if (!suggested || mustPaySharedFirst || reconciliationBlocked) return;
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
      if (mustPaySharedFirst) return setMsg("Record all due Shared & Large Purchase installments first, then refresh Wallet. This avoids duplicate repayments.");
      if (reconciliationBlocked) return setMsg("Financial reconciliation has blocking issues. Review them before settling ordinary expenses.");
      if (!form.fromAccountId || !form.toAccountId) return setMsg("Select both accounts for wallet settlement.");
      if (String(form.fromAccountId) === String(form.toAccountId)) return setMsg("From and To accounts must be different.");
    }

    try {
      setSaving(true);

      const payload = {
        settlementType: mode,
        date: form.date,
        fromUserId: form.fromUserId,
        toUserId: form.toUserId,
        amount,
        fromAccountId: mode === "wallet" ? form.fromAccountId : null,
        toAccountId: mode === "wallet" ? form.toAccountId : null,
        note: form.note,
      };
      const signature = JSON.stringify(payload);
      if (!settlementRequest.current || settlementRequest.current.signature !== signature) {
        settlementRequest.current = {
          signature,
          key: globalThis.crypto?.randomUUID?.() || `wallet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
      }
      const response = await api.post("/api/wallet/settlements", payload, {
        headers: { "Idempotency-Key": settlementRequest.current.key },
      });
      settlementRequest.current = null;
      setMsg(response.data?.replayed
        ? "✅ This settlement was already saved. No duplicate transfer was created."
        : mode === "wallet" ? "✅ Settlement and bank transfer saved together." : "✅ Past pending issue marked as settled.");
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
  const sharedPurchaseSettled = safeNumber(settlementTotals.sharedPurchaseSettled);
  const walletSettled = safeNumber(settlementTotals.walletSettled);
  const pendingTotal = safeNumber(settlementTotals.pendingTotal);
  const pastPendingSettled = safeNumber(settlementTotals.pastPendingSettled);

  return (
    <section className="hf-hishab-settlement-section">
      <div className="hf-hishab-settlement-head">
        <div><span className="hf-v2-eyebrow">দেনা-পাওনা</span><h2>মাস শেষে কে কাকে দেবেন?</h2>
        <p>সাধারণ খরচ এবং বড় কেনাকাটার বকেয়া একসঙ্গে হিসাব করা হয়েছে।</p></div>
        <strong>{formatMoney(pendingTotal)}</strong>
      </div>
      {topDeficit && topSurplus && safeNumber(topDeficit.net) < -0.009 && <div className="hf-hishab-settlement-direction"><b>{topDeficit.name}</b><span>দেবেন →</span><b>{topSurplus.name}</b></div>}
      {mustPaySharedFirst && <div className="hf-hishab-settlement-info">
        <div><b>বড় কেনাকাটার বকেয়া: {formatMoney(managedDue)}</b><p>এই টাকা উপরের মোট দেনা-পাওনায় অন্তর্ভুক্ত। আগে “ভাগ করে কেনাকাটা” থেকে টাকা দেওয়ার রেকর্ড করুন। তারপর এখানকার বাকি টাকা মেটাতে পারবেন—দুই জায়গায় একই টাকা পাঠাবেন না।</p></div>
        <a className="hf-v2-btn hf-v2-btn--main" href="/shared-purchases">বকেয়া পরিশোধ করুন</a>
      </div>}
      <details className="hf-hishab-settlement-details">
        <summary>{mustPaySharedFirst ? 'অন্য দেনা-পাওনার বিস্তারিত দেখুন' : 'টাকা মেটানোর ফর্ম খুলুন'}</summary>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100">
            দেনা-পাওনা
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white sm:text-xl">মাসের দেনা-পাওনা: {shortMonth(month)}</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
            সাধারণ খরচের পার্থক্য ও বড় কেনাকাটার বাকি টাকা এখানে একসঙ্গে দেখানো হয়। বড় কেনাকাটার টাকা দিলে সেটি আবার আলাদা করে দেবেন না।
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">দ্রুত তথ্য</div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">এই মাসে কে কাকে টাকা দেবেন</p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
              <Icon name="wallet" className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2.5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-200">সবচেয়ে বেশি পাবেন</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <span className="break-words font-bold text-emerald-950 dark:text-emerald-100">{topSurplus?.name || "-"}</span>
                <span className="shrink-0 font-black text-emerald-950 dark:text-emerald-100">{formatMoney(topSurplus?.net || 0)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-2.5 dark:border-rose-400/20 dark:bg-rose-400/10">
              <div className="text-[10px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-200">সবচেয়ে বেশি দেবেন</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <span className="break-words font-bold text-rose-950 dark:text-rose-100">{topDeficit?.name || "-"}</span>
                <span className="shrink-0 font-black text-rose-950 dark:text-rose-100">{formatMoney(topDeficit?.net || 0)}</span>
              </div>
            </div>
          </div>

          {suggested && !mustPaySharedFirst ? (
            <button
              type="button"
              onClick={fillSuggestion}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              এই পরিমাণ দিন: {formatMoney(suggested.amount)}
            </button>
          ) : mustPaySharedFirst ? (
            <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-black text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              আগে বড় কেনাকাটার বকেয়া পরিশোধ করুন
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
              এই মাসের হিসাব মিটেছে
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <MiniMetric label="মোট দিতে হবে" value={formatMoney(requiredTotal)} tone="violet" />
        <MiniMetric label="কেনাকাটার টাকা ফেরত" value={formatMoney(sharedPurchaseSettled)} tone="sky" />
        <MiniMetric label="মিটিয়ে দেওয়া হয়েছে" value={formatMoney(walletSettled || monthlySettled)} tone="emerald" />
        <MiniMetric label="এখনও বাকি" value={formatMoney(pendingTotal)} tone={pendingTotal > 0 ? "rose" : "emerald"} />
        <MiniMetric label="আগে মেটানো" value={formatMoney(pastPendingSettled)} tone="sky" />
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
              টাকা মিটিয়ে দিন
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
              আগের বকেয়া
            </button>
          </div>

          {mode === "wallet" && reconciliationBlocked && (
            <div role="alert" className="mt-3 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
              Wallet settlement is temporarily disabled because cash or expense records do not reconcile. See the Financial consistency check above. This prevents recording a transfer against an unreliable balance.
            </div>
          )}
          {mode === "wallet" && mustPaySharedFirst && (
            <div role="alert" className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
              এই মুহূর্তে দেনা-পাওনা মেটানো বন্ধ, কারণ {formatMoney(managedDue)} of Shared & Large Purchase repayments remain due (including prior months). Record the repayment in Shared & Large Purchases first and refresh Wallet. এতে একই টাকা দুবার দেওয়ার হিসাব হয় না।
            </div>
          )}
          <div className={cx(
            "mt-3 rounded-2xl border p-3 text-xs leading-5",
            mode === "wallet"
              ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
          )}>
            {mode === "wallet"
              ? "Use this only for the remaining final settlement shown here. Shared & Large Purchase Record Payments are included automatically, so do not pay the same obligation twice."
              : "Use this for older cash issues that were never added to the app. It will not change wallet amount or Ledger."}
          </div>

          <div className="mt-4 grid gap-3">
            <label>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">তারিখ</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:[color-scheme:dark] dark:focus:ring-violet-400/10"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">টাকা দেবেন</span>
                <select
                  value={form.fromUserId}
                  onChange={(e) => setForm({ ...form, fromUserId: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                >
                  <option value="">যিনি দেবেন</option>
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>{u.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">টাকা পাবেন</span>
                <select
                  value={form.toUserId}
                  onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                >
                  <option value="">যিনি পাবেন</option>
                  {users.map((u) => (
                    <option key={u.userId} value={u.userId}>{u.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {mode === "wallet" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">যে অ্যাকাউন্ট থেকে</span>
                  <select
                    value={form.fromAccountId}
                    onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                  >
                    <option value="">অ্যাকাউন্ট বাছুন</option>
                    {fromAccountOptions.map((a) => (
                      <option key={a._id} value={a._id}>{accountLabel(a)}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">যে অ্যাকাউন্টে</span>
                  <select
                    value={form.toAccountId}
                    onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:ring-violet-400/10"
                  >
                    <option value="">অ্যাকাউন্ট বাছুন</option>
                    {toAccountOptions.map((a) => (
                      <option key={a._id} value={a._id}>{accountLabel(a)}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <label>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">টাকা</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="যত টাকা দেবেন"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-violet-400/10"
              />
            </label>

            <label>
              <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">ইচ্ছামতো মন্তব্য</span>
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
              disabled={saving || !data || (mode === "wallet" && (mustPaySharedFirst || reconciliationBlocked))}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving settlement..." : mode === "wallet" ? "Settle & Add Transfer" : "Mark Past Issue Settled"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/40">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">কার কত দেওয়া বাকি</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current position includes regular expenses, unpaid Shared & Large Purchase dues, and verified Wallet settlements.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">সদস্য</th>
                    <th className="px-4 py-3">দিতে হবে</th>
                    <th className="px-4 py-3">পাবেন</th>
                    <th className="px-4 py-3">দেওয়া হয়েছে</th>
                    <th className="px-4 py-3">পাওয়া হয়েছে</th>
                    <th className="px-4 py-3">শেষ হিসাব</th>
                    <th className="px-4 py-3">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {settlementSummary.length ? settlementSummary.map((row) => {
                    const pendingPay = safeNumber(row.pendingPay);
                    const pendingReceive = safeNumber(row.pendingReceive);
                    const done = row.status === "settled";
                    const finalPosition = pendingPay > 0.009
                      ? `Pay ${formatMoney(pendingPay)}`
                      : pendingReceive > 0.009
                        ? `Receive ${formatMoney(pendingReceive)}`
                        : "Balanced";
                    return (
                      <tr key={row.userId} className="text-slate-700 dark:text-slate-200">
                        <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{row.name}</td>
                        <td className="px-4 py-3">{formatMoney(row.shouldPay)}</td>
                        <td className="px-4 py-3">{formatMoney(row.shouldReceive)}</td>
                        <td className="px-4 py-3">{formatMoney(row.settledPaid)}</td>
                        <td className="px-4 py-3">{formatMoney(row.settledReceived)}</td>
                        <td className="px-4 py-3 font-black">{finalPosition}</td>
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
                      <td colSpan="7" className="px-4 py-5 text-center text-slate-500 dark:text-slate-400">এখনও দেনা-পাওনার তথ্য নেই।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/40">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">দেনা-পাওনার ইতিহাস</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">দেনা-পাওনা মেটালে বাস্তবে এক অ্যাকাউন্ট থেকে অন্যটিতে টাকা যাবে।</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">তারিখ</th>
                    <th className="px-4 py-3">কে কাকে</th>
                    <th className="px-4 py-3">টাকা</th>
                    <th className="px-4 py-3">ধরন</th>
                    <th className="px-4 py-3">মন্তব্য</th>
                    <th className="px-4 py-3">কাজ</th>
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
                          মুছুন
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-5 text-center text-slate-500 dark:text-slate-400">এই মাসে দেনা-পাওনার লেনদেন নেই।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </details>
    </section>
  );
}

export default function Wallet() {
  const [hfMore, setHfMore] = useState(false);
  const [month, setMonth] = useState(monthNow());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showFlows, setShowFlows] = useState(false);

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

  // Missing fields are different from a legitimate zero balance. Do not label
  // an old backend response as "No accounts" or treat untracked cash as zero.
  const monthlyCashFlow = data?.monthlyCashFlow;
  const monthlyFlowIssues = monthlyCashFlow?.issues?.length || 0;
  const accountCashReady = Array.isArray(data?.accountCash?.accounts);
  const liquidAccounts = accountCashReady ? data.accountCash.accounts : [];
  const negativeAccounts = liquidAccounts.filter((account) => safeNumber(account.balance) < -0.009);
  const likelyCreditAccounts = liquidAccounts.filter((account) => /credit\s*card/i.test(String(account.name || "")));
  const accountStatus = !data ? "loading" : !accountCashReady ? "server"
    : liquidAccounts.length === 0 ? "accounts"
      : users.some((user) => user.availableCash == null) ? "owner" : "ok";
  const cashDisplay = accountStatus === "loading" ? "—"
    : accountStatus === "server" ? "Backend update needed"
      : accountStatus === "accounts" ? "Set up accounts"
        : formatMoney(data.accountCash.total);

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
      const remaining = safeNumber(u.cashAfterPaid ?? u.remaining ?? income - paid + transferNet);

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
      <div className={`hf-step3-page hf-step3-wallet hf-v2-page hf-v2-wallet ${hfMore ? "hf-step3-expanded" : ""}`}>
        <HFPageLead title="টাকার হিসাব" description="শুধু এই মাসের আয় থেকে কত টাকা বাকি এবং কে কাকে দেবেন" month={month} onMonthChange={setMonth}
          metrics={[]}
          onAdd={undefined} addLabel=""
          addDisabled={false}
          onExtra={undefined} extraLabel=""
          onRefresh={load}
          more={hfMore} onToggleMore={() => setHfMore(v => !v)} />

      <main className="wallet-page min-h-[calc(100vh-64px)] w-full max-w-none min-w-0 overflow-x-hidden bg-slate-50 px-2 py-3 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4">
        <div className="w-full max-w-none min-w-0 space-y-3 sm:space-y-5">
          <></>

          {err && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
              <div className="font-black">তথ্য পাওয়া যায়নি</div>
              <div className="mt-1 break-words text-sm">{err}</div>
            </div>
          )}

          {accountStatus === "server" && (
            <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
              সার্ভারের নতুন হিসাবের তথ্য পাওয়া যাচ্ছে না। সার্ভার আপডেট ও সংযোগ যাচাই করুন। তথ্য না পাওয়া মানে শূন্য টাকা নয়।
            </div>
          )}
          {accountStatus === "accounts" && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              কোনো নগদ বা ব্যাংক অ্যাকাউন্ট পাওয়া যায়নি। সেটিংস থেকে অ্যাকাউন্ট যাচাই করুন; আগের আয় যেন আবার যোগ না হয়।
            </div>
          )}
          {accountStatus === "owner" && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              কিছু অ্যাকাউন্টের মালিক শনাক্ত করা যায়নি। সেটিংস থেকে সদস্য ও অ্যাকাউন্টের মালিক মিলিয়ে নিন।
            </div>
          )}

          {data?.ordinaryExpenseIntegrity?.balanced === false && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              পরিশোধ ও খরচের ভাগে পার্থক্য: {formatMoney(Math.abs(data.ordinaryExpenseIntegrity.discrepancy || 0))}.
              দেনা-পাওনা মেটানোর আগে সংশ্লিষ্ট খরচগুলো যাচাই করুন।
            </div>
          )}

          {data?.accountCash?.issues?.length > 0 && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              অ্যাকাউন্টের হিসাব যাচাই দরকার: {data.accountCash.issues.length} টি সমস্যা পাওয়া গেছে।
              {data.accountCash.staleClosedCount > 0 ? ` ${data.accountCash.staleClosedCount} closed account balance(s) changed after closing.` : ""}
              মিলিয়ে না দেখা পর্যন্ত মোট টাকাকে নিশ্চিত ধরে নেবেন না।
            </div>
          )}

          {data?.financialReconciliation && (
            <section className="hf-step3-advanced rounded-2xl border border-slate-300/70 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70" aria-label="Cross-module financial reconciliation">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">হিসাব মিলিয়ে দেখা হচ্ছে · {month}</h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Compares Ledger shares, settlement obligations, posted cash movements and Carry Forward. Read-only: no historical records are changed.</p>
                </div>
                <span className={cx("rounded-full px-3 py-1 text-xs font-bold",
                  data.financialReconciliation.blocking > 0
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
                    : data.financialReconciliation.review > 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200")}
                >{data.financialReconciliation.blocking > 0 ? "Needs correction" : data.financialReconciliation.review > 0 ? "Review warnings" : "Records agree internally"}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[
                  ["Opening tracked cash", data.financialReconciliation.checks.openingLiquid],
                  ["This month's cash change", data.financialReconciliation.checks.monthCashMovement],
                  ["Expected closing cash", data.financialReconciliation.checks.expectedClosingLiquid],
                  ["Calculated closing cash", data.financialReconciliation.checks.calculatedClosingLiquid],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-2 dark:border-white/10">
                    <div className="text-slate-500 dark:text-slate-400">{label}</div>
                    <div className="mt-1 font-black tabular-nums text-slate-950 dark:text-white">{formatMoney(value)}</div>
                  </div>
                ))}
              </div>
              {data.financialReconciliation.issues?.length > 0 && (
                <details className="mt-3 rounded-xl border border-amber-200 p-3 dark:border-amber-500/20">
                  <summary className="cursor-pointer text-xs font-bold text-amber-800 dark:text-amber-200">
                    যাচাই করুন {data.financialReconciliation.blocking} টি জরুরি এবং {data.financialReconciliation.review} টি সাধারণ সতর্কতা
                  </summary>
                  <ul className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-200">
                    {data.financialReconciliation.issues.slice(0, 30).map((issue, index) => (
                      <li key={`${issue.code}-${issue.transactionId || issue.accountId || index}-${index}`}>
                        <b>{issue.level === "blocking" ? "Correction needed" : "Review"} · {issue.code}:</b> {issue.message}
                      </li>
                    ))}
                    {data.financialReconciliation.issues.length > 30 && <li>আরও বিস্তারিত তথ্য পাওয়া যাবে।</li>}
                  </ul>
                </details>
              )}
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{data.financialReconciliation.disclaimer}</p>
            </section>
          )}

          {data && (
            <>
              <MonthlyRemainingPanel month={month} monthlyCashFlow={monthlyCashFlow} accountStatus={accountStatus} />
              <details className="hf-hishab-wallet-note">
                <summary>বড় কেনাকাটার মাসিক ভাগ দেখুন</summary>
                <div className="hf-hishab-note-inner">
                  <div className="hf-hishab-note-amount"><span>এই মাসে দুজনের নির্ধারিত ভাগ</span><b>{formatMoney(data?.monthlyBudgetAllocation?.scheduledLargePurchaseAllocation)}</b></div>
                  <p>এই টাকা মাসের হিসাবের জন্য নির্ধারিত। কেনার সময় পুরো টাকা ব্যাংক থেকে একবারই বের হয়েছে; এখানে আবার টাকা কাটা হয় না।</p>
                  {(users || []).map(row => <div key={row.userId} className="hf-hishab-detail-row"><span>{row.name}</span><b>{formatMoney(row.scheduledLargePurchaseShare)}</b></div>)}
                  {!!data?.monthlyBudgetAllocation?.issues?.length && <p role="alert">কিছু কেনাকাটার হিসাব যাচাই করা প্রয়োজন।</p>}
                </div>
              </details>
            </>
          )}

          <></>

          {data && <details className="hf-hishab-wallet-note">
            <summary>দেনা-পাওনার হিসাব কীভাবে হয়েছে?</summary>
            <div className="hf-hishab-note-inner">
              <p>সাধারণ খরচে যে যার ভাগের বেশি টাকা দিয়েছেন, অন্যজন সেই অতিরিক্ত টাকা দেবেন। বড় কেনাকাটার যে কিস্তি এখনও দেওয়া হয়নি, সেটিও দেনা-পাওনায় যোগ হয়।</p>
              {topDeficit && topSurplus && safeNumber(topDeficit.net) < -0.009 && <>
                <div className="hf-hishab-detail-row"><span>সাধারণ খরচের পার্থক্য</span><b>{formatMoney(Math.abs(safeNumber(topDeficit.expenseNet)))}</b></div>
                <div className="hf-hishab-detail-row"><span>বড় কেনাকাটার বকেয়া</span><b>{formatMoney(Math.max(0, safeNumber(topDeficit.sharedPurchaseDue) - safeNumber(topDeficit.sharedPurchaseReceivable)))}</b></div>
                <div className="hf-hishab-detail-row"><span>{topDeficit.name} দেবেন {topSurplus.name}-কে</span><b>{formatMoney(Math.abs(safeNumber(topDeficit.net)))}</b></div>
              </>}
              <p>দুজনের মধ্যে টাকা পাঠালে একজনের অ্যাকাউন্ট কমবে ও অন্যজনের বাড়বে। দুজনের মোট টাকা অপরিবর্তিত থাকবে।</p>
            </div>
          </details>}

          <section className="hf-step3-advanced rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">সব অ্যাকাউন্টে মোট টাকা</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Account balances = reconciled opening + real inflows − real outflows. Closed months use their saved closing snapshot.
                  এটি অ্যাপে লেখা লেনদেন থেকে গণনা করা হয়েছে; সরাসরি ব্যাংক থেকে আনা তথ্য নয়।
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-950 dark:text-white">{cashDisplay}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">যৌথ অ্যাকাউন্টে টাকা: {formatMoney(data?.accountCash?.joint)}</div>
              </div>
            </div>
            {data?.accountCash?.anchorMonth && (
              <p className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-300">আগের মাস থেকে আনা: {data.accountCash.anchorMonth} মাস বন্ধের হিসাব অনুযায়ী।</p>
            )}
            {negativeAccounts.length > 0 && (
              <div role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                {negativeAccounts.length} টি অ্যাকাউন্টে ঋণাত্মক টাকা দেখা যাচ্ছে ({negativeAccounts.map((a) => `${a.name}: ${formatMoney(a.balance)}`).join("; ")})। শুরুতে কত ছিল এবং কোনো লেনদেন বাদ গেছে কি না মিলিয়ে নিন।
              </div>
            )}
            {likelyCreditAccounts.length > 0 && (
              <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                ক্রেডিট কার্ড যাচাই করুন ({likelyCreditAccounts.map((a) => a.name).join(", ")}). A credit balance or credit limit is not spendable bank cash; this app currently includes any account marked Bank.
              </div>
            )}
            {liquidAccounts.length > 0 && (
              <button type="button" onClick={() => setShowAccounts((v) => !v)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {showAccounts ? "Hide individual accounts" : `Show individual accounts (${liquidAccounts.length})`}
                <Icon name="chevron" className={cx("h-4 w-4 transition-transform", showAccounts && "rotate-180")} />
              </button>
            )}
            {showAccounts && liquidAccounts.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {data.accountCash.accounts.map((a) => (
                  <div key={String(a.accountId)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{a.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{a.owner} · {a.type}</span>
                    </div>
                    <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatMoney(a.balance)}</div>
                    {a.isActive === false && <span className="text-xs text-amber-700 dark:text-amber-300">বন্ধ অ্যাকাউন্টেও আগের টাকা হিসাবের মধ্যে আছে</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="w-full max-w-none min-w-0 rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:rounded-[2rem] sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">ব্যক্তিগত টাকার হিসাব</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  প্রতিজনের এই মাসে কত টাকা বাকি আছে, নিচে দেখতে পাবেন।
                </p>
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="সদস্য খুঁজুন…"
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
                  এখনও কোনো হিসাব নেই। প্রথমে আয় বা খরচ যোগ করুন।
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 xl:col-span-2">
                  মিলে যায় এমন সদস্য নেই।
                </div>
              ) : (
                filteredUsers.map((u) => <WalletPersonCard key={u.userId} user={{ ...u, monthlyCashFlow: monthlyFlowIssues || accountStatus !== "ok" ? null : u.monthlyCashFlow }} maxAbsNet={maxAbsNet} accountStatus={accountStatus} />)
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

          <button type="button" onClick={() => setShowFlows((v) => !v)} className="hidden w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 lg:flex">
            {showFlows ? "Hide extra transfer calculations" : "View extra monthly transfer calculations"}
            <Icon name="chevron" className={cx("h-4 w-4 transition-transform", showFlows && "rotate-180")} />
          </button>
          {showFlows && <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] lg:block">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">মাসের আয়-খরচের সারাংশ</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  মাসের আয়-খরচের মোট হিসাব: {shortMonth(month)} from the wallet summary data.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniMetric label="পরিশোধিত খরচ" value={formatMoney(totals.paid)} tone="violet" />
              <MiniMetric label="টাকা এসেছে" value={formatMoney(totals.transferIn)} tone="sky" />
              <MiniMetric label="টাকা গেছে" value={formatMoney(totals.transferOut)} tone="rose" />
              <MiniMetric label="টাকা আদান-প্রদানের পার্থক্য" value={formatMoney(totals.transferNet)} tone={totals.transferNet >= 0 ? "emerald" : "rose"} />
            </div>
          </section>}

          <div className="h-6" />
        </div>
      </main>
          </div>
    </AppLayout>
  );
}
