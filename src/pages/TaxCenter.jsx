import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppLayout from "../components/layout/AppLayout";
import Loader, { InlineSpinner } from "../components/ui/Loader";
import api from "../services/api";

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function bdt(value) {
  const n = round2(value);
  return `৳ ${n.toLocaleString("en-BD", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortBdt(value) {
  const n = Math.abs(Number(value || 0));
  const sign = Number(value || 0) < 0 ? "-" : "";
  if (n >= 10000000) return `${sign}৳ ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${sign}৳ ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${sign}৳ ${(n / 1000).toFixed(1)}K`;
  return `${sign}৳ ${round2(n).toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isoDate(value = new Date()) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentTaxYearStart() {
  const d = new Date();
  return d.getMonth() + 1 >= 7 ? d.getFullYear() : d.getFullYear() - 1;
}

function taxYearOptions() {
  const current = currentTaxYearStart();
  const start = Math.min(2024, current - 2);
  const end = Math.max(2056, current + 30);
  const rows = [];
  for (let y = start; y <= end; y += 1) {
    rows.push({ value: y, label: `${y}-${y + 1}` });
  }
  return rows;
}

const chartColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#64748b"];

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10";

const recordTypeOptions = [
  { value: "income", label: "Income Proof" },
  { value: "rebate", label: "Rebate Investment" },
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability / Loan" },
  { value: "tax_paid", label: "Tax Paid / TDS" },
  { value: "business_expense", label: "Business Expense" },
  { value: "document", label: "Document Checklist" },
  { value: "note", label: "General Note" },
];

const emptyForm = {
  recordType: "rebate",
  userId: "",
  date: isoDate(),
  title: "",
  category: "",
  institution: "",
  amount: "",
  proofRef: "",
  note: "",
};

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
    tax: (
      <svg {...common}>
        <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </svg>
    ),
    income: (
      <svg {...common}>
        <path d="M12 3v18" />
        <path d="M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    wallet: (
      <svg {...common}>
        <path d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-14A2.5 2.5 0 0 1 2 17V7a2.5 2.5 0 0 1 2.5-2.5H17" />
        <path d="M17 13h4" />
      </svg>
    ),
    shield: (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V7" />
        <path d="M16 15v-2" />
      </svg>
    ),
    asset: (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M6 21V9l6-5 6 5v12" />
        <path d="M9 21v-7h6v7" />
      </svg>
    ),
    doc: (
      <svg {...common}>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
    plus: (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    download: (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
    trash: (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 15H6L5 6" />
      </svg>
    ),
    edit: (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),
  };

  return icons[name] || icons.tax;
}

function ToneIcon({ icon = "tax", tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10",
  };

  return (
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${tones[tone] || tones.indigo}`}>
      <Icon name={icon} className="h-5 w-5" />
    </div>
  );
}

function StatCard({ title, value, sub, icon, tone = "indigo" }) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-slate-200/70 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 sm:p-5">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
          <div className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{value}</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{sub}</p>
        </div>
        <ToneIcon icon={icon} tone={tone} />
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon = "tax", tone = "indigo", action, children, className = "" }) {
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

function EmptyState({ title = "No data yet", text = "Add records or transactions to see this section." }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm font-black text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function ProgressRow({ label, value, total }) {
  const percent = total > 0 ? Math.min(100, Math.round((Number(value || 0) / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-bold text-slate-700 dark:text-slate-200">{label}</span>
        <span className="shrink-0 font-black text-slate-950 dark:text-white">{bdt(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Table({ rows, columns, emptyText }) {
  if (!rows?.length) return <EmptyState text={emptyText} />;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10">
      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-full divide-y divide-slate-200/70 text-left text-sm dark:divide-white/10">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-4 py-3 font-black ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 bg-white dark:divide-white/10 dark:bg-slate-900/40">
            {rows.map((row, index) => (
              <tr key={row.id || row._id || `${row.name || row.title}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03]">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-top ${c.align === "right" ? "text-right" : ""}`}>
                    {c.render ? c.render(row, index) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TaxCenter() {
  const [yearStart, setYearStart] = useState(currentTaxYearStart());
  const [memberId, setMemberId] = useState("all");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const years = useMemo(() => taxYearOptions(), []);
  const members = summary?.members || [];
  const totals = summary?.totals || {};

  const selectedMemberName = useMemo(() => {
    if (memberId === "all") return "All members";
    return members.find((m) => String(m.id) === String(memberId))?.name || "Selected member";
  }, [memberId, members]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/tax-center/summary", {
        params: { yearStart, memberId },
      });
      setSummary(res.data.summary || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load tax summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearStart, memberId]);

  function changeForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, date: isoDate() });
  }

  function editRecord(record) {
    setEditingId(record._id);
    setForm({
      recordType: record.recordType || "rebate",
      userId: record.userId?._id || record.userId || "",
      date: isoDate(record.date),
      title: record.title || "",
      category: record.category || "",
      institution: record.institution || "",
      amount: record.amount || "",
      proofRef: record.proofRef || "",
      note: record.note || "",
    });
    setActiveTab("records");
  }

  async function submitRecord(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        userId: form.userId || null,
        taxYearStart: Number(yearStart),
        amount: Number(form.amount || 0),
      };

      if (editingId) {
        await api.put(`/api/tax-center/records/${editingId}`, payload);
      } else {
        await api.post("/api/tax-center/records", payload);
      }

      resetForm();
      await loadData();
    } catch (e2) {
      alert(e2?.response?.data?.message || e2?.message || "Could not save tax record");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(recordId) {
    const ok = window.confirm("Delete this tax record?");
    if (!ok) return;

    try {
      await api.delete(`/api/tax-center/records/${recordId}`);
      await loadData();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Could not delete tax record");
    }
  }

  function exportPdf() {
    if (!summary) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 36;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 112, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("HomeFinance Tax Preparation Summary", margin, 44);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Tax year: ${summary.taxYear?.label || `${yearStart}-${Number(yearStart) + 1}`}  |  Member: ${selectedMemberName}`, margin, 66);
    doc.text("This is a preparation report from app records, not an official tax return.", margin, 86);

    autoTable(doc, {
      startY: 132,
      margin: { left: margin, right: margin },
      head: [["Item", "Amount"]],
      body: [
        ["Total Income", bdt(totals.income)],
        ["Annual Expenditure", bdt(totals.annualExpenditure)],
        ["Cash Surplus / Shortfall", bdt(totals.cashSurplus)],
        ["Rebate Eligible / Candidate Items", bdt(totals.rebateEligible)],
        ["Tax Paid / TDS", bdt(totals.taxPaid)],
        ["Assets", bdt(totals.assets)],
        ["Liabilities", bdt(totals.liabilities)],
        ["Net Worth Snapshot", bdt(totals.netWorth)],
      ],
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9, cellPadding: 7 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      margin: { left: margin, right: margin },
      head: [["Income Category", "Total"]],
      body: (summary.incomeByCategory || []).map((x) => [x.name, bdt(x.total)]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9, cellPadding: 7 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      margin: { left: margin, right: margin },
      head: [["Expense Category", "Type", "Total"]],
      body: (summary.expenseByCategory || []).map((x) => [x.name, x.financialType || "-", bdt(x.total)]),
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9, cellPadding: 7 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      margin: { left: margin, right: margin },
      head: [["Rebate Candidate", "Category", "Amount", "Source"]],
      body: (summary.rebateCandidates || []).map((x) => [x.title, x.category, bdt(x.amount), x.source]),
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 8.5, cellPadding: 6 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      margin: { left: margin, right: margin },
      head: [["Account", "Owner", "Type", "Balance"]],
      body: (summary.assetAccounts || []).map((x) => [x.name, x.owner, x.type, bdt(x.balance)]),
      headStyles: { fillColor: [6, 182, 212] },
      styles: { fontSize: 8.5, cellPadding: 6 },
    });

    const safeMember = selectedMemberName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    doc.save(`Tax-Summary-${summary.taxYear?.label || yearStart}-${safeMember}.pdf`);
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "income", label: "Income" },
    { key: "expense", label: "Expense" },
    { key: "rebate", label: "Rebate" },
    { key: "assets", label: "Assets" },
    { key: "records", label: "Manual Records" },
  ];

  const pieData = (summary?.expenseByFinancialType || []).map((x) => ({ name: x.name, value: x.total }));

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-white/10 sm:p-6">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-indigo-100 backdrop-blur">
                <Icon name="shield" className="h-4 w-4" />
                Tax preparation workspace
              </div>
              <h1 className="mt-4 max-w-3xl text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                Organize income, expenditure, rebate records, assets, liabilities, and tax proofs in one place.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100/90">
                This page summarizes your app data for tax preparation. It does not submit an official return or replace professional tax advice.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-indigo-100">Tax year</span>
                  <select value={yearStart} onChange={(e) => setYearStart(Number(e.target.value))} className="w-full rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-sm font-black text-slate-900 outline-none dark:bg-slate-950 dark:text-white">
                    {years.map((y) => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-indigo-100">Member</span>
                  <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-sm font-black text-slate-900 outline-none dark:bg-slate-950 dark:text-white">
                    <option value="all">All members</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={exportPdf}
                disabled={!summary || loading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="download" className="h-4 w-4" />
                Export Tax PDF
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <Loader text="Loading Tax Center..." subtext="Preparing yearly income, expenditure, rebate, and asset summaries." />
        ) : !summary ? (
          <EmptyState title="Tax summary unavailable" text="Please check your server connection and family setup." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Income" value={bdt(totals.income)} sub="Income + manual income records" icon="income" tone="emerald" />
              <StatCard title="Annual Expenditure" value={bdt(totals.annualExpenditure)} sub="Ledger share + business expenses" icon="wallet" tone="rose" />
              <StatCard title="Rebate Candidates" value={bdt(totals.rebateEligible)} sub="Investment-type entries and manual rebate records" icon="shield" tone="amber" />
              <StatCard title="Net Worth Snapshot" value={bdt(totals.netWorth)} sub="Assets minus liabilities at tax year end" icon="asset" tone="cyan" />
            </div>

            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2 rounded-[24px] border border-slate-200/70 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                      activeTab === tab.key
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "overview" && (
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <SectionCard title="Monthly Tax-Year Movement" subtitle="Income, expenditure, rebate candidates, and tax paid across the selected tax year." icon="chart" tone="indigo">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickFormatter={shortBdt} tickLine={false} axisLine={false} fontSize={11} />
                        <Tooltip formatter={(v) => bdt(v)} />
                        <Bar dataKey="income" name="Income" radius={[8, 8, 0, 0]} fill="#10b981" />
                        <Bar dataKey="expenditure" name="Expenditure" radius={[8, 8, 0, 0]} fill="#ef4444" />
                        <Bar dataKey="rebate" name="Rebate" radius={[8, 8, 0, 0]} fill="#f59e0b" />
                        <Bar dataKey="taxPaid" name="Tax Paid" radius={[8, 8, 0, 0]} fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                <SectionCard title="Preparation Checklist" subtitle="A quick readiness check before preparing your return." icon="shield" tone="emerald">
                  <div className="space-y-3">
                    {(summary.checklist || []).map((item) => (
                      <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl ${item.done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>
                          <Icon name="check" className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{item.label}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.done ? "Available in app records" : "Missing or not detected yet"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Top Expense Items" subtitle="Largest tax-year expense records for the selected member or family." icon="wallet" tone="rose" className="xl:col-span-2">
                  <Table
                    rows={summary.topExpenseItems || []}
                    emptyText="No expense records were found for this tax year."
                    columns={[
                      { key: "date", label: "Date", render: (r) => <span className="font-bold text-slate-600 dark:text-slate-300">{formatDate(r.date)}</span> },
                      { key: "title", label: "Item", render: (r) => <div><p className="font-black text-slate-900 dark:text-white">{r.title}</p><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{r.category}</p></div> },
                      { key: "financialType", label: "Type", render: (r) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize text-slate-600 dark:bg-white/10 dark:text-slate-300">{r.financialType}</span> },
                      { key: "amount", label: "Amount", align: "right", render: (r) => <span className="font-black text-slate-950 dark:text-white">{bdt(r.amount)}</span> },
                    ]}
                  />
                </SectionCard>
              </div>
            )}

            {activeTab === "income" && (
              <SectionCard title="Income Summary" subtitle="Income grouped by category from ledger and manual income records." icon="income" tone="emerald">
                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-4">
                    {(summary.incomeByCategory || []).length ? (
                      summary.incomeByCategory.map((row) => <ProgressRow key={row.name} label={row.name} value={row.total} total={totals.income} />)
                    ) : (
                      <EmptyState text="No income found for this selected tax year." />
                    )}
                  </div>
                  <div className="rounded-3xl bg-emerald-50 p-5 dark:bg-emerald-400/10">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">Total income</p>
                    <p className="mt-2 text-3xl font-black text-emerald-900 dark:text-emerald-100">{bdt(totals.income)}</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-800/80 dark:text-emerald-100/80">
                      Add salary certificate, bank interest, honorarium, freelance income, or other income proofs as manual records when they are not already inside the Ledger.
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}

            {activeTab === "expense" && (
              <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
                <SectionCard title="Expense Type Mix" subtitle="Living, debt, investment, and business expense distribution." icon="chart" tone="rose">
                  {pieData.length ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                            {pieData.map((_, index) => (
                              <Cell key={index} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => bdt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState text="No expense mix available yet." />
                  )}
                </SectionCard>
                <SectionCard title="Annual Expenditure by Category" subtitle="Useful for preparing the annual expenditure section." icon="wallet" tone="rose">
                  <div className="space-y-4">
                    {(summary.expenseByCategory || []).length ? (
                      summary.expenseByCategory.map((row) => <ProgressRow key={row.name} label={`${row.name} (${row.financialType || "expense"})`} value={row.total} total={totals.annualExpenditure} />)
                    ) : (
                      <EmptyState text="No annual expenditure found for this selected tax year." />
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === "rebate" && (
              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <SectionCard title="Rebate Candidate Categories" subtitle="Items marked as investment/savings plus manual rebate records." icon="shield" tone="amber">
                  <div className="space-y-4">
                    {(summary.rebateByCategory || []).length ? (
                      summary.rebateByCategory.map((row) => <ProgressRow key={row.name} label={row.name} value={row.total} total={totals.rebateEligible} />)
                    ) : (
                      <EmptyState text="No rebate candidate was found. Add DPS, insurance, savings certificate, or approved donation as manual records if needed." />
                    )}
                  </div>
                </SectionCard>
                <SectionCard title="Detected Rebate Items" subtitle="Review these before using them for tax preparation." icon="doc" tone="amber">
                  <Table
                    rows={summary.rebateCandidates || []}
                    emptyText="No rebate candidates detected yet."
                    columns={[
                      { key: "date", label: "Date", render: (r) => <span className="font-bold text-slate-600 dark:text-slate-300">{formatDate(r.date)}</span> },
                      { key: "title", label: "Item", render: (r) => <div><p className="font-black text-slate-900 dark:text-white">{r.title}</p><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{r.source}</p></div> },
                      { key: "amount", label: "Amount", align: "right", render: (r) => <span className="font-black text-slate-950 dark:text-white">{bdt(r.amount)}</span> },
                    ]}
                  />
                </SectionCard>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <SectionCard title="Account Asset Snapshot" subtitle="Calculated from opening balance and transactions up to tax-year end." icon="asset" tone="cyan">
                  <Table
                    rows={summary.assetAccounts || []}
                    emptyText="No active accounts found for asset snapshot."
                    columns={[
                      { key: "name", label: "Account", render: (r) => <div><p className="font-black text-slate-900 dark:text-white">{r.name}</p><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{r.owner}</p></div> },
                      { key: "type", label: "Type", render: (r) => <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black capitalize text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200">{r.type}</span> },
                      { key: "balance", label: "Balance", align: "right", render: (r) => <span className="font-black text-slate-950 dark:text-white">{bdt(r.balance)}</span> },
                    ]}
                  />
                </SectionCard>
                <SectionCard title="Assets & Liabilities" subtitle="Manual assets/liabilities can be added from the records tab." icon="wallet" tone="indigo">
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-cyan-50 p-4 dark:bg-cyan-400/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">Assets</p>
                      <p className="mt-2 text-2xl font-black text-cyan-950 dark:text-cyan-100">{bdt(totals.assets)}</p>
                      <p className="mt-1 text-xs font-semibold text-cyan-700/80 dark:text-cyan-100/70">Includes account balances and manual asset records.</p>
                    </div>
                    <div className="rounded-3xl bg-rose-50 p-4 dark:bg-rose-400/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-200">Liabilities</p>
                      <p className="mt-2 text-2xl font-black text-rose-950 dark:text-rose-100">{bdt(totals.liabilities)}</p>
                      <p className="mt-1 text-xs font-semibold text-rose-700/80 dark:text-rose-100/70">Manual loans, payable dues, or liabilities.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-100 p-4 dark:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Net worth</p>
                      <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{bdt(totals.netWorth)}</p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === "records" && (
              <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
                <SectionCard title={editingId ? "Edit Tax Record" : "Add Manual Tax Record"} subtitle="Use this for tax items that are not automatically captured from Ledger." icon="plus" tone="indigo">
                  <form onSubmit={submitRecord} className="space-y-3">
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Record type</span>
                      <select className={fieldClass} value={form.recordType} onChange={(e) => changeForm("recordType", e.target.value)}>
                        {recordTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Member</span>
                      <select className={fieldClass} value={form.userId} onChange={(e) => changeForm("userId", e.target.value)}>
                        <option value="">Family / shared</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Date</span>
                      <input className={fieldClass} type="date" value={form.date} onChange={(e) => changeForm("date", e.target.value)} />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Title</span>
                      <input className={fieldClass} value={form.title} onChange={(e) => changeForm("title", e.target.value)} placeholder="Example: DPS deposit receipt" />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <label>
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Category</span>
                        <input className={fieldClass} value={form.category} onChange={(e) => changeForm("category", e.target.value)} placeholder="DPS, Insurance, TDS" />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Amount</span>
                        <input className={fieldClass} type="number" min="0" step="0.01" value={form.amount} onChange={(e) => changeForm("amount", e.target.value)} placeholder="0" />
                      </label>
                    </div>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Institution</span>
                      <input className={fieldClass} value={form.institution} onChange={(e) => changeForm("institution", e.target.value)} placeholder="Bank, company, office" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Proof reference</span>
                      <input className={fieldClass} value={form.proofRef} onChange={(e) => changeForm("proofRef", e.target.value)} placeholder="Receipt no, file name, challan no" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Note</span>
                      <textarea className={`${fieldClass} min-h-[92px] resize-none`} value={form.note} onChange={(e) => changeForm("note", e.target.value)} placeholder="Any extra note" />
                    </label>

                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                        {saving ? <InlineSpinner label="Saving..." tone="light" /> : <><Icon name="plus" className="h-4 w-4" /> {editingId ? "Update Record" : "Save Record"}</>}
                      </button>
                      {editingId ? (
                        <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                </SectionCard>

                <SectionCard title="Manual Records" subtitle="Extra income, rebate, asset, liability, tax paid, or document checklist records." icon="doc" tone="slate">
                  <Table
                    rows={summary.manualRecords || []}
                    emptyText="No manual tax records yet."
                    columns={[
                      { key: "date", label: "Date", render: (r) => <span className="font-bold text-slate-600 dark:text-slate-300">{formatDate(r.date)}</span> },
                      { key: "title", label: "Record", render: (r) => <div><p className="font-black text-slate-900 dark:text-white">{r.title}</p><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{recordTypeOptions.find((x) => x.value === r.recordType)?.label || r.recordType} {r.userId?.name ? `• ${r.userId.name}` : ""}</p></div> },
                      { key: "category", label: "Category", render: (r) => <span className="font-bold text-slate-600 dark:text-slate-300">{r.category || "-"}</span> },
                      { key: "amount", label: "Amount", align: "right", render: (r) => <span className="font-black text-slate-950 dark:text-white">{Number(r.amount || 0) > 0 ? bdt(r.amount) : "-"}</span> },
                      { key: "actions", label: "", align: "right", render: (r) => (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => editRecord(r)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10" title="Edit">
                            <Icon name="edit" className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => deleteRecord(r._id)} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/20 dark:text-rose-200 dark:hover:bg-rose-400/10" title="Delete">
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      )},
                    ]}
                  />
                </SectionCard>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
