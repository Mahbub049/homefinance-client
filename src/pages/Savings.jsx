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
  if (t === "investment") return "border-violet-200 bg-violet-50 text-violet-700";
  if (t === "savings") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (t === "wallet") return "border-sky-200 bg-sky-50 text-sky-700";
  if (t === "cash") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatCard({ title, value, sub, accent = "from-emerald-500 to-teal-600", icon = "৳" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-15`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </div>
          <div className="mt-2 text-2xl font-black text-slate-950 break-words">
            {value}
          </div>
          {sub ? <div className="mt-1 text-xs leading-5 text-slate-500 break-words">{sub}</div> : null}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-sm font-black text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 ${extra}`;
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
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100 opacity-60 transition group-hover:scale-110" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-slate-950 break-words">{safeText(account?.name, "Savings Account")}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${accountTypeBadge(account?.type)}`}>
                {accountTypeLabel(account?.type)}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {safeText(account?.owner, "Owner")}
              </span>
            </div>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white shadow-sm">
            S
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Balance</div>
          <div className="mt-1 text-2xl font-black text-slate-950 break-words">{money(balance)}</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${share}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">
            {share}% of total savings balance
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="text-xs font-semibold text-emerald-700">Deposited</div>
            <div className="mt-1 font-black text-emerald-900 break-words">{money(deposited)}</div>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
            <div className="text-xs font-semibold text-rose-700">Withdrawn</div>
            <div className="mt-1 font-black text-rose-900 break-words">{money(withdrawn)}</div>
          </div>
        </div>
      </div>
    </div>
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

      toast.success("Saved as Transfer ✅ (Savings is not expense)");
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
  const netIsPositive = Number(totals.net || 0) >= 0;
  const depositVsWithdrawal = Number(totals.deposited || 0) + Number(totals.withdrawn || 0);
  const netProgress = progressPercent(Math.abs(Number(totals.net || 0)), depositVsWithdrawal || Math.abs(Number(totals.net || 0)));

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-90px)] w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#ecfdf5_0,#f8fafc_32%,#ffffff_70%)] px-3 py-4 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="relative mb-5 overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-5 text-white shadow-xl sm:p-6 lg:p-7">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-24 left-1/2 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-lime-300" />
                Savings Transfer Center
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Savings</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
                Savings is tracked as <b>Transfer</b> such as Bank → DPS. It reduces available cash but stays outside regular expenses.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-[1fr_auto] lg:w-auto">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-11 rounded-2xl border border-white/30 bg-white/95 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:ring-4 focus:ring-white/30"
              />

              <button
                onClick={openDeposit}
                className="h-11 rounded-2xl bg-white px-5 text-sm font-black text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
                title={
                  savingsAccounts.length === 0
                    ? "Create a Savings account first (Settings → Accounts)"
                    : spendAccounts.length === 0
                      ? "Create at least one Bank/Cash account first"
                      : ""
                }
              >
                + Add Deposit
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <Loader text="Loading savings" subtext="Preparing your savings overview" />
        ) : (
          <>
            {/* Stats */}
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Savings Balance"
                value={money(totals.totalBalance)}
                sub={`${totalSavingsAccounts} savings/investment account${totalSavingsAccounts === 1 ? "" : "s"}`}
                accent="from-emerald-500 to-teal-600"
                icon="S"
              />
              <StatCard
                title={`Deposited in ${month}`}
                value={money(totals.deposited)}
                sub="Money moved into savings accounts"
                accent="from-sky-500 to-cyan-600"
                icon="↗"
              />
              <StatCard
                title={`Withdrawn in ${month}`}
                value={money(totals.withdrawn)}
                sub="Money moved out from savings accounts"
                accent="from-rose-500 to-orange-500"
                icon="↙"
              />
              <StatCard
                title={`Net in ${month}`}
                value={money(totals.net)}
                sub="Deposited − Withdrawn"
                accent={netIsPositive ? "from-lime-500 to-emerald-600" : "from-amber-500 to-rose-500"}
                icon={netIsPositive ? "+" : "−"}
              />
            </div>

            {/* Insight strip */}
            <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-950">Monthly Savings Movement</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        A clean view of deposit, withdrawal and net savings for the selected month.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
                      Selected month: {month}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:col-span-2">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        <span>Net movement</span>
                        <span className={netIsPositive ? "text-emerald-600" : "text-rose-600"}>
                          {netIsPositive ? "Positive" : "Negative"}
                        </span>
                      </div>
                      <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${netIsPositive ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-amber-500 to-rose-500"}`}
                          style={{ width: `${netProgress}%` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                          <div className="text-xs text-slate-500">Deposit</div>
                          <div className="font-black text-slate-950">{money(totals.deposited)}</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                          <div className="text-xs text-slate-500">Withdraw</div>
                          <div className="font-black text-slate-950">{money(totals.withdrawn)}</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                          <div className="text-xs text-slate-500">Net</div>
                          <div className={netIsPositive ? "font-black text-emerald-700" : "font-black text-rose-700"}>
                            {money(totals.net)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Quick note</div>
                      <div className="mt-2 text-sm leading-6 text-emerald-950">
                        Deposits are saved as transfer entries, so your ledger keeps the money movement accurate without counting savings as an expense.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">Account Readiness</div>
                    <div className="mt-1 text-xs text-slate-500">Setup status for savings deposits.</div>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm">
                    ✓
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
                    <span className="text-slate-600">Savings / investment accounts</span>
                    <b className="text-slate-950">{savingsAccounts.length}</b>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
                    <span className="text-slate-600">Source spending accounts</span>
                    <b className="text-slate-950">{spendAccounts.length}</b>
                  </div>
                  {(savingsAccounts.length === 0 || spendAccounts.length === 0) && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                      Create at least one savings/investment account and one bank/cash/wallet account from Settings → Accounts.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account cards */}
            <div className="mb-5 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-black text-slate-950">Savings Accounts</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Balance, monthly deposit and withdrawal summary for each savings account.
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search account, owner, type..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:w-72"
                  />
                  <button
                    type="button"
                    onClick={openDeposit}
                    disabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
                    className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Deposit
                  </button>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-100 text-2xl">💰</div>
                  <div className="mt-4 text-base font-black text-slate-950">No savings account found</div>
                  <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Create one from <b>Settings → Accounts</b> and set the type as <b>savings</b> or <b>investment</b>. After that, deposits will appear here.
                  </div>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No account matched your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {filteredList.map((a) => (
                    <AccountCard
                      key={a._id || a.id || a.name}
                      account={a}
                      totalBalance={totals.totalBalance}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Detailed table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-950">Detailed Account Table</div>
                    <div className="mt-1 text-xs text-slate-500">Useful for checking exact balance and monthly movement.</div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {filteredList.length} shown
                  </div>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="p-4 text-sm leading-6 text-slate-600">
                  No savings accounts found. Create one from <b>Settings → Accounts</b> and set type as <b>savings</b> or <b>investment</b>.
                </div>
              ) : (
                <>
                  {/* Mobile view */}
                  <div className="block md:hidden">
                    <div className="divide-y divide-slate-100">
                      {filteredList.map((a) => (
                        <div key={a._id || a.id || a.name} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-black text-slate-950 break-words">{safeText(a.name, "Savings Account")}</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${accountTypeBadge(a.type)}`}>
                                  {accountTypeLabel(a.type)}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">
                                  {safeText(a.owner, "Owner")}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Balance</div>
                              <div className="font-black text-slate-950">{money(a.currentBalance)}</div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                              <div className="text-xs text-emerald-700">Deposited</div>
                              <div className="mt-1 font-black text-emerald-900">{money(a.monthDeposited)}</div>
                            </div>
                            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                              <div className="text-xs text-rose-700">Withdrawn</div>
                              <div className="mt-1 font-black text-rose-900">{money(a.monthWithdrawn)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
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
                          <tr key={a._id || a.id || a.name} className="border-t border-slate-100 transition hover:bg-emerald-50/40">
                            <td className="p-4 font-bold text-slate-950">{safeText(a.name, "Savings Account")}</td>
                            <td className="p-4">
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${accountTypeBadge(a.type)}`}>
                                {accountTypeLabel(a.type)}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600">{safeText(a.owner, "-")}</td>
                            <td className="p-4 text-right font-black text-slate-950">{money(a.currentBalance)}</td>
                            <td className="p-4 text-right font-bold text-emerald-700">{money(a.monthDeposited)}</td>
                            <td className="p-4 text-right font-bold text-rose-700">{money(a.monthWithdrawn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Deposit modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/60 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
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
                    <div className="mt-1.5 text-xs leading-5 text-slate-500">
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
                    <div className="mt-1.5 text-xs leading-5 text-slate-500">
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

                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-emerald-800">Transfer amount</span>
                    <span className="text-lg font-black text-emerald-950">{money(form.amount)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    Savings deposits are not counted as expenses. They are recorded as transfers so your net cashflow stays correct.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDeposit}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
    </AppLayout>
  );
}
