import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "../components/layout/AppLayout";
import Loader from "../components/ui/Loader";
import api from "../services/api";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function round2(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

function bdt(n) {
  const value = round2(n);
  return `৳ ${value.toLocaleString("en-BD", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortBdt(n) {
  const value = Math.abs(Number(n || 0));
  const sign = Number(n || 0) < 0 ? "-" : "";

  if (value >= 10000000) return `${sign}৳ ${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${sign}৳ ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${sign}৳ ${(value / 1000).toFixed(1)}K`;
  return `${sign}৳ ${round2(value).toLocaleString("en-BD")}`;
}

function formatDate(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const hiddenScrollbarClass =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const monthLabels = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const chartColors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#64748b"];

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10";

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
    chart: (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-5" />
        <path d="M12 15V7" />
        <path d="M16 15v-3" />
      </svg>
    ),
    wallet: (
      <svg {...common}>
        <path d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-14A2.5 2.5 0 0 1 2 17V7a2.5 2.5 0 0 1 2.5-2.5H17" />
        <path d="M17 13h4" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    refresh: (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <path d="M3 10h18" />
      </svg>
    ),
    cash: (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6.5 9v.01M17.5 15v.01" />
      </svg>
    ),
    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),
    spark: (
      <svg {...common}>
        <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
        <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
      </svg>
    ),
  };

  return icons[name] || icons.chart;
}

function ToneIcon({ icon = "chart", tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/20",
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
    violet:
      "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10",
  };

  return (
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${tones[tone] || tones.cyan}`}>
      <Icon name={icon} className="h-5 w-5" />
    </div>
  );
}

function StatCard({ title, value, sub, icon, tone = "cyan", trend }) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-slate-200/70 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 sm:p-5">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
          <div className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{value}</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{sub}</p>
        </div>
        <ToneIcon icon={icon} tone={tone} />
      </div>
      {trend ? <div className="relative mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">{trend}</div> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, icon = "chart", tone = "cyan", action, children, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-slate-200/70 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 ${className}`}>
      <div className="flex flex-col gap-4 border-b border-slate-200/70 p-4 dark:border-white/10 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <ToneIcon icon={icon} tone={tone} />
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function EmptyChart({ text = "No data yet" }) {
  return (
    <div className="grid min-h-[230px] place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
      {text}
    </div>
  );
}

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-white/10 dark:bg-slate-950">
      <p className="font-black text-slate-800 dark:text-white">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="mt-1 font-bold text-slate-500 dark:text-slate-300">
          {item.name || item.dataKey}: {bdt(item.value)}
        </p>
      ))}
    </div>
  );
}

function MemberChip({ user, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${
        selected
          ? "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-500/10 dark:border-cyan-400/30 dark:bg-cyan-400/10"
          : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-cyan-400/30 dark:hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-slate-950 dark:text-white">{user.name}</div>
          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Spent {bdt(user.summary?.spent)}</div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${Number(user.summary?.netRemaining || 0) >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200"}`}>
          {Number(user.summary?.netRemaining || 0) >= 0 ? "Positive" : "Minus"}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-white/5">
          <div className="font-bold text-slate-500 dark:text-slate-400">Cash</div>
          <div className="mt-0.5 font-black text-slate-900 dark:text-white">{shortBdt(user.summary?.cashRemaining)}</div>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-white/5">
          <div className="font-bold text-slate-500 dark:text-slate-400">Paid</div>
          <div className="mt-0.5 font-black text-slate-900 dark:text-white">{shortBdt(user.summary?.paid)}</div>
        </div>
      </div>
    </button>
  );
}

