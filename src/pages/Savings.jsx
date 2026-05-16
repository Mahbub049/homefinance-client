import { useEffect, useMemo, useState } from "react";
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
            Current Balance
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
            {share}% of total savings balance
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">Deposited</div>
            <div className="mt-1 break-words font-black text-emerald-900 dark:text-emerald-100">{money(deposited)}</div>
          </div>

          <div className="hidden rounded-2xl border border-rose-100 bg-rose-50 p-3 dark:border-rose-400/20 dark:bg-rose-400/10 sm:block">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-200">Withdrawn</div>
            <div className="mt-1 break-words font-black text-rose-900 dark:text-rose-100">{money(withdrawn)}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Savings() {
  const [month, setMonth] = useState(monthNow());
  const [allAccounts, setAllAccounts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    note: "",
  });

  const savingsAccounts = useMemo(
    () =>
      allAccounts.filter(
        (a) => ["savings", "investment"].includes(a.type) && a.isActive !== false
      ),
    [allAccounts]
  );

  const spendAccounts = useMemo(
    () =>
      allAccounts.filter(
        (a) => !["savings", "investment"].includes(a.type) && a.isActive !== false
      ),
    [allAccounts]
  );

  async function loadAccounts() {
    const res = await api.get("/api/accounts");
    setAllAccounts(res.data.items || []);
  }

  async function loadOverview(m) {
    const res = await api.get("/api/savings/overview", { params: { month: m } });
    setOverview(res.data);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await loadAccounts();
      await loadOverview(month);
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
        await loadOverview(month);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load overview");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function openDeposit() {
    const from = spendAccounts?.[0]?._id || "";
    const to = savingsAccounts?.[0]?._id || "";

    setForm({
      date: todayISO(),
      fromAccountId: from,
      toAccountId: to,
      amount: "",
      note: "",
    });

    setModalOpen(true);
  }

  async function saveDeposit() {
    try {
      if (!form.fromAccountId || !form.toAccountId) {
        toast.error("Select From and To accounts");
        return;
      }

      const amt = Number(form.amount);
      if (!amt || amt <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      await api.post("/api/savings/deposit", {
        date: form.date,
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: amt,
        note: form.note,
      });

      toast.success("Saved as Transfer ✅");
      setModalOpen(false);
      await loadOverview(month);
      await loadAccounts();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
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

  return (
    <AppLayout>
      <main className="savings-page min-h-[calc(100vh-64px)] w-full overflow-x-hidden bg-slate-50 px-2 py-3 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="mx-auto w-full space-y-4 sm:space-y-5">
          {/* Header */}
          <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 p-4 text-white shadow-xl dark:border dark:border-white/10 sm:rounded-3xl sm:p-6 lg:p-7">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-24 left-1/2 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 hidden w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-lime-300" />
                  Savings Transfer Center
                </div>

                <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Savings</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-emerald-50 sm:text-base sm:leading-6">
                  Track savings transfers such as Bank → DPS without counting them as regular expenses.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-[1fr_auto] lg:w-auto lg:min-w-[420px]">
                <label
                  onClick={openNativePicker}
                  className="cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur sm:p-3"
                >
                  <span className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-50 sm:text-xs">
                    <Icon name="calendar" className="h-3.5 w-3.5" />
                    Month
                  </span>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    onClick={(e) => {
                      e.currentTarget.focus();
                      e.currentTarget.showPicker?.();
                    }}
                    className="w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] sm:text-base"
                    aria-label="Select month"
                  />
                </label>

                <button
                  onClick={openDeposit}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-emerald-700 shadow-lg transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[58px] sm:px-5 sm:text-sm lg:hover:-translate-y-0.5"
                  disabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
                  title={
                    savingsAccounts.length === 0
                      ? "Create a Savings account first (Settings → Accounts)"
                      : spendAccounts.length === 0
                        ? "Create at least one Bank/Cash account first"
                        : ""
                  }
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Deposit
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <Loader text="Loading savings" subtext="Preparing your savings overview" />
          ) : (
            <>
              {/* Stats */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Savings Balance"
                  value={money(totals.totalBalance)}
                  sub={`${totalSavingsAccounts} savings/investment account${totalSavingsAccounts === 1 ? "" : "s"}`}
                  accent="from-emerald-500 to-teal-600"
                  icon="wallet"
                />
                <StatCard
                  title={`Deposited in ${monthLabel(month)}`}
                  value={money(totals.deposited)}
                  sub="Money moved into savings accounts"
                  accent="from-sky-500 to-cyan-600"
                  icon="arrowUp"
                />
                <StatCard
                  title={`Withdrawn in ${monthLabel(month)}`}
                  value={money(totals.withdrawn)}
                  sub="Money moved out from savings accounts"
                  accent="from-rose-500 to-orange-500"
                  icon="arrowDown"
                  hideOnMobile
                />
                <StatCard
                  title={`Net in ${monthLabel(month)}`}
                  value={money(totals.net)}
                  sub="Deposited − Withdrawn"
                  accent={Number(totals.net || 0) >= 0 ? "from-lime-500 to-emerald-600" : "from-amber-500 to-rose-500"}
                  icon={Number(totals.net || 0) >= 0 ? "+" : "−"}
                  hideOnMobile
                />
              </section>

              {/* Account cards */}
              <section className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-lg font-black text-slate-950 dark:text-white">Savings Accounts</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                      Balance and monthly deposit summary for each savings account.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative w-full sm:w-72">
                      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search account, owner, type..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/10"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openDeposit}
                      disabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
                      className="hidden h-11 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:inline-flex sm:items-center sm:justify-center"
                    >
                      + Deposit
                    </button>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40 sm:p-8">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-100 text-2xl dark:bg-emerald-400/10">
                      <Icon name="wallet" className="h-7 w-7 text-emerald-700 dark:text-emerald-200" />
                    </div>
                    <div className="mt-4 text-base font-black text-slate-950 dark:text-white">No savings account found</div>
                    <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Create one from <b>Settings → Accounts</b> and set the type as <b>savings</b> or <b>investment</b>.
                    </div>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
                    No account matched your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                    {filteredList.map((a) => (
                      <AccountCard
                        key={a._id || a.id || a.name}
                        account={a}
                        totalBalance={totals.totalBalance}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Desktop detailed table only */}
              <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:block">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50 p-4 dark:border-white/10 dark:from-slate-900 dark:to-emerald-950/30 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-950 dark:text-white">Detailed Account Table</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Desktop-only detailed balance and monthly movement.
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      {filteredList.length} shown
                    </div>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="p-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    No savings accounts found. Create one from <b>Settings → Accounts</b> and set type as <b>savings</b> or <b>investment</b>.
                  </div>
                ) : (
                  <div className="overflow-x-auto savings-no-scrollbar">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950/60">
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <th className="p-4">Account</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Owner</th>
                          <th className="p-4 text-right">Balance</th>
                          <th className="p-4 text-right">Deposited</th>
                          <th className="p-4 text-right">Withdrawn</th>
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
                      Transfer Entry
                    </div>
                    <h3 className="text-xl font-black">Add Savings Transfer</h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-50">
                      This will create a <b>Transfer</b> transaction and move money into a savings or investment account.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Date">
                      <input
                        type="date"
                        className={inputClass()}
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      />
                    </Field>

                    <Field label="Amount">
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

                    <Field label="From Account" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.fromAccountId}
                        onChange={(e) => setForm((p) => ({ ...p, fromAccountId: e.target.value }))}
                      >
                        <option value="">Select source account</option>
                        {spendAccounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({accountTypeLabel(a.type)})
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        This account balance will be reduced because money is being moved out.
                      </div>
                    </Field>

                    <Field label="To Savings / Investment" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.toAccountId}
                        onChange={(e) => setForm((p) => ({ ...p, toAccountId: e.target.value }))}
                      >
                        <option value="">Select destination account</option>
                        {savingsAccounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({accountTypeLabel(a.type)})
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        This account balance will be increased as your saved amount.
                      </div>
                    </Field>

                    <Field label="Note" className="sm:col-span-2">
                      <input
                        className={inputClass()}
                        value={form.note}
                        onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                        placeholder="e.g., DPS deposit, emergency fund, monthly savings"
                      />
                    </Field>
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-100">Transfer amount</span>
                      <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">{money(form.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-100/80">
                      Savings deposits are recorded as transfers, not regular expenses.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveDeposit}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 lg:hover:-translate-y-0.5 sm:w-auto"
                      disabled={!form.fromAccountId || !form.toAccountId || !String(form.amount).trim()}
                    >
                      Save Transfer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
