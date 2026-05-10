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

function statusTone(value) {
  const n = safeNumber(value);
  if (n > 0) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (n < 0) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function initials(name = "") {
  const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100" />
      <div className="relative animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="h-5 w-36 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="h-11 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="mt-3 h-5 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="mt-5 h-2 w-full rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function SummaryCard({ title, value, sub, accent = "from-sky-500 to-indigo-600", icon = "৳" }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-15 transition group-hover:scale-110`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </div>
          <div className="mt-2 text-2xl font-black text-slate-950 break-words">
            {value}
          </div>
          {sub ? <div className="mt-1 text-xs leading-5 text-slate-500 break-words">{sub}</div> : null}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-sm font-black text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : tone === "rose"
        ? "border-rose-100 bg-rose-50 text-rose-800"
        : tone === "sky"
          ? "border-sky-100 bg-sky-50 text-sky-800"
          : tone === "violet"
            ? "border-violet-100 bg-violet-50 text-violet-800"
            : "border-slate-100 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-75">{label}</div>
      <div className="mt-1 text-sm font-black break-words sm:text-base">{value}</div>
    </div>
  );
}

function WalletPersonCard({ user, maxAbsNet }) {
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
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-5">
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${netPositive ? "bg-emerald-100" : "bg-rose-100"} opacity-70 transition group-hover:scale-110`} />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black text-white shadow-sm ${netPositive ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-rose-500 to-pink-600"}`}>
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-950 break-words">{user.name}</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {netPositive ? "Paid more than personal share" : "Needs to balance the month"}
              </p>
            </div>
          </div>

          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black ${statusTone(net)}`}>
            Net {netPositive ? "+" : ""}{formatMoney(net)}
          </span>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Remaining Balance</div>
              <div className="mt-1 text-3xl font-black text-slate-950 break-words">{formatMoney(remaining)}</div>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Share coverage: <b className="text-slate-900">{shareCoverage}%</b>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-2xl border border-emerald-100 bg-white p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Income + Transfer In</div>
              <div className="mt-1 font-black text-emerald-900 break-words">{formatMoney(income + transferIn)}</div>
            </div>
            <div className="hidden h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-xs font-black text-white sm:grid">VS</div>
            <div className="rounded-2xl border border-rose-100 bg-white p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Share + Transfer Out</div>
              <div className="mt-1 font-black text-rose-900 break-words">{formatMoney(share + transferOut)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MiniMetric label="Income" value={formatMoney(income)} tone="emerald" />
          <MiniMetric label="Paid Expense" value={formatMoney(paid)} tone="violet" />
          <MiniMetric label="Expense Share" value={formatMoney(share)} tone="rose" />
          <MiniMetric label="Transfer In" value={formatMoney(transferIn)} tone="sky" />
          <MiniMetric label="Transfer Out" value={formatMoney(transferOut)} tone="rose" />
          <MiniMetric label="Transfer Net" value={formatMoney(transferNet)} tone={transferNet >= 0 ? "emerald" : "rose"} />
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between gap-2 text-xs font-semibold text-slate-500">
            <span>Net impact</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${netPositive ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-pink-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
          Same-owner transfers are ignored for personal settlement. Cross-owner transfers reduce one person and increase the other.
        </div>
      </div>
    </div>
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
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load wallet summary"
      );
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
      <div className="mx-auto w-full max-w-full overflow-x-hidden px-3 pb-8 sm:px-4 lg:px-6">
        <div className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-sky-900 to-indigo-900 p-5 text-white shadow-xl sm:p-7">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-sky-100 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Owner-aware wallet summary
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                Wallet Summary
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-100 sm:text-base">
                Track income, expenses, transfers, remaining balance, and month-end settlement in one clean view.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
              <label className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <span className="block text-xs font-bold uppercase tracking-wide text-sky-100">Month</span>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-1 w-full min-w-0 bg-transparent text-base font-bold text-white outline-none [color-scheme:dark]"
                />
              </label>

              <button
                onClick={load}
                disabled={loading}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh Summary"}
              </button>
            </div>
          </div>
        </div>

        {err && (
          <div className="mb-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
            <div className="font-black">Couldn’t load data</div>
            <div className="mt-1 text-sm break-words">{err}</div>
          </div>
        )}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Income"
            value={formatMoney(totals.income)}
            sub={shortMonth(month)}
            icon="IN"
            accent="from-emerald-500 to-teal-600"
          />
          <SummaryCard
            title="Expense Share"
            value={formatMoney(totals.share)}
            sub="Split-aware total share"
            icon="EX"
            accent="from-rose-500 to-pink-600"
          />
          <SummaryCard
            title="Remaining"
            value={formatMoney(totals.remaining)}
            sub="Income − share + transfer net"
            icon="RM"
            accent="from-sky-500 to-indigo-600"
          />
          <SummaryCard
            title="Settlement Gap"
            value={formatMoney(Math.max(totals.surplus, totals.deficit))}
            sub="Amount needed to balance"
            icon="↔"
            accent="from-amber-500 to-orange-600"
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-950">Monthly Flow Overview</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Total money movement for {shortMonth(month)} from the wallet summary data.
                </p>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 lg:max-w-xs"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniMetric label="Paid Expenses" value={formatMoney(totals.paid)} tone="violet" />
              <MiniMetric label="Transfer In" value={formatMoney(totals.transferIn)} tone="sky" />
              <MiniMetric label="Transfer Out" value={formatMoney(totals.transferOut)} tone="rose" />
              <MiniMetric label="Transfer Net" value={formatMoney(totals.transferNet)} tone={totals.transferNet >= 0 ? "emerald" : "rose"} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-black text-slate-950">Quick Insight</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Highest Surplus</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-emerald-950 break-words">{topSurplus?.name || "-"}</span>
                  <span className="font-black text-emerald-950">{formatMoney(topSurplus?.net || 0)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-rose-700">Highest Deficit</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-rose-950 break-words">{topDeficit?.name || "-"}</span>
                  <span className="font-black text-rose-950">{formatMoney(topDeficit?.net || 0)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Use the settlement suggestion below to balance shared expenses after cross-owner transfers.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading && !data ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : !data ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              No wallet data yet. Add income, expenses, or transfer entries first.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm xl:col-span-2">
              No member matched your search.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <WalletPersonCard key={u.userId} user={u} maxAbsNet={maxAbsNet} />
            ))
          )}
        </div>

        {data?.settlement ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 shadow-sm sm:p-6">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-200/40 blur-2xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700">
                  Settlement Suggestion
                </div>
                <h4 className="mt-3 text-xl font-black text-amber-950">Quick way to balance this month</h4>
                <p className="mt-1 text-sm leading-6 text-amber-900/80">
                  This suggestion uses the calculated net position of each member.
                </p>
              </div>

              <div className="w-full rounded-3xl border border-amber-200 bg-white p-4 shadow-sm lg:max-w-xl">
                <p className="text-sm leading-7 text-slate-700 break-words">
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 font-black text-rose-700">
                    {nameById.get(String(data.settlement.fromUserId)) ||
                      `User ${data.settlement.fromUserId}`}
                  </span>{" "}
                  should pay{" "}
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-black text-emerald-700">
                    {nameById.get(String(data.settlement.toUserId)) ||
                      `User ${data.settlement.toUserId}`}
                  </span>{" "}
                  <span className="font-black text-slate-950">
                    {formatMoney(data.settlement.amount)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : data ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 shadow-sm">
            <div className="font-black">No settlement needed</div>
            <div className="mt-1">This month already looks balanced based on the available wallet summary.</div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
