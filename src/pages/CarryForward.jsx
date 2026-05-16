import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function money(n) {
  const x = Number(n || 0);
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function bdt(n) {
  const value = money(n);
  return `৳ ${value.toLocaleString("en-BD", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

const hiddenScrollbarClass =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    wallet: (
      <svg {...common}>
        <path d="M4 7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 1-2-2V7Z" />
        <path d="M16 12h3" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <path d="M3 10h18" />
      </svg>
    ),
    refresh: (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
    lock: (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="10" rx="3" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
    edit: (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M20 19H4" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-3" />
      </svg>
    ),
    account: (
      <svg {...common}>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v9h14v-9" />
        <path d="M9 19v-5h6v5" />
      </svg>
    ),
  };

  return icons[name] || icons.wallet;
}

function IconBox({ name, tone = "emerald" }) {
  const tones = {
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    sky: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20",
    violet:
      "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
    slate:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10",
  };

  return (
    <div
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${tones[tone]}`}
    >
      <Icon name={name} className="h-5 w-5" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ closed, loading }) {
  if (loading) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        Loading
      </span>
    );
  }

  return closed ? (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
      Closed
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
      Open
    </span>
  );
}

function ChangeBadge({ value }) {
  const v = money(value);
  const positive = v > 0;
  const negative = v < 0;

  return (
    <span
      className={[
        "inline-flex min-w-[86px] justify-center rounded-full px-3 py-1 text-xs font-black ring-1",
        positive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20"
          : "",
        negative
          ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20"
          : "",
        !positive && !negative
          ? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
          : "",
      ].join(" ")}
    >
      {positive ? `+${bdt(v)}` : bdt(v)}
    </span>
  );
}

function StatCard({ title, value, sub, icon, tone = "emerald" }) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h4 className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white">
            {value}
          </h4>
          {sub && (
            <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {sub}
            </p>
          )}
        </div>
        <IconBox name={icon} tone={tone} />
      </div>
    </div>
  );
}

