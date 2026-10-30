import HFPageLead from "../components/design/HFPageLead";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(v) {
  const n = Number(v || 0);
  const abs = Math.abs(n).toLocaleString("bn-BD", { maximumFractionDigits: 2 });
  return n < 0 ? `-৳ ${abs}` : `৳ ${abs}`;
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

const COLORS = {
  income: "#22c55e",
  living: "#f43f5e",
  debt: "#f97316",
  investment: "#3b82f6",
  available: "#14b8a6",
  final: "#8b5cf6",
  neutral: "#64748b",
};

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 sm:h-24 sm:w-24" />
      <div className="mb-4 h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mb-4 h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 sm:px-4 sm:py-3 sm:text-sm">
      <div className="mb-2 font-semibold text-slate-950 dark:text-slate-100">{label}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey || item.name} className="flex items-center justify-between gap-5">
            <span className="text-slate-500 dark:text-slate-400">{item.name || item.dataKey}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 sm:px-4 sm:py-3 sm:text-sm">
      <div className="font-semibold text-slate-950 dark:text-slate-100">{label || item?.name}</div>
      <div className="mt-1 text-slate-600 dark:text-slate-300">{formatMoney(item?.value)}</div>
    </div>
  );
}

function CreditCardStatementEditor({ account, month, onSaved }) {
  const [amount, setAmount] = useState(account.outstanding == null ? "" : String(account.outstanding));
  const [note, setNote] = useState(account.note || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setAmount(account.outstanding == null ? "" : String(account.outstanding));
    setNote(account.note || "");
    setMessage("");
  }, [account.accountId, account.outstanding, account.note, month]);

  async function save(e) {
    e.preventDefault();
    if (amount.trim() === "" || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !/^\d+(?:\.\d{1,2})?$/.test(amount.trim())) {
      setMessage("Enter a valid, non-negative bank statement amount (up to 2 decimals).");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/api/credit-card-statements/${encodeURIComponent(account.accountId)}/${encodeURIComponent(month)}`, {
        outstanding: Number(amount), note,
      });
      setMessage("Statement saved. No cash or Ledger entry was created.");
      await onSaved();
    } catch (e2) {
      setMessage(e2?.response?.data?.message || "Unable to save statement. Confirm backend Phase 4C is installed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{account.name}</span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{account.status === "recorded" ? `Recorded: ${formatMoney(account.outstanding)}` : "No statement recorded"}</span>
      </div>
      <label className="mt-3 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        ব্যাংকে বর্তমান বকেয়া (৳)
        <input type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter exact amount from bank" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white" />
      </label>
      <label className="mt-2 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        রেফারেন্স / মন্তব্য (ঐচ্ছিক)
        <input type="text" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bank statement date or reference" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white" />
      </label>
      <button disabled={saving} type="submit" className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving…" : `Save ${month} card statement`}</button>
      {message && <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">{message}</p>}
    </form>
  );
}


function CreditCardRepaymentEditor({ account, month, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [accountOptions, setAccountOptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingPayments, setLoadingPayments] = useState(false);
  const requestKey = useRef(null);

  const availableAccounts = useMemo(() => accountOptions.filter(a =>
    a.owner === "Joint" || account.owner === "Joint" || a.owner === account.owner
  ), [accountOptions, account.owner]);

  const refresh = async () => {
    setLoadingPayments(true);
    try {
      const response = await api.get("/api/credit-card-payments", { params: { month, cardAccountId: account.accountId } });
      setAccountOptions(response.data?.data?.fundingAccounts || []);
      setPayments(response.data?.data?.payments || []);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Payment history unavailable. Install the Phase 4C-B backend.");
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (expanded) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, month, account.accountId]);

  const edited = (setter) => (value) => {
    setter(value);
    requestKey.current = null;
    setMessage("");
  };

  const post = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.slice(0, 7) !== month) {
      setMessage("Choose an actual payment date within the selected month."); return;
    }
    if (!source || !/^(?:\d+)(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setMessage("Select your funding account and enter an amount greater than zero."); return;
    }
    if (!window.confirm(`Record a real ${formatMoney(amount)} bank debit to pay ${account.name}? Do not duplicate an existing EMI or card payment.`)) return;
    setBusy(true); setMessage("");
    if (!requestKey.current) requestKey.current = crypto.randomUUID();
    try {
      const response = await api.post("/api/credit-card-payments", {
        cardAccountId: account.accountId, fromAccountId: source, date, month,
        amount: Number(amount), note,
      }, { headers: { "Idempotency-Key": requestKey.current } });
      setMessage(response.data?.replayed ? "Already recorded — original payment reused." : "Card repayment recorded; one real funding-account debit created.");
      requestKey.current = null;
      setAmount(""); setNote("");
      await Promise.all([refresh(), onSaved()]);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to save. If the network timed out, retry without changing the form to avoid duplication.");
    } finally { setBusy(false); }
  };

  const voidPayment = async (payment) => {
    if (busy || payment.status !== "posted") return;
    if (!window.confirm(`Void the ${formatMoney(payment.amount)} card repayment? Its linked bank debit will be reversed, but statement snapshots will NOT change.`)) return;
    setBusy(true); setMessage("");
    try {
      await api.post(`/api/credit-card-payments/${encodeURIComponent(payment.id)}/void`);
      setMessage("Payment voided and linked bank debit reversed.");
      await Promise.all([refresh(), onSaved()]);
    } catch (error) { setMessage(error?.response?.data?.message || "Void failed; review your payment history."); }
    finally { setBusy(false); }
  };

  const paidTotal = payments.filter(p => p.status === "posted").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return (
    <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-400/20 dark:bg-sky-500/5">
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-sky-950 dark:text-sky-200" onClick={() => setExpanded(v => !v)}>
        <span>কার্ডে টাকা দেওয়া · শুধু নগদ টাকা কমবে</span>
        <span>{expanded ? "Hide" : "View / record"}</span>
      </button>
      {expanded && <>
        <p className="mt-2 text-[11px] leading-5 text-slate-700 dark:text-slate-300">
          Record only a payment you actually made from your bank, cash or mobile wallet. It reduces available cash, but does NOT create a new household expense, EMI payment or settlement.
          The bank statement you entered above is a separate snapshot; it will not be reduced a second time.
        </p>
        {month < "2026-10" ? (
          <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-200">আগের মাসগুলো পরিবর্তন করা যাবে না।</p>
        ) : (
          <form onSubmit={post} className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <label className="font-semibold text-slate-700 dark:text-slate-200">যে অ্যাকাউন্ট থেকে দিয়েছেন
              <select required value={source} onChange={e => edited(setSource)(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white">
                <option value="">যে অ্যাকাউন্ট থেকে টাকা গেছে সেটি বাছুন</option>
                {availableAccounts.map(a => <option key={a.id} value={a.id}>{a.name} · {a.owner}</option>)}
              </select>
            </label>
            <label className="font-semibold text-slate-700 dark:text-slate-200">টাকা দেওয়ার তারিখ
              <input required type="date" value={date} onChange={e => edited(setDate)(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="font-semibold text-slate-700 dark:text-slate-200">পরিশোধিত টাকা (৳)
              <input required min="0.01" type="number" step="0.01" value={amount} onChange={e => edited(setAmount)(e.target.value)} placeholder="Amount actually paid" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="font-semibold text-slate-700 dark:text-slate-200">রেফারেন্স / মন্তব্য
              <input maxLength={240} value={note} onChange={e => edited(setNote)(e.target.value)} placeholder="Bank transfer reference (optional)" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white" />
            </label>
            <button type="submit" disabled={busy || !availableAccounts.length} className="rounded-lg bg-sky-700 px-3 py-2 font-black text-white disabled:opacity-50 sm:col-span-2">{busy ? "Processing…" : "Record actual card repayment"}</button>
          </form>
        )}
        <div className="mt-3 flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100"><span>যেসব পরিশোধ লেখা আছে {month}</span><span>{formatMoney(paidTotal)}</span></div>
        {loadingPayments ? <p className="mt-1 text-xs text-slate-500">পরিশোধের তথ্য আসছে…</p> : payments.length === 0 ? <p className="mt-1 text-xs text-slate-500">এই মাসে কার্ডে টাকা দেওয়ার তথ্য নেই।</p> : (
          <div className="mt-2 space-y-2">
            {payments.map(payment => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-white/10 dark:bg-slate-950">
              <span className={payment.status === "voided" ? "text-slate-500 line-through" : "text-slate-800 dark:text-slate-200"}>{payment.date} · {payment.fromName} · {formatMoney(payment.amount)}</span>
              {payment.status === "posted" ? <button type="button" disabled={busy} onClick={() => voidPayment(payment)} className="font-bold text-rose-700 disabled:opacity-50 dark:text-rose-300">বাতিল করুন</button> : <span className="font-semibold text-slate-500">বাতিল হয়েছে</span>}
            </div>)}
          </div>
        )}
        {message && <p role="status" className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200">{message}</p>}
      </>}
    </div>
  );
}

export default function Dashboard() {
  const [hfMore, setHfMore] = useState(false);
  const [month, setMonth] = useState(monthNow());
  const [resp, setResp] = useState(null);
  const [walletOverview, setWalletOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [networth, setNetworth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const isDark = useDarkMode();

  const chartGrid = isDark ? "#334155" : "#e2e8f0";
  const chartText = isDark ? "#94a3b8" : "#64748b";
  const legendStyle = { color: chartText, fontSize: 12 };

  useEffect(() => {
    loadSummary();
    loadNetWorth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function loadSummary() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get("/api/dashboard/summary", { params: { month } });
      setResp(res.data);
      // Wallet is the authoritative source for total member-to-member settlement.
      try {
        const walletResponse = await api.get('/api/wallet/summary', {params:{month}});
        setWalletOverview(walletResponse.data?.data || null);
      } catch { setWalletOverview(null); }
    } catch (e) {
      setResp(null);
      setErr(e?.response?.data?.message || e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadTrend() {
    try {
      const res = await api.get("/api/dashboard/trend", { params: { month } });
      setTrend(res.data?.data || []);
    } catch {
      setTrend([]);
    }
  }

  async function loadNetWorth() {
    try {
      const res = await api.get("/api/networth", { params: { asOfMonth: month } });
      setNetworth(res.data?.data || null);
    } catch {
      setNetworth(null);
    }
  }

  const data = resp?.data;
  const summary = data?.summary;
  const budgetAllocation = data?.budgetAllocation;
  const cash = data?.cash;
  const cashAvailable = cash && Number.isFinite(Number(cash.monthRemaining));
  const cashRemaining = cashAvailable ? Number(cash.monthRemaining) : null;
  const recordedLiquidBalance = Number.isFinite(Number(cash?.recordedLiquidBalance)) ? Number(cash.recordedLiquidBalance) : null;

  const settlement = data?.settlement || [];
  const trackedAssets = networth?.assets;
  const trackedLiquid = trackedAssets ? safeNum(trackedAssets.liquidCash) : null;
  const trackedSavings = trackedAssets ? safeNum(trackedAssets.savingsAndInvestments) : null;
  const trackedAccountTotal = trackedAssets ? safeNum(trackedAssets.trackedAccountTotal) : null;
  const remainingEMI = networth?.liabilities ? safeNum(networth.liabilities.remainingEMI) : null;
  const cardReviewCount = safeNum(trackedAssets?.cardReviewCount);
  const netPositionWarnings = networth?.reconciliation?.issues || [];
  const cardStatements = networth?.liabilities?.creditCards;

  const income = safeNum(summary?.income);
  const living = safeNum(summary?.living);
  const debt = safeNum(summary?.debt); // legacy combined total: regular debt + managed purchase schedule
  const regularDebt = safeNum(summary?.components?.regularDebt ?? debt);
  const scheduledPurchases = safeNum(summary?.components?.scheduledLargePurchaseAllocation ?? budgetAllocation?.scheduledLargePurchaseAllocation);
  const investment = safeNum(summary?.investment);
  const available = safeNum(summary?.available);
  const finalBalance = safeNum(summary?.finalBalance);
  const savingsRate = safeNum(summary?.savingsRate ?? 0);
  const thisMonthSavingsTx = safeNum(summary?.components?.savingsContribution ?? 0);
  // Prefer real transaction evidence to the Ledger-only EMI indicator.
  const paidEmi = cashAvailable ? safeNum(cash?.emiPaid) : safeNum(summary?.components?.paidEmi);
  const otherPaidDebt = Math.max(0, regularDebt - paidEmi);
  const actualPaidExpense = cashAvailable ? safeNum(cash?.paidExpenses) : living + regularDebt;
  const paidPurchaseUpfront = cashAvailable ? safeNum(cash?.sharedPurchasePaidUpfront) : 0;
  const paidOtherExpense = cashAvailable ? safeNum(cash?.otherExpenses) : 0;
  const paidCardRepayments = cashAvailable ? safeNum(cash?.cardRepayments) : 0;
  const combinedPending = walletOverview?.settlementTotals?.pendingTotal;
  const combinedSuggestion = walletOverview?.settlement;


  const spendTotal = living + regularDebt + scheduledPurchases + investment;
  const expenseBudgetTotal = living + regularDebt + scheduledPurchases;
  // A budget can exceed income: display 115%, not an incorrectly capped 100%.
  // Individual gauge components may cap only the progress-bar width.
  const spendPct = useMemo(() => {
    return income > 0 ? Math.round((spendTotal / income) * 100) : 0;
  }, [income, spendTotal]);

  const availablePct = useMemo(() => {
    const denom = Math.max(income, 1);
    return clamp(Math.round((available / denom) * 100));
  }, [income, available]);

  const savingsRatePct = clamp(Math.round(savingsRate));

  const personalFinanceScore = useMemo(() => {
    if (!income) return 0;

    let score = 50;

    if (finalBalance >= 0) score += 15;
    else score -= 20;

    if (savingsRate >= 20) score += 20;
    else if (savingsRate >= 10) score += 10;
    else score -= 10;

    if (spendPct <= 70) score += 15;
    else if (spendPct <= 90) score += 5;
    else score -= 15;

    if (debt > 0 && debt <= income * 0.3) score += 5;
    else if (debt > income * 0.5) score -= 10;

    return clamp(Math.round(score));
  }, [income, finalBalance, savingsRate, spendPct, debt]);

  const personalFinanceScoreTone =
    personalFinanceScore >= 75
      ? "positive"
      : personalFinanceScore >= 50
        ? "warning"
        : "danger";

  const maxAbsSettlement = useMemo(() => {
    if (!settlement.length) return 1;
    return Math.max(...settlement.map((s) => Math.abs(safeNum(s.net))), 1);
  }, [settlement]);

  const trendView = useMemo(() => {
    return (trend || []).map((row) => {
      const rowIncome = safeNum(row.income);
      const rowLiving = safeNum(row.living);
      const rowDebt = safeNum(row.debt);
      const rowInvestment = safeNum(row.investment);
      const rowSpend = rowLiving + rowDebt + rowInvestment;
      return {
        ...row,
        monthKey: row.month,
        month: /^\d{4}-\d{2}$/.test(String(row.month))
          ? new Intl.DateTimeFormat('bn-BD', { month: 'short', timeZone: 'UTC' }).format(new Date(`${row.month}-01T00:00:00.000Z`))
          : row.month,
        income: rowIncome,
        living: rowLiving,
        debt: rowDebt,
        investment: rowInvestment,
        spend: rowSpend,
        balance: rowIncome - rowSpend,
      };
    });
  }, [trend]);

  const expensePieData = useMemo(() => {
    const parts = [
      { name: "নিয়মিত খরচ", value: living, color: COLORS.living },
      { name: "অন্যান্য কিস্তি/দেনা", value: regularDebt, color: COLORS.debt },
      { name: "বড় কেনাকাটার ভাগ", value: scheduledPurchases, color: COLORS.final },
      { name: "সঞ্চয়", value: Math.max(0, investment), color: COLORS.investment },
    ].filter((item) => item.value > 0);

    if (finalBalance > 0) {
      parts.push({ name: "অবশিষ্ট", value: finalBalance, color: COLORS.available });
    }

    return parts;
  }, [living, regularDebt, scheduledPurchases, investment, finalBalance]);

  const cashFlowData = useMemo(
    () => [
      { name: "Income", value: income, color: COLORS.income },
      { name: "Living", value: -living, color: COLORS.living },
      { name: "Regular debt", value: -regularDebt, color: COLORS.debt },
      { name: "Large purchases", value: -scheduledPurchases, color: COLORS.final },
      { name: "Savings/investments", value: -investment, color: COLORS.investment },
      {
        name: "Budget remaining",
        value: finalBalance,
        color: finalBalance >= 0 ? COLORS.final : COLORS.living,
      },
    ],
    [income, living, regularDebt, scheduledPurchases, investment, finalBalance]
  );

  const quickNote = useMemo(() => {
    if (!income) return "Add income and expense records to activate insights.";
    if (finalBalance < 0) return "Planned allocations exceed this month's income. This is a budget warning, not a statement of your actual bank cash.";
    if (savingsRate >= 20) return "Savings rate is healthy. Keep this pace consistent for long-term stability.";
    if (spendPct > 90) return "Your planned allocations are close to income. Check the budget separately from recorded cash.";
    return "Budget allocation is within monthly income; compare with the actual cash result above.";
  }, [income, finalBalance, savingsRate, spendPct]);

  const chartTick = { fontSize: 11, fill: chartText };

  return (
    <AppLayout>
      <div className="hf-v2-dashboard hf-v2-page">
        <HFPageLead title="হোম" description="মাসের আয়-খরচ এক নজরে" month={month} onMonthChange={setMonth} onRefresh={() => { loadSummary(); loadNetWorth(); loadTrend(); }} />
        {err && <div className="hf-v2-alert" role="alert">{err}</div>}
        <section className="hf-v2-feature hf-hishab-overview" aria-label="এই মাসের আয়-খরচ">
          <div>
            <span className="hf-v2-eyebrow">এই মাসের আয় থেকে</span>
            <h2 className="hf-hishab-overview-title">এখন বাকি</h2>
            <div className={`hf-v2-feature-number ${cashRemaining < 0 ? 'hf-v2-negative' : ''}`}>
              {loading ? '…' : cashAvailable ? formatMoney(cashRemaining) : 'হিসাব পাওয়া যায়নি'}
            </div>
            <p>এই মাসের আয় − বাস্তবে পরিশোধিত খরচ − সঞ্চয়ে জমা টাকা। আগের মাসের টাকা যোগ করা হয়নি।</p>
          </div>
          <div className="hf-v2-feature-math">
            <div><span>এই মাসের আয়</span><strong>{formatMoney(cashAvailable ? cash.incomeReceived : income)}</strong></div>
            <div><span>টাকা খরচ হয়েছে</span><strong>{formatMoney(actualPaidExpense)}</strong></div>
            <div><span>সঞ্চয়ে জমা</span><strong>{formatMoney(cashAvailable ? cash.savingsDeposited : investment)}</strong></div>
          </div>
        </section>
        <section className="hf-hishab-kpi-grid" aria-label="মাসের প্রধান তথ্য">
          <div className="hf-hishab-kpi hf-hishab-kpi-income">
            <span>মোট আয়</span><strong>{formatMoney(income)}</strong>
            <small>এই মাসে পাওয়া সব আয়ের এন্ট্রি (বেতন ও অন্যান্য আয়)। দুজনের আয় যোগ করা হয়েছে।</small>
          </div>
          <div className="hf-hishab-kpi hf-hishab-kpi-spend">
            <span>মোট টাকা বের হয়েছে</span><strong>{formatMoney(actualPaidExpense)}</strong>
            <small>ব্যাংক/নগদ থেকে পরিশোধিত খরচ (সাধারণ খরচ, পরিশোধিত EMI, এককালীন কেনাকাটা ও প্রযোজ্য কার্ড পরিশোধ)। সঞ্চয় আলাদা।</small>
          </div>
          <div className="hf-hishab-kpi">
            <span>সাধারণ খরচ</span><strong>{formatMoney(living)}</strong>
            <small>খাবার, যাতায়াত, বাজার ও নিয়মিত বিল। EMI, সঞ্চয় ও বড় কেনাকাটার নির্ধারিত ভাগ এখানে নেই।</small>
          </div>
          <div className="hf-hishab-kpi">
            <span>পরিশোধিত EMI</span><strong>{formatMoney(paidEmi)}</strong>
            <small>যে EMI-তে টাকা সত্যিই দেওয়া হয়েছে। শুধু বিল তৈরি বা কিস্তি বাকি থাকলে এখানে যোগ হবে না।</small>
          </div>
        </section>
        <section className="hf-hishab-extra-grid" aria-label="জমা ও বড় কেনাকাটার মাসিক ভাগ">
          <div className="hf-hishab-kpi hf-hishab-extra-card">
            <span>এই মাসে সঞ্চয়</span><strong>{formatMoney(investment)}</strong>
            <small>সঞ্চয়/DPS-এ জমা টাকা; খরচ নয়, কিন্তু এই মাসে ব্যবহারযোগ্য টাকা থেকে বাদ।</small>
          </div>
          <div className="hf-hishab-kpi hf-hishab-extra-card">
            <span>বড় কেনাকাটার এই মাসের ভাগ</span><strong>{formatMoney(scheduledPurchases)}</strong>
            <small>সব সদস্যের নির্ধারিত মাসিক ভাগ—পরিশোধ হোক বা বাকি থাকুক। ব্যাংক থেকে দ্বিতীয়বার টাকা কাটে না।</small>
          </div>
          <div className="hf-hishab-kpi hf-hishab-extra-card hf-hishab-budget-balance">
            <span>বড় কেনাকাটার ভাগসহ মাসে বাকি</span>
            <strong className={finalBalance < 0 ? 'hf-v2-negative' : 'hf-v2-positive'}>{formatMoney(finalBalance)}</strong>
            <small>মোট আয় − সাধারণ খরচ − অন্যান্য Ledger দেনা − সঞ্চয় − বড় কেনাকাটার এই মাসের ভাগ। এটি Wallet-এর নগদ চলাচলের হিসাব নয়।</small>
          </div>
        </section>
        <details className="hf-v2-disclosure hf-hishab-explain">
          <summary>সব টাকার হিসাব কীভাবে হয়েছে?</summary>
          <div className="hf-hishab-explain-content">
            <p><b>মোট আয়:</b> {formatMoney(income)} — Ledger-এ এই মাসের আয়ের এন্ট্রিগুলোর যোগফল।</p>
            <p><b>টাকা বের হয়েছে:</b> {formatMoney(actualPaidExpense)} — রেকর্ড করা অ্যাকাউন্টের বাস্তব খরচ। এর মধ্যে সাধারণ অন্যান্য খরচ {formatMoney(paidOtherExpense)}, EMI {formatMoney(paidEmi)}, বড় কেনাকাটায় একবার দেওয়া টাকা {formatMoney(paidPurchaseUpfront)}{paidCardRepayments > 0 ? `, কার্ডের বিল পরিশোধ ${formatMoney(paidCardRepayments)}` : ''}। সঞ্চয়ে পাঠানো টাকা এখানে নেই।</p>
            <p><b>সাধারণ খরচ:</b> {formatMoney(living)} — Ledger-এর সাধারণ খরচ; EMI, DPS ও বড় কেনাকাটার মাসিক বরাদ্দ নয়। এটি অ্যাকাউন্ট থেকে বের হওয়া টাকার breakdown-এর সঙ্গে একেবারে একই নাও হতে পারে।</p>
            <p><b>মাসে বাস্তবে বাকি:</b> {formatMoney(cashRemaining)} — এই মাসের আয় − প্রকৃত টাকা বের হওয়া − সঞ্চয়ে জমা + সঞ্চয় থেকে তোলা টাকা। আগের মাসের ব্যালেন্স যোগ হয়নি।</p>
            <p><b>বড় কেনাকাটার ভাগ ধরে মাসে বাকি:</b> {formatMoney(finalBalance)} — আলাদা মাসিক পরিকল্পনার হিসাব; আগেই পরিশোধ করা কেনাকাটাকে আবার ব্যাংক থেকে কাটে না।</p>
          </div>
        </details>
        {(cash?.issues?.length > 0 || (cash?.negativeAccountCount || 0)>0) && <details className="hf-v2-disclosure"><summary>অ্যাকাউন্টের কিছু অঙ্ক যাচাই করা প্রয়োজন</summary><p>ব্যাংকের প্রকৃত ব্যালেন্সের সঙ্গে মাস শেষে হিসাব মিলিয়ে নিন।</p></details>}
        <div className="hf-v2-dashboard-panels">
          <section className="hf-v2-panel"><div className="hf-v2-panel-head"><div><h2>খরচের ভাগ</h2><p>মাসের আয় কোন খাতে গেছে</p></div></div>
            {expensePieData.length ? <div className="hf-v2-pie-layout"><div className="hf-v2-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expensePieData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="85%" paddingAngle={3}>{expensePieData.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip content={<SimpleTooltip/>}/></PieChart></ResponsiveContainer></div>
            <div className="hf-v2-legend">{expensePieData.map(x=><div key={x.name}><i style={{background:x.color}}/><span>{x.name}</span><strong>{formatMoney(x.value)}</strong></div>)}</div></div> : <p className="hf-v2-empty">এখনও কোনো খরচের তথ্য নেই।</p>}
          </section>
          <section className="hf-v2-panel"><div className="hf-v2-panel-head"><div><h2>দেনা-পাওনা</h2><p>সাধারণ খরচের ভাগ; চূড়ান্ত হিসাব টাকার হিসাব পেজে</p></div></div>
            {walletOverview && combinedSuggestion && safeNum(combinedPending) > 0 ? (
              <div className="hf-hishab-settlement-total"><span>{walletOverview.users?.find(u=>String(u.userId)===String(combinedSuggestion.fromUserId))?.name || 'যিনি দেবেন'} → {walletOverview.users?.find(u=>String(u.userId)===String(combinedSuggestion.toUserId))?.name || 'যিনি পাবেন'}</span><strong>{formatMoney(combinedPending)}</strong><small>সাধারণ খরচ ও অপরিশোধিত বড় কেনাকাটার টাকা মিলিয়ে</small></div>
            ) : settlement.length ? <div className="hf-v2-settlement-list">{settlement.map(x=><div key={x.userId}><div><strong>{x.name}</strong><span>{safeNum(x.net)>=0?'পাবেন':'দেবেন'}</span></div><strong className={safeNum(x.net)<0?'hf-v2-negative':'hf-v2-positive'}>{formatMoney(Math.abs(safeNum(x.net)))}</strong></div>)}</div> : <p className="hf-v2-empty">এখন কোনো দেনা-পাওনা নেই।</p>}
            <a className="hf-v2-text-link" href="/wallet">সম্পূর্ণ দেনা-পাওনা দেখুন →</a>
          </section>
        </div>
        <section className="hf-v2-panel hf-v2-trend"><div className="hf-v2-panel-head"><div><h2>গত ১২ মাসের হিসাব</h2><p>আয়, খরচ ও সঞ্চয়ের পরিবর্তন</p></div></div>
          {trendView.length ? <div className="hf-v2-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendView} margin={{top:12,right:12,left:0,bottom:2}}><CartesianGrid strokeDasharray="3 5" stroke={chartGrid} vertical={false}/><XAxis dataKey="month" tick={chartTick} axisLine={false} tickLine={false}/><YAxis tick={chartTick} axisLine={false} tickLine={false} width={50}/><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={legendStyle}/><Line type="monotone" dataKey="income" name="আয়" stroke={COLORS.income} strokeWidth={2.6} dot={false}/><Line type="monotone" dataKey="spend" name="খরচ ও জমা" stroke={COLORS.living} strokeWidth={2.6} dot={false}/><Line type="monotone" dataKey="balance" name="বাকি" stroke={COLORS.final} strokeWidth={2.6} dot={false}/></LineChart></ResponsiveContainer></div> : <p className="hf-v2-empty">১২ মাসের তথ্য এখনও পাওয়া যায়নি।</p>}
        </section>
        {/* ক্রেডিট কার্ডের পুরোনো তথ্য ও API সংরক্ষিত, হোমে প্রদর্শিত নয়। */}
      </div>
    </AppLayout>
  );
}

function CashLine({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatMoney(value ?? 0)}</div>
    </div>
  );
}

/* ------------------ UI Components ------------------ */

function HeroMetric({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur sm:rounded-3xl sm:p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-300 sm:text-xs">{label}</div>
      <div className="mt-1 text-lg font-black text-white break-words sm:text-xl">{value}</div>
      <div className="mt-1 text-[11px] text-slate-300 sm:text-xs">{sub}</div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "", right = null }) {
  return (
    <div className={`rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:rounded-[1.5rem] sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-950 break-words dark:text-slate-100 sm:text-base">{title}</div>
          {subtitle ? <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, hint, tone = "neutral", isText = false }) {
  const toneMap = {
    positive: {
      box: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900",
      pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      ring: "bg-emerald-500/15 dark:bg-emerald-400/10",
    },
    danger: {
      box: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white dark:border-rose-500/20 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900",
      pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      ring: "bg-rose-500/15 dark:bg-rose-400/10",
    },
    warning: {
      box: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white dark:border-amber-500/20 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900",
      pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      ring: "bg-amber-500/15 dark:bg-amber-400/10",
    },
    info: {
      box: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-500/20 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900",
      pill: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      ring: "bg-blue-500/15 dark:bg-blue-400/10",
    },
    neutral: {
      box: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900",
      pill: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      ring: "bg-slate-500/15 dark:bg-slate-400/10",
    },
  };

  const style = toneMap[tone] || toneMap.neutral;
  const valueText = isText ? String(value ?? "0") : formatMoney(value);

  return (
    <div className={`relative overflow-hidden rounded-[1.35rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/20 sm:rounded-[1.5rem] sm:p-5 ${style.box}`}>
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full sm:h-28 sm:w-28 ${style.ring}`} />
      <div className="relative z-10">
        <div className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs ${style.pill}`}>{title}</div>
        <div className="text-xl font-black text-slate-950 break-words dark:text-slate-100 sm:text-3xl">{valueText}</div>
        {hint ? <div className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</div> : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-300"
        : tone === "info"
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <div className="text-[11px] opacity-80 sm:text-xs">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-950 break-words dark:text-slate-100 sm:text-base">{formatMoney(value)}</div>
    </div>
  );
}

function SignalCard({ title, value, desc, tone = "neutral" }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-300"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className={`rounded-2xl border p-4 sm:rounded-3xl ${toneClass}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-80 sm:text-xs">{title}</div>
      <div className="mt-2 text-lg font-black text-slate-950 dark:text-slate-100 sm:text-xl">{value}</div>
      <div className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{desc}</div>
    </div>
  );
}

function GaugeRow({ label, value, caption, tone = "neutral" }) {
  const bar =
    tone === "positive"
      ? "bg-emerald-500"
      : tone === "danger"
        ? "bg-rose-500"
        : tone === "warning"
          ? "bg-amber-500"
          : "bg-slate-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{caption}</div>
        </div>
        <div className="text-sm font-black text-slate-950 dark:text-slate-100">{value}%</div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:h-3">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${clamp(value)}%` }} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>
        </div>
      </div>
      <div className="shrink-0 text-xs font-black text-slate-950 dark:text-slate-100 sm:text-sm">{value}</div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400 sm:rounded-3xl sm:p-6">
      {text}
    </div>
  );
}
