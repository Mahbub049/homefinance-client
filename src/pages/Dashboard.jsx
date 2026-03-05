import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
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

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function SkeletonCard() {
  return (
    <div className="bg-white border rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
      <div className="h-2 w-full bg-gray-200 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const [month, setMonth] = useState(monthNow());
  const [resp, setResp] = useState(null); // { ok, data: {...} }
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
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load dashboard"
      );
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
    return Math.min(100, Math.round((spendTotal / denom) * 100));
  }, [income, spendTotal]);

  const maxAbsSettlement = useMemo(() => {
    if (!settlement.length) return 1;
    return Math.max(
      ...settlement.map((s) => Math.abs(safeNum(s.net))),
      1
    );
  }, [settlement]);

  // Custom tooltip for nicer UX
  const TrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const byKey = {};
    payload.forEach((p) => (byKey[p.dataKey] = p.value));
    return (
      <div className="bg-white border rounded-xl shadow-sm px-3 py-2 text-sm">
        <div className="font-semibold text-gray-900 mb-1">{label}</div>
        <div className="space-y-0.5 text-gray-700">
          <div>Income: {formatMoney(byKey.income)}</div>
          <div>Living: {formatMoney(byKey.living)}</div>
          <div>Debt: {formatMoney(byKey.debt)}</div>
          <div>Investment: {formatMoney(byKey.investment)}</div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="mx-auto px-2 sm:px-4 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">
              Overview of income, spending, savings, and net worth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white border rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">Month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="outline-none text-sm"
              />
            </div>

            <button
              onClick={() => {
                loadSummary();
                loadNetWorth();
              }}
              disabled={loading}
              className="px-4 py-2 rounded-lg border bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            <div className="font-semibold mb-1">Couldn’t load data</div>
            <div className="text-sm">{err}</div>
          </div>
        )}

        {/* Top KPI Row */}
        {loading && !summary ? (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4 mb-6">

            <StatCard
              title="Income"
              value={income}
              hint="Total monthly income"
              tone="positive"
            />
            <StatCard
              title="Living"
              value={living}
              hint="Daily / household spending"
              tone="danger"
            />
            <StatCard
              title="EMI (Debt)"
              value={debt}
              hint="Debt payments this month"
              tone="warning"
            />
            <StatCard
              title="Investment"
              value={investment}
              hint="Savings / investments"
              tone="info"
            />
          </div>
        )}

        {/* Secondary KPIs */}
        {loading && !summary ? (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Available"
              value={available}
              hint="Income minus spending"
              tone={available >= 0 ? "positive" : "danger"}
            />
            <StatCard
              title="Final Balance"
              value={finalBalance}
              hint="End-of-month balance"
              tone={finalBalance >= 0 ? "positive" : "danger"}
            />
            <StatCard
              title="Savings Rate"
              value={`${savingsRate}%`}
              hint="Savings as % of income"
              tone={savingsRate >= 20 ? "positive" : "warning"}
              isText
            />
          </div>
        )}

        {/* Net Worth + Savings Assets */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <Panel title="Net Worth" subtitle="Assets minus liabilities">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatMoney(netWorthValue)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  as of {month}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Remaining EMI</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatMoney(remainingEMI)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label="Total Savings Asset" value={totalSavingsAsset} />
              <MiniStat label="Manual Savings" value={manualSavings} />
            </div>
          </Panel>

          <Panel title="This Month Savings" subtitle="Transfers / contributions">
            <div className="text-3xl font-bold text-gray-900">
              {formatMoney(thisMonthSavingsTx)}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Spend vs Income</span>
                <span>{spendPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={[
                    "h-full rounded-full",
                    spendPct <= 70
                      ? "bg-emerald-500"
                      : spendPct <= 90
                        ? "bg-amber-500"
                        : "bg-rose-500",
                  ].join(" ")}
                  style={{ width: `${spendPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Total spend: {formatMoney(spendTotal)} (Living + Debt + Investment)
              </div>
            </div>
          </Panel>

          <Panel title="Quick Notes" subtitle="Helpful signals">
            <div className="space-y-3">
              <NoteRow
                label="Balance health"
                value={
                  finalBalance >= 0
                    ? "Stable"
                    : "Negative (needs adjustment)"
                }
                tone={finalBalance >= 0 ? "positive" : "danger"}
              />
              <NoteRow
                label="Savings target"
                value={savingsRate >= 20 ? "On track" : "Below 20%"}
                tone={savingsRate >= 20 ? "positive" : "warning"}
              />
              <NoteRow
                label="Debt pressure"
                value={
                  debt > living ? "High (EMI dominates)" : "Normal"
                }
                tone={debt > living ? "warning" : "neutral"}
              />
            </div>
          </Panel>
        </div>

        {/* Settlement */}
        <Panel
          title="Settlement"
          subtitle="Who owes / gets back for this month"
          className="mb-6"
          right={
            <span className="text-xs text-gray-500">
              {settlement.length ? `${settlement.length} members` : "—"}
            </span>
          }
        >
          {settlement.length === 0 ? (
            <div className="text-sm text-gray-500">No settlement data yet.</div>
          ) : (
            <div className="space-y-3">
              {settlement.map((s) => {
                const net = safeNum(s.net);
                const pct = Math.round((Math.abs(net) / maxAbsSettlement) * 100);
                const positive = net >= 0;

                return (
                  <div
                    key={s.userId}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="w-full sm:w-44">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        {positive ? "Gets back" : "Owes"}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{positive ? "Receivable" : "Payable"}</span>
                        <span
                          className={
                            positive ? "text-emerald-700" : "text-rose-700"
                          }
                        >
                          {positive
                            ? `+${formatMoney(net)}`
                            : `-${formatMoney(Math.abs(net))}`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={[
                            "h-full rounded-full",
                            positive ? "bg-emerald-500" : "bg-rose-500",
                          ].join(" ")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Trend */}
        <Panel title="6 Month Trend" subtitle="Track category movement over time">
          {trend.length === 0 ? (
            <div className="text-sm text-gray-500">No trend data yet.</div>
          ) : (
            <div className="w-full h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<TrendTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="living" stroke="#dc2626" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="debt" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="investment" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </AppLayout>
  );
}

/* ------------------ UI Components ------------------ */

function Panel({ title, subtitle, children, className = "", right = null }) {
  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, hint, tone = "neutral", isText = false }) {
  const toneClass =
    tone === "positive"
      ? "bg-emerald-50 border-emerald-200"
      : tone === "danger"
        ? "bg-rose-50 border-rose-200"
        : tone === "warning"
          ? "bg-amber-50 border-amber-200"
          : tone === "info"
            ? "bg-blue-50 border-blue-200"
            : "bg-gray-50 border-gray-200";

  const valueText = isText ? String(value ?? "0") : formatMoney(value);

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${toneClass}`}>
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mt-1">{valueText}</div>
      {hint && <div className="text-xs text-gray-600 mt-2">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900">
        {formatMoney(value)}
      </div>
    </div>
  );
}

function NoteRow({ label, value, tone = "neutral" }) {
  const cls =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-rose-700"
        : tone === "warning"
          ? "text-amber-700"
          : "text-gray-700";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-sm font-semibold ${cls}`}>{value}</div>
    </div>
  );
}