export default function CarryForward() {
  const [month, setMonth] = useState(monthNow());
  const [item, setItem] = useState(null);
  const [calc, setCalc] = useState(null);
  const [computed, setComputed] = useState(null);
  const [draftClosing, setDraftClosing] = useState({});
  const [editRow, setEditRow] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setMsg("");
    setErr("");
    setBusy(true);

    try {
      const res = await api.get("/api/month-balance", { params: { month } });

      setItem(res.data.item);
      setComputed(res.data.computed || null);
      setCalc(null);

      const nextDraft = {};
      for (const row of res.data.computed?.accountsClosing || []) {
        nextDraft[String(row.accountId)] = row.balance;
      }
      setDraftClosing(nextDraft);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load carry forward data.");
    } finally {
      setBusy(false);
    }
  }

  async function closeMonth() {
    setMsg("");
    setErr("");
    setBusy(true);

    try {
      const accountBalances = rows.map((row) => ({
        accountId: row.accountId,
        balance: Number(row.editedClosing || 0),
      }));

      const res = await api.post("/api/month-balance/close", {
        month,
        accountBalances,
      });

      setItem(res.data.item);
      setCalc(res.data.calc);

      setComputed((prev) => ({
        ...(prev || {}),
        month,
        openingTotal: res.data.calc?.openingTotal,
        closingTotal: res.data.calc?.closingTotal,
        systemClosingTotal: res.data.calc?.systemClosingTotal,
        accountsOpening: res.data.accounts?.opening || [],
        accountsClosing: res.data.accounts?.closing || [],
        systemAccountsClosing: res.data.accounts?.systemClosing || [],
        summary: {
          income: res.data.calc?.income,
          expense: res.data.calc?.expense,
          transfer: res.data.calc?.transfer,
          netCashflow: res.data.calc?.netCashflow,
        },
      }));

      const nextDraft = {};
      for (const row of res.data.accounts?.closing || []) {
        nextDraft[String(row.accountId)] = row.balance;
      }
      setDraftClosing(nextDraft);

      setMsg("Month closed successfully with account-wise closing balance.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Close month failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const isClosed =
    item?.closingBalance !== null && item?.closingBalance !== undefined;

  const rows = useMemo(() => {
    const opening = computed?.accountsOpening || [];
    const closing = computed?.accountsClosing || [];

    const result = opening.map((o) => {
      const c = closing.find(
        (x) => String(x.accountId) === String(o.accountId)
      );

      const accountId = String(o.accountId);
      const openingAmount = money(o.balance ?? 0);
      const systemClosing = money(c?.systemBalance ?? c?.balance ?? 0);
      const editedClosing = money(
        draftClosing[accountId] ?? c?.balance ?? systemClosing
      );

      return {
        accountId,
        name: o.name,
        type: o.type,
        owner: o.owner,
        opening: openingAmount,
        systemClosing,
        editedClosing,
        change: editedClosing - openingAmount,
        variance: editedClosing - systemClosing,
        manualEdited: money(editedClosing) !== money(systemClosing),
      };
    });

    result.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    return result;
  }, [computed, draftClosing]);

  const totals = useMemo(() => {
    const opening = rows.reduce((sum, row) => sum + Number(row.opening || 0), 0);
    const systemClosing = rows.reduce(
      (sum, row) => sum + Number(row.systemClosing || 0),
      0
    );
    const editedClosing = rows.reduce(
      (sum, row) => sum + Number(row.editedClosing || 0),
      0
    );

    return {
      opening: money(opening),
      systemClosing: money(systemClosing),
      editedClosing: money(editedClosing),
      change: money(editedClosing - opening),
      variance: money(editedClosing - systemClosing),
    };
  }, [rows]);

  const editedCount = rows.filter((row) => row.manualEdited).length;

  function openEdit(row) {
    setEditRow(row);
    setEditAmount(String(row.editedClosing ?? 0));
  }

  function closeEdit() {
    setEditRow(null);
    setEditAmount("");
  }

  function saveEdit() {
    if (!editRow) return;

    const n = Number(editAmount || 0);

    if (Number.isNaN(n)) {
      setErr("Enter a valid balance amount.");
      return;
    }

    setDraftClosing((prev) => ({
      ...prev,
      [editRow.accountId]: money(n),
    }));

    closeEdit();
  }

  function resetAccount(row) {
    setDraftClosing((prev) => ({
      ...prev,
      [row.accountId]: money(row.systemClosing),
    }));
  }

  function resetAllToSystem() {
    const next = {};

    for (const row of rows) {
      next[row.accountId] = money(row.systemClosing);
    }

    setDraftClosing(next);
  }

  return (
    <AppLayout>
      <div
        className={`carry-forward-page min-h-screen w-full max-w-full overflow-x-hidden bg-white px-0 pb-8 text-[13px] text-slate-900 dark:bg-[#020617] dark:text-slate-100 sm:text-sm ${hiddenScrollbarClass}`}
      >
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[radial-gradient(circle_at_top_left,#059669_0%,#065f46_38%,#0f172a_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-6 lg:p-7">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_45%,rgba(255,255,255,0.06))]" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-50 ring-1 ring-white/20 backdrop-blur">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
                    <Icon name="wallet" className="h-3.5 w-3.5" />
                  </span>
                  Month closing
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.65rem] font-black tracking-tight sm:text-3xl lg:text-4xl">
                    Carry Forward
                  </h2>
                  <StatusPill closed={isClosed} loading={!item && busy} />
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Review account-wise closing balances, correct actual cash or
                  bank remaining amounts, and carry the total forward cleanly.
                </p>
              </div>

              <div className="hidden gap-3 md:grid md:grid-cols-3 xl:w-[620px]">
                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                    Opening
                  </div>
                  <div className="mt-1 text-xl font-black">
                    {bdt(totals.opening)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-50/80">
                    Start balance
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                    Actual Closing
                  </div>
                  <div className="mt-1 text-xl font-black">
                    {bdt(totals.editedClosing)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-50/80">
                    Sum of accounts
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                    Adjusted
                  </div>
                  <div className="mt-1 text-xl font-black">{editedCount}</div>
                  <div className="mt-1 text-xs text-emerald-50/80">
                    Edited account(s)
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <IconBox name="calendar" tone="emerald" />
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Closing Control
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    Select a month, edit actual closing balances if needed, then
                    close the month.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                <input
                  type="month"
                  className={fieldClass}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />

                <button
                  type="button"
                  onClick={load}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Icon name="refresh" className="h-4 w-4" />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={closeMonth}
                  disabled={busy || !rows.length}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(255,255,255,0.08)] dark:hover:bg-slate-100"
                >
                  <Icon name="lock" className="h-4 w-4" />
                  {isClosed ? "Update Closing" : "Close Month"}
                </button>
              </div>
            </div>
          </section>

          {msg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              {msg}
            </div>
          )}

          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {err}
            </div>
          )}

          {!item ? (
            <Loader
              text="Loading carry forward"
              subtext="Checking account balances"
            />
          ) : (
            <>
              <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Opening Total"
                  value={bdt(totals.opening)}
                  sub="Month start balance"
                  icon="wallet"
                  tone="emerald"
                />

                <StatCard
                  title="System Closing"
                  value={bdt(totals.systemClosing)}
                  sub="Calculated from transactions"
                  icon="chart"
                  tone="sky"
                />

                <StatCard
                  title="Actual Closing"
                  value={bdt(totals.editedClosing)}
                  sub="Sum of edited accounts"
                  icon="check"
                  tone="violet"
                />

                <StatCard
                  title="Difference"
                  value={bdt(totals.variance)}
                  sub="Actual closing - system closing"
                  icon="edit"
                  tone={totals.variance === 0 ? "emerald" : "amber"}
                />
              </section>

              {computed?.summary && (
                <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Income"
                    value={bdt(computed.summary.income)}
                    sub="This month"
                    icon="wallet"
                    tone="emerald"
                  />
                  <StatCard
                    title="Expense"
                    value={bdt(computed.summary.expense)}
                    sub="This month"
                    icon="wallet"
                    tone="amber"
                  />
                  <StatCard
                    title="Transfers"
                    value={bdt(computed.summary.transfer)}
                    sub="Account movement"
                    icon="refresh"
                    tone="sky"
                  />
                  <StatCard
                    title="Net Cashflow"
                    value={bdt(computed.summary.netCashflow)}
                    sub="Income - expense"
                    icon="chart"
                    tone="violet"
                  />
                </section>
              )}

              <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/70">
                <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <IconBox name="account" tone="sky" />
                      <div>
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">
                          Account-wise Closing Balance
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Edit each account to match actual remaining cash, bank,
                          or wallet balance.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetAllToSystem}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                    >
                      <Icon name="refresh" className="h-4 w-4" />
                      Reset to System
                    </button>
                  </div>
                </div>

                {busy ? (
                  <Loader
                    text="Loading balances"
                    subtext="Preparing account-wise breakdown"
                  />
                ) : rows.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No account balance found.
                  </div>
                ) : (
                  <>
                    <div
                      className={`hidden overflow-x-auto md:block ${hiddenScrollbarClass}`}
                    >
                      <table className="w-full min-w-[960px] text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                          <tr className="text-left">
                            <th className="p-4 font-black">Account</th>
                            <th className="p-4 font-black">Opening</th>
                            <th className="p-4 font-black">System Closing</th>
                            <th className="p-4 font-black">Actual Closing</th>
                            <th className="p-4 font-black">Difference</th>
                            <th className="p-4 text-right font-black">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                          {rows.map((row) => (
                            <tr
                              key={row.accountId}
                              className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                            >
                              <td className="p-4">
                                <div className="font-black text-slate-950 dark:text-white">
                                  {row.name}
                                </div>
                                <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {row.owner || "-"} • {row.type || "-"}
                                </div>
                              </td>

                              <td className="p-4 font-black text-slate-800 dark:text-slate-100">
                                {bdt(row.opening)}
                              </td>

                              <td className="p-4 font-black text-slate-800 dark:text-slate-100">
                                {bdt(row.systemClosing)}
                              </td>

                              <td className="p-4">
                                <div className="font-black text-slate-950 dark:text-white">
                                  {bdt(row.editedClosing)}
                                </div>
                                {row.manualEdited && (
                                  <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                                    Manually adjusted
                                  </div>
                                )}
                              </td>

                              <td className="p-4">
                                <ChangeBadge value={row.variance} />
                              </td>

                              <td className="p-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(row)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                  >
                                    <Icon name="edit" className="h-3.5 w-3.5" />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => resetAccount(row)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        <tfoot className="border-t border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-slate-950/50">
                          <tr>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              Total
                            </td>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              {bdt(totals.opening)}
                            </td>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              {bdt(totals.systemClosing)}
                            </td>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              {bdt(totals.editedClosing)}
                            </td>
                            <td className="p-4">
                              <ChangeBadge value={totals.variance} />
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="space-y-3 p-3 md:hidden">
                      {rows.map((row) => (
                        <article
                          key={row.accountId}
                          className="rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[15px] font-black leading-5 text-slate-950 dark:text-white">
                                {row.name}
                              </h4>

                              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {row.owner || "-"} • {row.type || "-"}
                              </p>
                            </div>

                            <ChangeBadge value={row.variance} />
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                Opening
                              </p>
                              <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                                {bdt(row.opening)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                Actual
                              </p>
                              <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                                {bdt(row.editedClosing)}
                              </p>
                            </div>
                          </div>

                          {row.manualEdited && (
                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                              System: {bdt(row.systemClosing)} • adjusted by{" "}
                              {bdt(row.variance)}
                            </div>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <Icon name="edit" className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => resetAccount(row)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-black text-amber-700 transition hover:bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
                            >
                              Reset
                            </button>
                          </div>
                        </article>
                      ))}

                      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
                          Total Actual Closing
                        </p>
                        <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-100">
                          {bdt(totals.editedClosing)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700/80 dark:text-emerald-200/80">
                          This total is automatically calculated from all account
                          balances.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {calc && (
                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-5">
                  <div className="flex items-start gap-3">
                    <IconBox name="check" tone="emerald" />
                    <div>
                      <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-100">
                        Closing Saved
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-emerald-700/80 dark:text-emerald-200/80">
                        Opening: {bdt(calc.openingTotal)} • Closing:{" "}
                        {bdt(calc.closingTotal)} • Manual adjusted:{" "}
                        {calc.manualAdjusted ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                Recommendation: close the month only after entering all income,
                expense, transfer, grocery, EMI, and wallet records. Then edit
                the account balances only if the actual remaining amount differs
                from the system calculation.
              </div>
            </>
          )}
        </div>

        {editRow && (
          <div className="app-modal-overlay--center">
            <div
              className={`app-modal-panel max-h-[92vh] max-w-md overflow-y-auto rounded-[30px] border border-white/70 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950 ${hiddenScrollbarClass}`}
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="flex items-start gap-3">
                    <IconBox name="edit" tone="amber" />
                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                        Closing correction
                      </div>

                      <h3 className="text-xl font-black text-slate-950 dark:text-white">
                        Edit Account Closing
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {editRow.name} • {editRow.owner || "-"} •{" "}
                        {editRow.type || "-"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeEdit}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      System Closing
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                      {bdt(editRow.systemClosing)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      Opening
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                      {bdt(editRow.opening)}
                    </p>
                  </div>
                </div>

                <Field label="Actual Closing Balance">
                  <input
                    type="number"
                    step="0.01"
                    className={fieldClass}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Enter actual remaining balance"
                  />
                </Field>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  The total closing balance will update automatically from this
                  amount.
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveEdit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    Save Balance
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