function ProgressRow({ label, value, total, tone = "cyan" }) {
  const percent = total > 0 ? Math.min(100, Math.round((Number(value || 0) / total) * 100)) : 0;
  const tones = {
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-black text-slate-700 dark:text-slate-200">{label}</span>
        <span className="font-bold text-slate-500 dark:text-slate-400">{bdt(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div className={`h-full rounded-full ${tones[tone] || tones.cyan}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function AccountList({ accounts = [] }) {
  if (!accounts.length) {
    return <EmptyChart text="No personal account balance found for this member. Check account owner names in Settings if needed." />;
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div key={account.accountId} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-950 dark:text-white">{account.name}</div>
            <div className="mt-1 text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">{account.owner} • {account.type}</div>
          </div>
          <div className="shrink-0 text-right text-sm font-black text-slate-900 dark:text-white">{bdt(account.balance)}</div>
        </div>
      ))}
    </div>
  );
}

export default function IndividualSummary() {
  const [month, setMonth] = useState(monthNow());
  const [data, setData] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/individual-summary", { params: { month } });
      const next = res.data?.data || null;
      setData(next);

      const users = next?.users || [];
      if (!selectedUserId || !users.some((user) => String(user.userId) === String(selectedUserId))) {
        setSelectedUserId(users[0]?.userId || "");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load individual summary.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const users = data?.users || [];
  const selectedUser = useMemo(() => {
    if (!users.length) return null;
    return users.find((user) => String(user.userId) === String(selectedUserId)) || users[0];
  }, [users, selectedUserId]);

  const expenseTypeData = useMemo(
    () => (selectedUser?.expenseTypes || []).filter((row) => Number(row.amount || 0) > 0),
    [selectedUser]
  );

  const topCategoryData = useMemo(
    () => (selectedUser?.categoryBreakdown || []).slice(0, 6),
    [selectedUser]
  );

  const selectedYear = month.split("-")[0] || String(new Date().getFullYear());
  const selectedMonthNumber = month.split("-")[1] || String(new Date().getMonth() + 1).padStart(2, "0");
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 9 }, (_, index) => String(currentYear - 4 + index));
  }, []);

  function updateMonthPart(part, value) {
    const nextYear = part === "year" ? value : selectedYear;
    const nextMonth = part === "month" ? value : selectedMonthNumber;
    setMonth(`${nextYear}-${nextMonth}`);
  }

  const maxTypeTotal = useMemo(
    () => expenseTypeData.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [expenseTypeData]
  );

  return (
    <AppLayout>
      <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-white pb-8 text-[13px] text-slate-900 dark:bg-[#020617] dark:text-slate-100 sm:text-sm ${hiddenScrollbarClass}`}>
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[radial-gradient(circle_at_top_left,#0891b2_0%,#0f766e_42%,#0f172a_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-6 lg:p-7">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_45%,rgba(255,255,255,0.06))]" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-50 ring-1 ring-white/20 backdrop-blur">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
                    <Icon name="user" className="h-3.5 w-3.5" />
                  </span>
                  Individual summary
                </div>

                <h2 className="text-[1.65rem] font-black tracking-tight sm:text-3xl lg:text-4xl">Member-wise Monthly Picture</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/90 sm:text-base">
                  See each member’s income, expense responsibility, actual paid amount, cash remaining, top categories, and top 10 expenses for the selected month.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-50/80">Highest spender</div>
                  <div className="mt-1 truncate text-xl font-black">{data?.family?.highestSpender?.name || "-"}</div>
                  <div className="mt-1 text-xs text-cyan-50/80">{bdt(data?.family?.highestSpender?.amount || 0)}</div>
                </div>
                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-50/80">Strongest cash</div>
                  <div className="mt-1 truncate text-xl font-black">{data?.family?.strongestCash?.name || "-"}</div>
                  <div className="mt-1 text-xs text-cyan-50/80">{bdt(data?.family?.strongestCash?.amount || 0)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <ToneIcon icon="calendar" tone="cyan" />
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Summary Control</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    Select month and member to explore personal spending, accounts, settlement position, and charts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:min-w-[760px] xl:grid-cols-[1fr_0.85fr_1.25fr_0.9fr]">
                <select
                  className={fieldClass}
                  value={selectedMonthNumber}
                  onChange={(e) => updateMonthPart("month", e.target.value)}
                  aria-label="Select month"
                >
                  {monthLabels.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <select
                  className={fieldClass}
                  value={selectedYear}
                  onChange={(e) => updateMonthPart("year", e.target.value)}
                  aria-label="Select year"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select className={fieldClass} value={selectedUser?.userId || ""} onChange={(e) => setSelectedUserId(e.target.value)}>
                  {users.map((user) => (
                    <option key={user.userId} value={user.userId}>{user.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Icon name="refresh" className="h-4 w-4" />
                  {loading ? "Loading" : "Refresh"}
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          {loading && !data ? (
            <Loader text="Loading individual summary" subtext="Preparing member-wise charts and expense analysis" />
          ) : !selectedUser ? (
            <EmptyChart text="No family member data found for this month." />
          ) : (
            <>
              <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <StatCard title="Income" value={bdt(selectedUser.summary?.income)} sub="Received this month" icon="cash" tone="emerald" />
                <StatCard title="Spent" value={bdt(selectedUser.summary?.spent)} sub="Own expense share" icon="chart" tone="rose" />
                <StatCard title="Actually Paid" value={bdt(selectedUser.summary?.paid)} sub="Paid from this member" icon="wallet" tone="amber" />
                <StatCard
                  title="Cash Remaining"
                  value={bdt(selectedUser.summary?.cashRemaining)}
                  sub="Cash, bank, wallet accounts"
                  icon="cash"
                  tone="cyan"
                />
                <StatCard
                  title="Net Remaining"
                  value={bdt(selectedUser.summary?.netRemaining)}
                  sub="Income minus own spending"
                  icon="arrow"
                  tone={Number(selectedUser.summary?.netRemaining || 0) >= 0 ? "emerald" : "rose"}
                />
              </section>

              <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {users.map((user) => (
                  <MemberChip key={user.userId} user={user} selected={String(user.userId) === String(selectedUser.userId)} onClick={() => setSelectedUserId(user.userId)} />
                ))}
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SectionCard title="Expense Type Split" subtitle="Fixed, grocery, EMI, remaining and investment-wise spending." icon="chart" tone="violet">
                  {expenseTypeData.length ? (
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_0.9fr]">
                      <div className="h-[250px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<TooltipBox />} />
                            <Pie data={expenseTypeData} dataKey="amount" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={4}>
                              {expenseTypeData.map((_, index) => (
                                <Cell key={`type-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                        {expenseTypeData.map((row, index) => (
                          <ProgressRow key={row.key} label={row.label} value={row.amount} total={maxTypeTotal} tone={row.tone || ["cyan", "emerald", "amber", "violet", "rose"][index % 5]} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyChart text="No spending type data for this member." />
                  )}
                </SectionCard>

                <SectionCard title="Top Category Comparison" subtitle="Largest categories based on this member’s split share." icon="chart" tone="cyan">
                  {topCategoryData.length ? (
                    <div className="h-[250px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCategoryData} barCategoryGap="38%" margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={50} />
                          <YAxis tickFormatter={shortBdt} tick={{ fontSize: 11 }} width={58} />
                          <Tooltip content={<TooltipBox />} />
                          <Bar dataKey="amount" name="Amount" radius={[12, 12, 0, 0]} maxBarSize={54}>
                            {topCategoryData.map((_, index) => (
                              <Cell key={`cat-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyChart text="No category data for this member." />
                  )}
                </SectionCard>
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                <SectionCard className="xl:col-span-3" title="Daily Spending Trend" subtitle="Day-by-day personal spending share for the selected month." icon="chart" tone="emerald">
                  {(selectedUser.dailyTrend || []).some((row) => Number(row.amount || 0) > 0) ? (
                    <div className="h-[290px] lg:h-[550px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedUser.dailyTrend} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={shortBdt} tick={{ fontSize: 11 }} width={58} />
                          <Tooltip content={<TooltipBox />} />
                          <Line type="monotone" dataKey="amount" name="Spent" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyChart text="No daily spending found for this member." />
                  )}
                </SectionCard>

                <SectionCard className="xl:col-span-2" title="Account Position" subtitle={`Balance source: ${data?.accountSource === "closed_month" ? "closed month" : "system calculated"}.`} icon="wallet" tone="amber">
                  <AccountList accounts={selectedUser.accountBalances} />
                </SectionCard>
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                <SectionCard className="xl:col-span-3" title="Top 10 Paid Expenses" subtitle="Largest expenses actually paid by this member, regardless of who shared the cost." icon="cash" tone="rose">
                  <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10">
                    <div className={`max-h-[460px] overflow-auto overscroll-contain ${hiddenScrollbarClass}`}>
                      <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-black">Date</th>
                            <th className="px-4 py-3 font-black">Category</th>
                            <th className="px-4 py-3 font-black">Type</th>
                            {/* <th className="px-4 py-3 font-black">Paid by</th> */}
                            <th className="px-4 py-3 text-right font-black">Paid Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                          {selectedUser.topExpenses?.length ? (
                            selectedUser.topExpenses.map((row) => (
                              <tr key={`${row.entryId}-${row.paidAmount || row.totalAmount}`} className="bg-white transition hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-white/[0.04]">
                                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{formatDate(row.date)}</td>
                                <td className="px-4 py-3">
                                  <div className="font-black text-slate-950 dark:text-white">{row.category}</div>
                                  {row.note ? <div className="mt-0.5 max-w-[260px] truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{row.note}</div> : null}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{row.typeLabel}</td>
                                {/* <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{row.paidBy}</td> */}
                                <td className="whitespace-nowrap px-4 py-3 text-right font-black text-rose-600 dark:text-rose-300">{bdt(row.paidAmount ?? row.totalAmount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                                No expense found for this member in this month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="xl:col-span-2" title="Useful Insights" subtitle="Quick signals to understand this member’s month." icon="spark" tone="violet">
                  <div className="space-y-3">
                    {(selectedUser.insights || []).map((item, index) => (
                      <div key={index} className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm font-semibold leading-6 text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200">
                        {item}
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-3xl bg-slate-100 p-4 dark:bg-white/5">
                        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Settlement</div>
                        <div className={`mt-1 text-lg font-black ${Number(selectedUser.summary?.settlementPosition || 0) >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                          {bdt(selectedUser.summary?.settlementPosition)}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Paid - own share</p>
                      </div>
                      <div className="rounded-3xl bg-slate-100 p-4 dark:bg-white/5">
                        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Avg / Day</div>
                        <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{bdt(selectedUser.summary?.averageDailySpend)}</div>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Spent ÷ month days</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </section>

              <SectionCard title="All Member Comparison" subtitle="A compact table to compare income, spent, paid, cash remaining, and settlement position." icon="user" tone="cyan">
                <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10">
                  <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-black">Member</th>
                          <th className="px-4 py-3 text-right font-black">Income</th>
                          <th className="px-4 py-3 text-right font-black">Spent</th>
                          <th className="px-4 py-3 text-right font-black">Paid</th>
                          <th className="px-4 py-3 text-right font-black">Cash Remaining</th>
                          <th className="px-4 py-3 text-right font-black">Settlement</th>
                          <th className="px-4 py-3 text-right font-black">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                        {users.map((user) => (
                          <tr key={user.userId} className="bg-white transition hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-white/[0.04]">
                            <td className="px-4 py-3 font-black text-slate-950 dark:text-white">{user.name}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-300">{bdt(user.summary?.income)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-300">{bdt(user.summary?.spent)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-300">{bdt(user.summary?.paid)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-cyan-600 dark:text-cyan-300">{bdt(user.summary?.cashRemaining)}</td>
                            <td className={`whitespace-nowrap px-4 py-3 text-right font-black ${Number(user.summary?.settlementPosition || 0) >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>{bdt(user.summary?.settlementPosition)}</td>
                            <td className={`whitespace-nowrap px-4 py-3 text-right font-black ${Number(user.summary?.netRemaining || 0) >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>{bdt(user.summary?.netRemaining)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
