import HFPageLead from "../components/design/HFPageLead";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || value.userId || "");
}

function money(n) {
  const v = Number(n || 0);
  return `৳ ${v.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function safeText(value, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function monthLabel(value) {
  if (!value) return "Selected month";
  const [year, month] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shortMonthLabel(value) {
  if (!value) return "-";
  const [year, month] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function savingsRate(saved, totalBeforeSaving) {
  const savedAmount = Number(saved || 0);
  const total = Number(totalBeforeSaving || 0);
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((savedAmount / total) * 100)));
}

function accountTypeLabel(type) {
  const t = String(type || "").toLowerCase();
  if (t === "savings") return "Savings";
  if (t === "investment") return "Investment";
  if (t === "bank") return "Bank";
  if (t === "cash") return "Cash";
  if (t === "wallet") return "Wallet";
  return safeText(type, "Account");
}

function accountTypeBadge(type) {
  const t = String(type || "").toLowerCase();
  if (t === "investment") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100";
  }
  if (t === "savings") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100";
  }
  if (t === "wallet") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100";
  }
  if (t === "cash") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100";
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200";
}

function openNativePicker(e) {
  const input = e.currentTarget.querySelector("input");
  if (!input) return;

  input.focus();

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers allow showPicker only on direct input click.
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

  if (name === "plus") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
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

  if (name === "wallet") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-14A2.5 2.5 0 0 1 2 17V7a2.5 2.5 0 0 1 2.5-2.5H17" />
        <path d="M4.5 4.5h12A2.5 2.5 0 0 1 19 7" />
        <path d="M17 13h4" />
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

function StatCard({
  title,
  value,
  sub,
  accent = "from-emerald-500 to-teal-600",
  icon = "wallet",
  hideOnMobile = false,
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] sm:p-5 lg:hover:-translate-y-0.5",
        hideOnMobile && "hidden sm:block"
      )}
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-15`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs">
            {title}
          </div>
          <div className="mt-2 break-words text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </div>
          {sub ? (
            <div className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
              {sub}
            </div>
          ) : null}
        </div>

        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-sm font-black text-white shadow-sm`}>
          {typeof icon === "string" && icon.length <= 2 ? icon : <Icon name={icon} className="h-5 w-5" />}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return cx(
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/10",
    extra
  );
}

function progressPercent(value, total) {
  const v = Number(value || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.min(100, Math.max(0, Math.round((v / t) * 100)));
}

function AccountCard({ account, totalBalance }) {
  const deposited = Number(account?.monthDeposited || 0);
  const withdrawn = Number(account?.monthWithdrawn || 0);
  const balance = Number(account?.currentBalance || 0);
  const share = progressPercent(balance, totalBalance);

  return (
    <article className="savings-account-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] sm:p-4 lg:hover:-translate-y-0.5">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100 opacity-60 transition dark:bg-emerald-400/10 lg:group-hover:scale-110" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-words text-base font-black text-slate-950 dark:text-white">
              {safeText(account?.name, "Savings Account")}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${accountTypeBadge(account?.type)}`}>
                {accountTypeLabel(account?.type)}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                {safeText(account?.owner, "Owner")}
              </span>
            </div>
          </div>

          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Icon name="wallet" className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs">
            বর্তমান জমা
          </div>
          <div className="mt-1 break-words text-2xl font-black text-slate-950 dark:text-white">
            {money(balance)}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${share}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {share}মোট সঞ্চয়ের অংশ
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">জমা হয়েছে</div>
            <div className="mt-1 break-words font-black text-emerald-900 dark:text-emerald-100">{money(deposited)}</div>
          </div>

          <div className="hidden rounded-2xl border border-rose-100 bg-rose-50 p-3 dark:border-rose-400/20 dark:bg-rose-400/10 sm:block">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-200">উত্তোলন হয়েছে</div>
            <div className="mt-1 break-words font-black text-rose-900 dark:text-rose-100">{money(withdrawn)}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Savings() {
  const [hfMore, setHfMore] = useState(false);
  const [month, setMonth] = useState(monthNow());
  const [allAccounts, setAllAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [yearlySummary, setYearlySummary] = useState(null);
  const [selectedYearlyMemberId, setSelectedYearlyMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [depositSaving, setDepositSaving] = useState(false);
  const depositInFlight = useRef(false);
  const depositAttempt = useRef(null);
  const [form, setForm] = useState({
    paidByUserId: "",
    date: todayISO(),
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    note: "",
  });

  function ownerFromMemberId(memberId) {
    const member = (members || []).find((m) => getId(m) === getId(memberId));
    const name = String(member?.name || "").trim().toLowerCase();

    if (name.includes("mahbub")) return "Mahbub";
    if (name.includes("mirza")) return "Mirza";

    return "";
  }

  function accountBelongsToUser(account, userId) {
    if (!userId) return false;

    const userOwner = ownerFromMemberId(userId);
    const accountOwner = String(account?.owner || "").trim();

    if (!userOwner) return false;

    return accountOwner === userOwner;
  }

  function isNormalSourceAccount(account) {
    const type = String(account?.type || "").trim().toLowerCase();

    return (
      account?.isActive !== false &&
      ["cash", "bank", "wallet"].includes(type)
    );
  }

  function isSavingsTargetAccount(account) {
    const type = String(account?.type || "").trim().toLowerCase();

    return (
      account?.isActive !== false &&
      ["savings", "investment"].includes(type)
    );
  }

  function getSourceAccountsForUser(userId) {
    return (allAccounts || []).filter(
      (account) =>
        isNormalSourceAccount(account) &&
        accountBelongsToUser(account, userId)
    );
  }

  function getSavingsAccountsForUser(userId) {
    return (allAccounts || []).filter(
      (account) =>
        isSavingsTargetAccount(account) &&
        accountBelongsToUser(account, userId)
    );
  }

  const savingsAccounts = useMemo(
    () => (allAccounts || []).filter((account) => isSavingsTargetAccount(account)),
    [allAccounts]
  );

  const spendAccounts = useMemo(
    () => (allAccounts || []).filter((account) => isNormalSourceAccount(account)),
    [allAccounts]
  );

  const fromAccountOptions = useMemo(() => {
    return getSourceAccountsForUser(form.paidByUserId);
  }, [allAccounts, members, form.paidByUserId]);

  const toAccountOptions = useMemo(() => {
    return getSavingsAccountsForUser(form.paidByUserId);
  }, [allAccounts, members, form.paidByUserId]);

  async function loadAccounts() {
    const res = await api.get("/api/accounts");
    setAllAccounts(res.data.items || []);
  }

  async function loadMembers() {
    const res = await api.get("/api/family/members");
    setMembers(res.data.members || []);
  }

  async function loadOverview(m) {
    const res = await api.get("/api/savings/overview", { params: { month: m } });
    setOverview(res.data);
  }


  async function loadYearlySummary(m) {
    const res = await api.get("/api/savings/yearly-summary", {
      params: { endMonth: m },
    });

    const data = res.data || {};
    const returnedMembers = data.members || [];

    setYearlySummary(data);

    const firstMemberId = returnedMembers?.[0]?.id || "";

    setSelectedYearlyMemberId((prev) => {
      const stillExists = returnedMembers.some(
        (member) => getId(member.id) === getId(prev)
      );

      return stillExists ? prev : firstMemberId;
    });
  }

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([loadMembers(), loadAccounts(), loadOverview(month), loadYearlySummary(month)]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load savings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadOverview(month), loadYearlySummary(month)]);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load overview");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function openDeposit() {
    depositAttempt.current = null;
    const defaultUser = getId(members?.[0]) || "";
    const from = getSourceAccountsForUser(defaultUser)?.[0]?._id || "";
    const to = getSavingsAccountsForUser(defaultUser)?.[0]?._id || "";

    setForm({
      paidByUserId: defaultUser,
      date: todayISO(),
      fromAccountId: from,
      toAccountId: to,
      amount: "",
      note: "",
    });

    setModalOpen(true);
  }

  async function saveDeposit() {
    if (depositInFlight.current) return;
    depositInFlight.current = true;
    setDepositSaving(true);
    try {
      if (!form.paidByUserId) {
        toast.error("Select user");
        return;
      }

      if (!form.fromAccountId || !form.toAccountId) {
        toast.error("Select From and To accounts");
        return;
      }

      const amt = Number(form.amount);
      if (!amt || amt <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      const payload = {
        paidByUserId: form.paidByUserId,
        date: form.date,
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: amt,
        note: form.note,
      };
      const fingerprint = JSON.stringify(payload);
      if (!depositAttempt.current || depositAttempt.current.fingerprint !== fingerprint) {
        depositAttempt.current = { fingerprint, key: crypto.randomUUID() };
      }
      await api.post("/api/savings/deposit", payload, {
        headers: { 'Idempotency-Key': depositAttempt.current.key },
      });
      depositAttempt.current = null;

      toast.success("Savings transfer recorded");
      setModalOpen(false);
      try {
        await Promise.all([loadOverview(month), loadYearlySummary(month), loadAccounts()]);
      } catch {
        toast.error('Transfer saved, but the summary could not refresh. Reload to see the latest balances.');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed. Retry the same form rather than creating another deposit.");
    } finally {
      depositInFlight.current = false;
      setDepositSaving(false);
    }
  }

  const totals = overview?.totals || {
    deposited: 0,
    withdrawn: 0,
    net: 0,
    totalBalance: 0,
  };

  const list = overview?.accounts || [];

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) => {
      const haystack = `${a?.name || ""} ${a?.type || ""} ${a?.owner || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [list, search]);

  const totalSavingsAccounts = list.length;

  const yearlyMembers = yearlySummary?.members || [];

  const selectedYearlyMember = useMemo(() => {
    if (!yearlyMembers.length) return null;
    return (
      yearlyMembers.find((member) => getId(member.id) === getId(selectedYearlyMemberId)) ||
      yearlyMembers[0]
    );
  }, [yearlyMembers, selectedYearlyMemberId]);

  const selectedYearlyTotal =
    selectedYearlyMember?.totalCashSaved ?? selectedYearlyMember?.totalSaved ?? 0;

  const selectedYearlyMonths = selectedYearlyMember?.months || [];

  const selectedMonthSummary =
    selectedYearlyMonths.find((item) => item.month === month) ||
    selectedYearlyMonths[selectedYearlyMonths.length - 1] ||
    null;

  const selectedMonthIncome = Number(selectedMonthSummary?.income || 0);
  const selectedMonthExpense = Number(selectedMonthSummary?.expense || 0);
  const selectedMonthTransferNet = Number(selectedMonthSummary?.transferNet || 0);
  const selectedMonthCashSaved = Number(
    selectedMonthSummary?.monthlySaved ?? selectedMonthSummary?.netSaved ?? 0
  );
  const selectedMonthCumulative = Number(
    selectedMonthSummary?.cumulativeSaved ?? selectedYearlyTotal ?? 0
  );

  return (
    <AppLayout>
      <div className={`hf-step3-page hf-step3-savings hf-v2-page hf-v2-savings ${hfMore ? "hf-step3-expanded" : ""}`}>
        <HFPageLead title="সঞ্চয়" description="DPS ও সঞ্চয় অ্যাকাউন্টে জমানো টাকা" month={month} onMonthChange={setMonth}
          metrics={[
 {label:'মোট সঞ্চয়',value:totals.totalBalance,primary:true},
 {label:'এই মাসে জমা',value:selectedMonthCashSaved}
]}
          onAdd={openDeposit} addLabel="টাকা জমা"
          addDisabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
          onExtra={undefined} extraLabel=""
          onRefresh={undefined}
          more={hfMore} onToggleMore={() => setHfMore(v => !v)} />

      <main className="savings-page min-h-[calc(100vh-64px)] w-full overflow-x-hidden bg-slate-50 px-2 py-3 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="mx-auto w-full space-y-4 sm:space-y-5">
          {/* Header */}
          <></>

          {loading ? (
            <Loader text="সঞ্চয়ের তথ্য আসছে" subtext="সঞ্চয়ের হিসাব তৈরি হচ্ছে" />
          ) : (
            <>
              {/* Stats */}
              <></>

              {/* Account cards */}
              <section className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-lg font-black text-slate-950 dark:text-white">সঞ্চয় অ্যাকাউন্ট</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                      মাসের জমা ও অ্যাকাউন্টে মোট কত আছে
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative w-full sm:w-72">
                      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="অ্যাকাউন্ট বা সদস্য খুঁজুন…"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/10"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openDeposit}
                      disabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
                      className="hidden h-11 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:inline-flex sm:items-center sm:justify-center"
                    >
                      + জমা করুন
                    </button>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40 sm:p-8">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-100 text-2xl dark:bg-emerald-400/10">
                      <Icon name="wallet" className="h-7 w-7 text-emerald-700 dark:text-emerald-200" />
                    </div>
                    <div className="mt-4 text-base font-black text-slate-950 dark:text-white">সঞ্চয় অ্যাকাউন্ট নেই</div>
                    <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      একটি অ্যাকাউন্ট তৈরি করুন: <b>সেটিংস → অ্যাকাউন্ট</b> এবং ধরন বাছুন <b>সঞ্চয়</b> or <b>বিনিয়োগ</b>.
                    </div>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
                    আপনার খোঁজার সঙ্গে কোনো অ্যাকাউন্ট মেলেনি।
                  </div>
                ) : (
                  <div className="hf-hishab-savings-list">
                    {filteredList.map(a => (
                      <div key={a._id || a.id || a.name} className="hf-hishab-savings-row">
                        <div><h3>{safeText(a.name, 'সঞ্চয় অ্যাকাউন্ট')}</h3><p>{safeText(a.owner, '—')} · {accountTypeLabel(a.type)}</p></div>
                        <div><span>এই মাসে জমা</span><b>{money(a.monthDeposited)}</b></div>
                        <div><span>এখন মোট জমা আছে</span><strong>{money(a.currentBalance)}</strong></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Desktop detailed table only */}
              <section className="hf-step3-advanced hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:block">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50 p-4 dark:border-white/10 dark:from-slate-900 dark:to-emerald-950/30 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-950 dark:text-white">অ্যাকাউন্টের বিস্তারিত</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        অ্যাকাউন্টের বিস্তারিত হিসাব।
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      {filteredList.length} দেখানো
                    </div>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="p-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    সঞ্চয় অ্যাকাউন্ট নেই; তৈরি করুন: <b>সেটিংস → অ্যাকাউন্ট</b> and set type as <b>সঞ্চয়</b> or <b>বিনিয়োগ</b>.
                  </div>
                ) : (
                  <div className="overflow-x-auto savings-no-scrollbar">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <th className="p-4">অ্যাকাউন্ট</th>
                          <th className="p-4">ধরন</th>
                          <th className="p-4">মালিক</th>
                          <th className="p-4 text-right">Balance</th>
                          <th className="p-4 text-right">জমা হয়েছে</th>
                          <th className="p-4 text-right">উত্তোলন হয়েছে</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredList.map((a) => (
                          <tr
                            key={a._id || a.id || a.name}
                            className="border-t border-slate-100 transition hover:bg-emerald-50/40 dark:border-white/10 dark:hover:bg-emerald-400/5"
                          >
                            <td className="p-4 font-bold text-slate-950 dark:text-white">{safeText(a.name, "Savings Account")}</td>
                            <td className="p-4">
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${accountTypeBadge(a.type)}`}>
                                {accountTypeLabel(a.type)}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">{safeText(a.owner, "-")}</td>
                            <td className="p-4 text-right font-black text-slate-950 dark:text-white">{money(a.currentBalance)}</td>
                            <td className="p-4 text-right font-bold text-emerald-700 dark:text-emerald-300">{money(a.monthDeposited)}</td>
                            <td className="p-4 text-right font-bold text-rose-700 dark:text-rose-300">{money(a.monthWithdrawn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Individual last 12 months cash savings */}
              <section className="hf-step3-advanced rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-lg font-black text-slate-950 dark:text-white">
                      ব্যক্তিগত সঞ্চয়ের ইতিহাস
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                      Monthly cash saved = income − expense ± transfer adjustment. Negative months reduce the total saved amount.
                    </div>
                  </div>

                  <div className="w-full lg:w-72">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      সদস্য বাছুন
                    </label>
                    <select
                      className={inputClass()}
                      value={selectedYearlyMember?.id || selectedYearlyMemberId}
                      onChange={(e) => setSelectedYearlyMemberId(e.target.value)}
                    >
                      {yearlyMembers.length === 0 ? (
                        <option value="">সদস্য নেই</option>
                      ) : (
                        yearlyMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {!selectedYearlyMember ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
                    এখনও সঞ্চয়ের ইতিহাস নেই।
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                          মোট জমানো টাকা
                        </div>
                        <div className="mt-2 text-2xl font-black text-emerald-950 dark:text-emerald-100">
                          {money(selectedYearlyTotal)}
                        </div>
                        <div className="mt-1 text-xs text-emerald-800 dark:text-emerald-100/80">
                          শেষ ১২ মাস • {selectedYearlyMember.name}
                        </div>
                      </div>

                      <div
                        className={cx(
                          "rounded-2xl border p-4",
                          selectedMonthCashSaved >= 0
                            ? "border-sky-100 bg-sky-50 dark:border-sky-400/20 dark:bg-sky-400/10"
                            : "border-rose-100 bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10"
                        )}
                      >
                        <div
                          className={cx(
                            "text-xs font-bold uppercase tracking-[0.16em]",
                            selectedMonthCashSaved >= 0
                              ? "text-sky-700 dark:text-sky-200"
                              : "text-rose-700 dark:text-rose-200"
                          )}
                        >
                          এই মাসে জমা
                        </div>
                        <div
                          className={cx(
                            "mt-2 text-2xl font-black",
                            selectedMonthCashSaved >= 0
                              ? "text-sky-950 dark:text-sky-100"
                              : "text-rose-950 dark:text-rose-100"
                          )}
                        >
                          {money(selectedMonthCashSaved)}
                        </div>
                        <div
                          className={cx(
                            "mt-1 text-xs",
                            selectedMonthCashSaved >= 0
                              ? "text-sky-800 dark:text-sky-100/80"
                              : "text-rose-800 dark:text-rose-100/80"
                          )}
                        >
                          {monthLabel(selectedMonthSummary?.month || month)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-400/20 dark:bg-violet-400/10">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200">
                          মাসের আয়
                        </div>
                        <div className="mt-2 text-2xl font-black text-violet-950 dark:text-violet-100">
                          {money(selectedMonthIncome)}
                        </div>
                        <div className="mt-1 text-xs text-violet-800 dark:text-violet-100/80">
                          এই সদস্যের আয়
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                          মাসের খরচ
                        </div>
                        <div className="mt-2 text-2xl font-black text-amber-950 dark:text-amber-100">
                          {money(selectedMonthExpense)}
                        </div>
                        <div className="mt-1 text-xs text-amber-800 dark:text-amber-100/80">
                          টাকা আদান-প্রদান: {money(selectedMonthTransferNet)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                      <div className="savings-no-scrollbar overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-950/60">
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              <th className="p-3">মাস</th>
                              <th className="p-3 text-right">আয়</th>
                              <th className="p-3 text-right">খরচ</th>
                              <th className="p-3 text-right">Transfer Net</th>
                              <th className="p-3 text-right">মাসে জমা</th>
                              <th className="p-3 text-right">মোট সঞ্চয়</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedYearlyMonths.map((item) => {
                              const monthlySaved = Number(item.monthlySaved ?? item.netSaved ?? 0);
                              const cumulativeSaved = Number(item.cumulativeSaved ?? 0);
                              const transferNet = Number(item.transferNet ?? 0);

                              return (
                                <tr
                                  key={item.month}
                                  className={cx(
                                    "border-t border-slate-100 transition dark:border-white/10",
                                    item.month === month
                                      ? "bg-emerald-50/70 dark:bg-emerald-400/10"
                                      : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                                  )}
                                >
                                  <td className="p-3 font-bold text-slate-950 dark:text-white">
                                    {shortMonthLabel(item.month)}
                                  </td>

                                  <td className="p-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
                                    {money(item.income)}
                                  </td>

                                  <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">
                                    {money(item.expense)}
                                  </td>

                                  <td
                                    className={cx(
                                      "p-3 text-right font-bold",
                                      transferNet >= 0
                                        ? "text-sky-700 dark:text-sky-300"
                                        : "text-orange-700 dark:text-orange-300"
                                    )}
                                  >
                                    {money(transferNet)}
                                  </td>

                                  <td
                                    className={cx(
                                      "p-3 text-right font-black",
                                      monthlySaved >= 0
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-rose-700 dark:text-rose-300"
                                    )}
                                  >
                                    {money(monthlySaved)}
                                  </td>

                                  <td
                                    className={cx(
                                      "p-3 text-right font-black",
                                      cumulativeSaved >= 0
                                        ? "text-amber-700 dark:text-amber-300"
                                        : "text-rose-700 dark:text-rose-300"
                                    )}
                                  >
                                    {money(cumulativeSaved)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}


          {/* Deposit modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
              <div className="savings-modal max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white sm:max-w-2xl sm:rounded-3xl">
                <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-5 text-white sm:p-6">
                  <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                  <div className="relative">
                    <div className="mb-2 inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                      টাকা জমা
                    </div>
                    <h3 className="text-xl font-black">সঞ্চয়ে টাকা জমা</h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-50">
                      এটি একটি <b>টাকা আদান-প্রদান</b> লেনদেন হিসেবে সঞ্চয়ে টাকা জমা করবে।
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="সদস্য" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.paidByUserId}
                        onChange={(e) => {
                          const nextUserId = e.target.value;
                          const nextFromAccount = getSourceAccountsForUser(nextUserId)?.[0]?._id || "";
                          const nextToAccount = getSavingsAccountsForUser(nextUserId)?.[0]?._id || "";

                          setForm((p) => ({
                            ...p,
                            paidByUserId: nextUserId,
                            fromAccountId: nextFromAccount,
                            toAccountId: nextToAccount,
                          }));
                        }}
                      >
                        <option value="">সদস্য বাছুন</option>
                        {members.map((m) => (
                          <option key={getId(m)} value={getId(m)}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="তারিখ">
                      <input
                        type="date"
                        className={inputClass()}
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      />
                    </Field>

                    <Field label="টাকা">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass()}
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                        placeholder="e.g., 5000"
                      />
                    </Field>

                    <Field label="যে অ্যাকাউন্ট থেকে" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.fromAccountId}
                        onChange={(e) => setForm((p) => ({ ...p, fromAccountId: e.target.value }))}
                      >
                        <option value="">টাকা আসবে যে অ্যাকাউন্ট থেকে</option>
                        {fromAccountOptions.length === 0 ? (
                          <option value="" disabled>
                            টাকা পাঠানোর অ্যাকাউন্ট নেই
                          </option>
                        ) : (
                          fromAccountOptions.map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.name}
                            </option>
                          ))
                        )}
                      </select>
                      <div className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        এই অ্যাকাউন্ট থেকে টাকা কমবে।
                      </div>
                    </Field>

                    <Field label="কোন সঞ্চয় অ্যাকাউন্টে" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.toAccountId}
                        onChange={(e) => setForm((p) => ({ ...p, toAccountId: e.target.value }))}
                      >
                        <option value="">টাকা জমবে যে অ্যাকাউন্টে</option>
                        {toAccountOptions.length === 0 ? (
                          <option value="" disabled>
                            সঞ্চয় অ্যাকাউন্ট নেই
                          </option>
                        ) : (
                          toAccountOptions.map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.name}
                            </option>
                          ))
                        )}
                      </select>
                      <div className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        সঞ্চয় অ্যাকাউন্টে টাকা বাড়বে।
                      </div>
                    </Field>

                    <Field label="মন্তব্য" className="sm:col-span-2">
                      <input
                        className={inputClass()}
                        value={form.note}
                        onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                        placeholder="যেমন: মাসিক DPS জমা"
                      />
                    </Field>
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-100">জমার পরিমাণ</span>
                      <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">{money(form.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-100/80">
                      সঞ্চয় হলো টাকা স্থানান্তর, সাধারণ খরচ নয়।
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 sm:w-auto"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={saveDeposit}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 lg:hover:-translate-y-0.5 sm:w-auto"
                      disabled={
                        depositSaving || !form.paidByUserId ||
                        !form.fromAccountId ||
                        !form.toAccountId ||
                        !String(form.amount).trim()
                      }
                    >
                      {depositSaving ? 'Saving…' : 'Save Transfer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
          </div>
    </AppLayout>
  );
}
