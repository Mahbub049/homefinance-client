import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Loader from "../components/ui/Loader";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function yearNow() {
  return new Date().getFullYear();
}

function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n) {
  const x = safeNum(n);
  return x.toFixed(2).replace(/\.00$/, "");
}

function tk(n) {
  const x = safeNum(n);
  const abs = Math.abs(x).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return x < 0 ? `-৳ ${abs}` : `৳ ${abs}`;
}

function compactTk(n) {
  const value = safeNum(n);
  const abs = Math.abs(value);

  if (abs >= 10000000) return `${value < 0 ? "-" : ""}৳${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${value < 0 ? "-" : ""}৳${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${value < 0 ? "-" : ""}৳${(abs / 1000).toFixed(1)}K`;
  return `${value < 0 ? "-" : ""}৳${abs}`;
}

function monthLabel(month) {
  if (!month) return "-";
  const parts = String(month).split("-");
  if (parts.length < 2) return month;

  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

function AmountText({ value, bold = false, color = false }) {
  const n = safeNum(value);
  const cls = [
    "tabular-nums",
    bold ? "font-semibold" : "",
    color
      ? n >= 0
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-rose-700 dark:text-rose-300"
      : "text-slate-800 dark:text-slate-100",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={cls}>{tk(n)}</span>;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
      <div className="mb-2 font-semibold text-slate-900 dark:text-white">{label}</div>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-5">
            <span className="text-slate-500 dark:text-slate-400">{entry.name || entry.dataKey}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{tk(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function YearOverview() {
  const [year, setYear] = useState(yearNow());
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setMsg("");
      setLoading(true);
      const res = await api.get("/api/year-overview", { params: { year } });
      setData(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load year overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const months = data?.months || [];
  const totals = data?.totals || {};

  const chartData = useMemo(() => {
    return months.map((m) => ({
      ...m,
      label: monthLabel(m.month),
      income: safeNum(m.income),
      expense: safeNum(m.expense),
      transfer: safeNum(m.transfer),
      netCashflow: safeNum(m.netCashflow),
      savingsIn: safeNum(m.savingsIn),
      savingsOut: safeNum(m.savingsOut),
      savingsGrowth: safeNum(m.savingsGrowth),
      savingsRate: safeNum(m.savingsRate),
      openingBalance: safeNum(m.openingBalance),
      closingBalance:
        typeof m.closingBalance === "number" ? safeNum(m.closingBalance) : null,
    }));
  }, [months]);

  const analytics = useMemo(() => {
    const activeMonths = months.length || 1;
    const income = safeNum(totals.income);
    const expense = safeNum(totals.expense);
    const net = safeNum(totals.netCashflow);
    const savingsGrowth = safeNum(totals.savingsGrowth);

    const bestNetMonth = months.reduce(
      (best, current) =>
        safeNum(current.netCashflow) > safeNum(best?.netCashflow) ? current : best,
      months[0] || null
    );

    const lowestNetMonth = months.reduce(
      (worst, current) =>
        safeNum(current.netCashflow) < safeNum(worst?.netCashflow) ? current : worst,
      months[0] || null
    );

    const highestIncomeMonth = months.reduce(
      (best, current) =>
        safeNum(current.income) > safeNum(best?.income) ? current : best,
      months[0] || null
    );

    const highestExpenseMonth = months.reduce(
      (best, current) =>
        safeNum(current.expense) > safeNum(best?.expense) ? current : best,
      months[0] || null
    );

    const positiveMonths = months.filter((m) => safeNum(m.netCashflow) >= 0).length;
    const expenseRatio = income > 0 ? Math.round((expense / income) * 100) : 0;
    const netRatio = income > 0 ? Math.round((net / income) * 100) : 0;
    const growthRatio = income > 0 ? Math.round((savingsGrowth / income) * 100) : 0;

    return {
      averageIncome: income / activeMonths,
      averageExpense: expense / activeMonths,
      averageNet: net / activeMonths,
      bestNetMonth,
      lowestNetMonth,
      highestIncomeMonth,
      highestExpenseMonth,
      positiveMonths,
      expenseRatio,
      netRatio,
      growthRatio,
    };
  }, [months, totals]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1600px] px-2 pb-8 sm:px-4 lg:px-6">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-2xl shadow-indigo-500/20 dark:border-slate-700 dark:from-slate-900 dark:via-indigo-950 dark:to-fuchsia-950 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Yearly financial performance
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
                Year Overview {year}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80 sm:text-base">
                Review income, expenses, savings movement, net cashflow, and month-by-month performance in one clean view.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] xl:w-auto">
              <div className="rounded-2xl border border-white/20 bg-white/15 p-3 backdrop-blur">
                <label className="mb-1 block text-xs font-medium text-white/70">Select year</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-0 transition focus:border-white dark:bg-slate-950 dark:text-white sm:w-36"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  max="2100"
                />
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-indigo-800"
              >
                {loading ? "Refreshing..." : "Refresh Report"}
              </button>
            </div>
          </div>

          {data && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroMini label="Total income" value={tk(totals.income)} />
              <HeroMini label="Total expense" value={tk(totals.expense)} />
              <HeroMini label="Net cashflow" value={tk(totals.netCashflow)} />
              <HeroMini label="Savings rate" value={`${fmt(totals.savingsRate)}%`} />
            </div>
          )}
        </section>

        {msg && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {msg}
          </div>
        )}

        {loading && !data ? (
          <Loader text="Loading year overview" subtext="Preparing your 12-month summary" />
        ) : !data ? (
          <EmptyState title="No yearly data found" message="Select a year and refresh to generate the overview." />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Income"
                value={tk(totals.income)}
                subtitle={`Average ${tk(analytics.averageIncome)} / month`}
                tone="income"
              />
              <StatCard
                title="Total Expense"
                value={tk(totals.expense)}
                subtitle={`${analytics.expenseRatio}% of yearly income`}
                tone="expense"
              />
              <StatCard
                title="Net Cashflow"
                value={tk(totals.netCashflow)}
                subtitle={`${analytics.positiveMonths}/${months.length || 0} positive months`}
                tone={safeNum(totals.netCashflow) >= 0 ? "positive" : "danger"}
              />
              <StatCard
                title="Savings Growth"
                value={tk(totals.savingsGrowth)}
                subtitle={`Savings rate ${fmt(totals.savingsRate)}%`}
                tone="savings"
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Panel
                title="Yearly Cashflow Trend"
                subtitle="Income, expense, and net movement across the full year"
                className="xl:col-span-2"
              >
                {chartData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={compactTk} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#incomeFill)" strokeWidth={3} dot={false} />
                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#fb7185" fill="url(#expenseFill)" strokeWidth={3} dot={false} />
                        <Bar dataKey="netCashflow" name="Net Cashflow" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={22} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel title="Financial Health" subtitle="Quick yearly signals">
                <div className="space-y-4">
                  <HealthBar
                    label="Expense Ratio"
                    value={analytics.expenseRatio}
                    helper="Lower is better"
                    tone={analytics.expenseRatio <= 70 ? "good" : analytics.expenseRatio <= 90 ? "warn" : "bad"}
                  />
                  <HealthBar
                    label="Net Cashflow Ratio"
                    value={analytics.netRatio}
                    helper="Positive means surplus"
                    tone={analytics.netRatio >= 20 ? "good" : analytics.netRatio >= 0 ? "warn" : "bad"}
                  />
                  <HealthBar
                    label="Savings Growth Ratio"
                    value={analytics.growthRatio}
                    helper="Savings growth vs income"
                    tone={analytics.growthRatio >= 20 ? "good" : analytics.growthRatio >= 5 ? "warn" : "bad"}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <InsightCard
                    label="Best net month"
                    title={analytics.bestNetMonth?.month || "-"}
                    value={tk(analytics.bestNetMonth?.netCashflow)}
                    tone="green"
                  />
                  <InsightCard
                    label="Highest expense"
                    title={analytics.highestExpenseMonth?.month || "-"}
                    value={tk(analytics.highestExpenseMonth?.expense)}
                    tone="rose"
                  />
                </div>
              </Panel>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel title="Savings Movement" subtitle="Savings in, out, and growth by month">
                {chartData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={compactTk} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="savingsIn" name="Savings In" fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="savingsOut" name="Savings Out" fill="#f97316" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="savingsGrowth" name="Growth" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel title="Balance Journey" subtitle="Opening vs closing balance movement">
                {chartData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={compactTk} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="openingBalance" name="Opening" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="closingBalance" name="Closing" stroke="#a855f7" strokeWidth={3} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>
            </div>

            <Panel
              title="Monthly Performance Cards"
              subtitle="Compact view for all 12 months"
              className="mb-6"
              right={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{months.length} months</span>}
            >
              {months.length === 0 ? (
                <EmptyState title="No monthly records" message="No income or expense data found for this year." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {months.map((m) => (
                    <MonthCard key={m.month} month={m} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Detailed Monthly Breakdown" subtitle="Full yearly table with totals">
              <div className="hidden overflow-auto xl:block">
                <table className="min-w-[1150px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                      <th className="p-4">Month</th>
                      <th className="p-4">Income</th>
                      <th className="p-4">Expense</th>
                      <th className="p-4">Transfers</th>
                      <th className="p-4">Net Cashflow</th>
                      <th className="p-4">Savings In</th>
                      <th className="p-4">Savings Out</th>
                      <th className="p-4">Savings Growth</th>
                      <th className="p-4">Savings %</th>
                      <th className="p-4">Opening</th>
                      <th className="p-4">Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {months.map((m) => (
                      <tr key={m.month} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{m.month}</td>
                        <td className="p-4"><AmountText value={m.income} /></td>
                        <td className="p-4"><AmountText value={m.expense} /></td>
                        <td className="p-4"><AmountText value={m.transfer} /></td>
                        <td className="p-4"><AmountText value={m.netCashflow} bold color /></td>
                        <td className="p-4"><AmountText value={m.savingsIn} /></td>
                        <td className="p-4"><AmountText value={m.savingsOut} /></td>
                        <td className="p-4"><AmountText value={m.savingsGrowth} bold color /></td>
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{fmt(m.savingsRate)}%</td>
                        <td className="p-4"><AmountText value={m.openingBalance} /></td>
                        <td className="p-4">
                          {typeof m.closingBalance === "number" ? <AmountText value={m.closingBalance} /> : <span className="text-slate-400">-</span>}
                        </td>
                      </tr>
                    ))}

                    <tr className="border-t-2 border-slate-300 bg-gradient-to-r from-slate-50 to-indigo-50 font-bold dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/70">
                      <td className="p-4 text-slate-900 dark:text-white">TOTAL</td>
                      <td className="p-4">{tk(totals.income)}</td>
                      <td className="p-4">{tk(totals.expense)}</td>
                      <td className="p-4">{tk(totals.transfer)}</td>
                      <td className="p-4">{tk(totals.netCashflow)}</td>
                      <td className="p-4">{tk(totals.savingsIn)}</td>
                      <td className="p-4">{tk(totals.savingsOut)}</td>
                      <td className="p-4">{tk(totals.savingsGrowth)}</td>
                      <td className="p-4">{fmt(totals.savingsRate)}%</td>
                      <td className="p-4">—</td>
                      <td className="p-4">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="xl:hidden">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {months.map((m) => (
                    <MobileBreakdownCard key={m.month} month={m} />
                  ))}
                </div>

                <div className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
                  <div className="mb-3 text-sm font-bold text-indigo-900 dark:text-indigo-100">TOTAL</div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <TotalMini label="Income" value={totals.income} />
                    <TotalMini label="Expense" value={totals.expense} />
                    <TotalMini label="Transfers" value={totals.transfer} />
                    <TotalMini label="Net" value={totals.netCashflow} />
                    <TotalMini label="Savings In" value={totals.savingsIn} />
                    <TotalMini label="Savings Out" value={totals.savingsOut} />
                    <TotalMini label="Growth" value={totals.savingsGrowth} />
                    <div className="rounded-2xl border border-white/60 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Savings %</div>
                      <div className="mt-1 font-bold text-slate-900 dark:text-white">{fmt(totals.savingsRate)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function HeroMini({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-wide text-white/65">{label}</div>
      <div className="mt-1 text-xl font-black text-white sm:text-2xl">{value}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle, tone = "neutral" }) {
  const tones = {
    income: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700 dark:from-emerald-950/40 dark:to-teal-950/30 dark:border-emerald-900/50 dark:text-emerald-300",
    expense: "from-rose-50 to-pink-50 border-rose-100 text-rose-700 dark:from-rose-950/40 dark:to-pink-950/30 dark:border-rose-900/50 dark:text-rose-300",
    positive: "from-blue-50 to-indigo-50 border-blue-100 text-blue-700 dark:from-blue-950/40 dark:to-indigo-950/30 dark:border-blue-900/50 dark:text-blue-300",
    danger: "from-red-50 to-orange-50 border-red-100 text-red-700 dark:from-red-950/40 dark:to-orange-950/30 dark:border-red-900/50 dark:text-red-300",
    savings: "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700 dark:from-violet-950/40 dark:to-fuchsia-950/30 dark:border-violet-900/50 dark:text-violet-300",
    neutral: "from-slate-50 to-white border-slate-100 text-slate-700 dark:from-slate-900 dark:to-slate-950 dark:border-slate-800 dark:text-slate-300",
  };

  return (
    <div className={`overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-sm ${tones[tone] || tones.neutral}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide opacity-80">{title}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{value}</div>
          {subtitle && <div className="mt-2 text-xs font-medium opacity-80">{subtitle}</div>}
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/70 shadow-inner dark:bg-white/10" />
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "", right = null }) {
  return (
    <section className={`rounded-[1.7rem] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-5 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">{title}</h3>
          {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function HealthBar({ label, value, helper, tone = "good" }) {
  const normalized = Math.max(0, Math.min(100, Math.abs(safeNum(value))));
  const color =
    tone === "good"
      ? "from-emerald-400 to-teal-500"
      : tone === "warn"
        ? "from-amber-400 to-orange-500"
        : "from-rose-400 to-pink-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{helper}</div>
        </div>
        <div className="text-sm font-black text-slate-900 dark:text-white">{value}%</div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ label, title, value, tone = "green" }) {
  const cls =
    tone === "rose"
      ? "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
      : "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{title}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function MonthCard({ month }) {
  const income = safeNum(month.income);
  const expense = safeNum(month.expense);
  const net = safeNum(month.netCashflow);
  const savingsRate = safeNum(month.savingsRate);
  const expensePct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
  const positive = net >= 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-950 dark:text-white">{month.month}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{positive ? "Surplus month" : "Deficit month"}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${positive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>
          {positive ? "+" : ""}{tk(net)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Mini label="Income" value={income} />
        <Mini label="Expense" value={expense} />
        <Mini label="Savings Growth" value={month.savingsGrowth} />
        <div className="rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Savings %</div>
          <div className="mt-1 font-black text-slate-900 dark:text-white">{fmt(savingsRate)}%</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Expense vs Income</span>
          <span>{expensePct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-full rounded-full ${expensePct <= 70 ? "bg-emerald-500" : expensePct <= 90 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${expensePct}%` }} />
        </div>
      </div>
    </div>
  );
}

function MobileBreakdownCard({ month }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-black text-slate-950 dark:text-white">{month.month}</div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Savings {fmt(month.savingsRate)}%</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Mini label="Income" value={month.income} />
        <Mini label="Expense" value={month.expense} />
        <Mini label="Transfers" value={month.transfer} />
        <Mini label="Net Cashflow" value={month.netCashflow} color />
        <Mini label="Savings In" value={month.savingsIn} />
        <Mini label="Savings Out" value={month.savingsOut} />
        <Mini label="Savings Growth" value={month.savingsGrowth} color />
        <Mini label="Opening" value={month.openingBalance} />
        <div className="col-span-2">
          <Mini label="Closing" value={typeof month.closingBalance === "number" ? month.closingBalance : 0} />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, color = false }) {
  const n = safeNum(value);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 font-bold break-words ${color ? (n >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300") : "text-slate-900 dark:text-white"}`}>
        {tk(n)}
      </div>
    </div>
  );
}

function TotalMini({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 font-bold text-slate-900 dark:text-white">{tk(value)}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
      No chart data available.
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-base font-bold text-slate-900 dark:text-white">{title}</div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
