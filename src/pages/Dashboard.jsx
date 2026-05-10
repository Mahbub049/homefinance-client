import { useEffect, useMemo, useState } from "react";
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
  const abs = Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n < 0 ? `-৳ ${abs}` : `৳ ${abs}`;
}

function formatPlain(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
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
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100" />
      <div className="h-3 w-24 rounded bg-slate-200 mb-4" />
      <div className="h-8 w-36 rounded bg-slate-200 mb-4" />
      <div className="h-2 w-full rounded bg-slate-200" />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
      <div className="mb-2 font-semibold text-slate-950">{label}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey || item.name} className="flex items-center justify-between gap-5">
            <span className="text-slate-500">{item.name || item.dataKey}</span>
            <span className="font-semibold text-slate-900">{formatMoney(item.value)}</span>
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
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
      <div className="font-semibold text-slate-950">{label || item?.name}</div>
      <div className="mt-1 text-slate-600">{formatMoney(item?.value)}</div>
    </div>
  );
}

export default function Dashboard() {
  const [month, setMonth] = useState(monthNow());
  const [resp, setResp] = useState(null);
  const [trend, setTrend] = useState([]);
  const [networth, setNetworth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadSummary();
    loadNetWorth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get("/api/dashboard/summary", { params: { month } });
      setResp(res.data);
    } catch (e) {
      setResp(null);
      setErr(e?.response?.data?.message || e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadTrend() {
    try {
      const res = await api.get("/api/dashboard/trend");
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

  const settlement = data?.settlement || [];
  const totalSavingsAsset = safeNum(data?.totalSavingsAsset || 0);

  const remainingEMI = safeNum(networth?.liabilities?.remainingEMI ?? 0);
  const netWorthValue = safeNum(networth?.netWorth ?? 0);
  const manualSavings = safeNum(networth?.assets?.manualSavings ?? 0);

  const income = safeNum(summary?.income);
  const living = safeNum(summary?.living);
  const debt = safeNum(summary?.debt);
  const investment = safeNum(summary?.investment);
  const available = safeNum(summary?.available);
  const finalBalance = safeNum(summary?.finalBalance);
  const savingsRate = safeNum(summary?.savingsRate ?? 0);
  const thisMonthSavingsTx = safeNum(summary?.components?.savingsContribution ?? 0);

  const spendTotal = living + debt + investment;
  const spendPct = useMemo(() => {
    const denom = Math.max(income, 1);
    return clamp(Math.round((spendTotal / denom) * 100));
  }, [income, spendTotal]);

  const availablePct = useMemo(() => {
    const denom = Math.max(income, 1);
    return clamp(Math.round((available / denom) * 100));
  }, [income, available]);

  const savingsRatePct = clamp(Math.round(savingsRate));

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
      { name: "Living", value: living, color: COLORS.living },
      { name: "EMI / Debt", value: debt, color: COLORS.debt },
      { name: "Investment", value: investment, color: COLORS.investment },
    ].filter((item) => item.value > 0);

    if (available > 0) {
      parts.push({ name: "Available", value: available, color: COLORS.available });
    }

    return parts;
  }, [living, debt, investment, available]);

  const cashFlowData = useMemo(
    () => [
      { name: "Income", value: income, color: COLORS.income },
      { name: "Living", value: -living, color: COLORS.living },
      { name: "Debt", value: -debt, color: COLORS.debt },
      { name: "Investment", value: -investment, color: COLORS.investment },
      {
        name: "Final",
        value: finalBalance,
        color: finalBalance >= 0 ? COLORS.final : COLORS.living,
      },
    ],
    [income, living, debt, investment, finalBalance]
  );

  const quickNote = useMemo(() => {
    if (!income) return "Add income and expense records to activate insights.";
    if (finalBalance < 0) return "Your month is ending negative. Reduce flexible spending or delay optional purchases.";
    if (savingsRate >= 20) return "Savings rate is healthy. Keep this pace consistent for long-term stability.";
    if (spendPct > 90) return "Spending is very close to income. Check living and debt categories first.";
    return "Month looks stable. A little more savings can improve the final balance.";
  }, [income, finalBalance, savingsRate, spendPct]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1600px] px-3 pb-10 sm:px-4 lg:px-6">
        {/* Hero */}
        <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl sm:p-6 lg:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100 backdrop-blur">
                Personal Finance Control Center
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Overview of income, spending, savings, settlement, and net worth for the selected month.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <div className="text-xs text-slate-300">Selected Month</div>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>

              <button
                onClick={() => {
                  loadSummary();
                  loadNetWorth();
                  loadTrend();
                }}
                disabled={loading}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 disabled:translate-y-0 disabled:opacity-70"
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric label="Income" value={formatMoney(income)} sub="Total earning" />
            <HeroMetric label="Spend" value={formatMoney(spendTotal)} sub={`${spendPct}% of income`} />
            <HeroMetric label="Final Balance" value={formatMoney(finalBalance)} sub={finalBalance >= 0 ? "Positive month" : "Needs attention"} />
            <HeroMetric label="Net Worth" value={formatMoney(netWorthValue)} sub={`as of ${month}`} />
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="font-semibold">Couldn’t load data</div>
            <div className="mt-1 text-sm break-words">{err}</div>
          </div>
        )}

        {/* KPI Row */}
        {loading && !summary ? (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Income" value={income} hint="Total monthly income" tone="positive" />
            <StatCard title="Living" value={living} hint="Daily and household spending" tone="danger" />
            <StatCard title="EMI / Debt" value={debt} hint="Debt payments this month" tone="warning" />
            <StatCard title="Investment" value={investment} hint="Savings and investments" tone="info" />
          </div>
        )}

        {loading && !summary ? (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard
              title="Available"
              value={available}
              hint="Income minus total monthly outflow"
              tone={available >= 0 ? "positive" : "danger"}
            />
            <StatCard
              title="Final Balance"
              value={finalBalance}
              hint="End-of-month financial position"
              tone={finalBalance >= 0 ? "positive" : "danger"}
            />
            <StatCard
              title="Savings Rate"
              value={`${savingsRate}%`}
              hint="Savings as percentage of income"
              tone={savingsRate >= 20 ? "positive" : "warning"}
              isText
            />
          </div>
        )}

        {/* Charts */}
        <div className="mb-6 grid gap-4 xl:grid-cols-3">
          <Panel title="Income Allocation" subtitle="Where this month’s money is going">
            {expensePieData.length === 0 ? (
              <EmptyState text="No allocation data yet." />
            ) : (
              <div className="grid gap-4 md:grid-cols-[1fr_0.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_0.9fr]">
                <div className="h-[260px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={4}
                      >
                        {expensePieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<SimpleTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 self-center">
                  {expensePieData.map((item) => {
                    const pct = income ? Math.round((item.value / income) * 100) : 0;
                    return (
                      <LegendRow
                        key={item.name}
                        color={item.color}
                        label={item.name}
                        value={formatMoney(item.value)}
                        sub={`${pct}% of income`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Cash Flow Movement" subtitle="Income vs outflows vs final balance">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                    {cashFlowData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Financial Health" subtitle="Quick visual indicators">
            <div className="space-y-5">
              <GaugeRow
                label="Spend vs Income"
                value={spendPct}
                caption={`${formatMoney(spendTotal)} spent from ${formatMoney(income)}`}
                tone={spendPct <= 70 ? "positive" : spendPct <= 90 ? "warning" : "danger"}
              />
              <GaugeRow
                label="Available Ratio"
                value={availablePct}
                caption={`${formatMoney(available)} available after spending`}
                tone={available >= 0 ? "positive" : "danger"}
              />
              <GaugeRow
                label="Savings Rate"
                value={savingsRatePct}
                caption="Target suggestion: 20% or more"
                tone={savingsRate >= 20 ? "positive" : "warning"}
              />

              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Insight</div>
                <div className="mt-2 text-sm leading-6 text-slate-700">{quickNote}</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Net worth + notes */}
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Panel title="Net Worth" subtitle="Assets minus liabilities" className="lg:col-span-1">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-5 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wide text-cyan-100">Current Net Worth</div>
              <div className="mt-2 text-3xl font-black sm:text-4xl">{formatMoney(netWorthValue)}</div>
              <div className="mt-1 text-xs text-blue-100">Calculated as of {month}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label="Savings Asset" value={totalSavingsAsset} tone="positive" />
              <MiniStat label="Manual Savings" value={manualSavings} tone="info" />
              <MiniStat label="Remaining EMI" value={remainingEMI} tone="warning" />
              <MiniStat label="This Month Savings" value={thisMonthSavingsTx} tone="positive" />
            </div>
          </Panel>

          <Panel title="Quick Notes" subtitle="Important monthly signals" className="lg:col-span-2">
            <div className="grid gap-3 md:grid-cols-3">
              <SignalCard
                title="Balance Health"
                value={finalBalance >= 0 ? "Stable" : "Negative"}
                desc={finalBalance >= 0 ? "Final balance is positive." : "Spending is higher than income."}
                tone={finalBalance >= 0 ? "positive" : "danger"}
              />
              <SignalCard
                title="Savings Target"
                value={savingsRate >= 20 ? "On Track" : "Below Target"}
                desc={savingsRate >= 20 ? "Savings rate is healthy." : "Try reaching at least 20%."}
                tone={savingsRate >= 20 ? "positive" : "warning"}
              />
              <SignalCard
                title="Debt Pressure"
                value={debt > living ? "High" : "Normal"}
                desc={debt > living ? "EMI is larger than living cost." : "Debt is under control."}
                tone={debt > living ? "warning" : "neutral"}
              />
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Monthly Spending Structure</div>
                  <div className="text-xs text-slate-500">Living + debt + investment compared with income</div>
                </div>
                <div className="text-right text-sm font-bold text-slate-900">{spendPct}%</div>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full bg-white shadow-inner">
                <div className="bg-rose-500" style={{ width: `${income ? clamp((living / income) * 100) : 0}%` }} />
                <div className="bg-orange-500" style={{ width: `${income ? clamp((debt / income) * 100) : 0}%` }} />
                <div className="bg-blue-500" style={{ width: `${income ? clamp((investment / income) * 100) : 0}%` }} />
                <div className="bg-teal-500" style={{ width: `${income && available > 0 ? clamp((available / income) * 100) : 0}%` }} />
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-4">
                <LegendDot color="bg-rose-500" label="Living" />
                <LegendDot color="bg-orange-500" label="Debt" />
                <LegendDot color="bg-blue-500" label="Investment" />
                <LegendDot color="bg-teal-500" label="Available" />
              </div>
            </div>
          </Panel>
        </div>

        {/* Settlement */}
        <Panel
          title="Settlement"
          subtitle="Who owes or gets back for this month"
          className="mb-6"
          right={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{settlement.length ? `${settlement.length} members` : "No members"}</span>}
        >
          {settlement.length === 0 ? (
            <EmptyState text="No settlement data yet." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="space-y-3">
                {settlement.map((s) => {
                  const net = safeNum(s.net);
                  const pct = Math.round((Math.abs(net) / maxAbsSettlement) * 100);
                  const positive = net >= 0;

                  return (
                    <div key={s.userId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-950 break-words">{s.name}</div>
                          <div className="text-xs text-slate-500">{positive ? "Gets back" : "Owes"}</div>
                        </div>
                        <div className={positive ? "text-lg font-black text-emerald-600" : "text-lg font-black text-rose-600"}>
                          {positive ? "+" : "-"}{formatMoney(Math.abs(net))}
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={positive ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-rose-500"}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[1.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                <div className="text-sm font-bold text-amber-950">Settlement Summary</div>
                <div className="mt-2 text-sm leading-6 text-amber-900/80">
                  Positive balance means that member paid more than their share. Negative balance means that member needs to pay back.
                </div>
                <div className="mt-5 space-y-3">
                  {settlement.map((s) => {
                    const net = safeNum(s.net);
                    return (
                      <div key={`summary-${s.userId}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-3 py-2 text-sm">
                        <span className="truncate text-slate-700">{s.name}</span>
                        <span className={net >= 0 ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                          {net >= 0 ? "+" : "-"}{formatMoney(Math.abs(net))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* Trend graphs */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="6 Month Trend" subtitle="Income and category movement over time">
            {trendView.length === 0 ? (
              <EmptyState text="No trend data yet." />
            ) : (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendView} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Income" stroke={COLORS.income} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="living" name="Living" stroke={COLORS.living} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="debt" name="Debt" stroke={COLORS.debt} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="investment" name="Investment" stroke={COLORS.investment} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title="Income vs Spending Area" subtitle="Trend of total spending and leftover balance">
            {trendView.length === 0 ? (
              <EmptyState text="No trend data yet." />
            ) : (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendView} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.32} />
                        <stop offset="95%" stopColor={COLORS.income} stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.living} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={COLORS.living} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.final} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={COLORS.final} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="income" name="Income" stroke={COLORS.income} strokeWidth={3} fill="url(#incomeGradient)" />
                    <Area type="monotone" dataKey="spend" name="Spend" stroke={COLORS.living} strokeWidth={3} fill="url(#spendGradient)" />
                    <Area type="monotone" dataKey="balance" name="Balance" stroke={COLORS.final} strokeWidth={3} fill="url(#balanceGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}

/* ------------------ UI Components ------------------ */

function HeroMetric({ label, value, sub }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-300">{label}</div>
      <div className="mt-1 text-xl font-black text-white break-words">{value}</div>
      <div className="mt-1 text-xs text-slate-300">{sub}</div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "", right = null }) {
  return (
    <div className={`rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-slate-950 break-words">{title}</div>
          {subtitle ? <div className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</div> : null}
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
      box: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white",
      pill: "bg-emerald-100 text-emerald-700",
      ring: "bg-emerald-500/15",
    },
    danger: {
      box: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white",
      pill: "bg-rose-100 text-rose-700",
      ring: "bg-rose-500/15",
    },
    warning: {
      box: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white",
      pill: "bg-amber-100 text-amber-700",
      ring: "bg-amber-500/15",
    },
    info: {
      box: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white",
      pill: "bg-blue-100 text-blue-700",
      ring: "bg-blue-500/15",
    },
    neutral: {
      box: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white",
      pill: "bg-slate-100 text-slate-700",
      ring: "bg-slate-500/15",
    },
  };

  const style = toneMap[tone] || toneMap.neutral;
  const valueText = isText ? String(value ?? "0") : formatMoney(value);

  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${style.box}`}>
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${style.ring}`} />
      <div className="relative z-10">
        <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${style.pill}`}>{title}</div>
        <div className="text-2xl font-black text-slate-950 break-words sm:text-3xl">{valueText}</div>
        {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "info"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="mt-1 text-base font-black text-slate-950 break-words">{formatMoney(value)}</div>
    </div>
  );
}

function SignalCard({ title, value, desc, tone = "neutral" }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-3xl border p-4 ${toneClass}`}>
      <div className="text-xs font-bold uppercase tracking-wide opacity-80">{title}</div>
      <div className="mt-2 text-xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs leading-5 text-slate-600">{desc}</div>
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
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="text-xs text-slate-500">{caption}</div>
        </div>
        <div className="text-sm font-black text-slate-950">{value}%</div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${clamp(value)}%` }} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
          <div className="text-xs text-slate-500">{sub}</div>
        </div>
      </div>
      <div className="shrink-0 text-sm font-black text-slate-950">{value}</div>
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
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
