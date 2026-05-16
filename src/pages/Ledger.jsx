import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function dayNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalYMD(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatPrettyDate(dateLike) {
  if (!dateLike) return "No date";
  const d = new Date(dateLike);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(value) {
  if (!value) return "Select month";
  const [year, month] = String(value).split("-");
  const d = new Date(Number(year), Number(month || 1) - 1, 1);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function money(n) {
  const v = Number(n || 0);
  return `৳ ${v.toLocaleString("en-BD", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function moneyPdf(n) {
  const v = Number(n || 0);
  return `Tk ${v.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPdfDate(dateLike) {
  const d = new Date(dateLike);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pct(part, total) {
  const p = total <= 0 ? 0 : (Number(part || 0) / Number(total || 0)) * 100;
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

function getId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v._id || v.id || "");
}

function typeLabel(t) {
  if (t === "income") return "Income";
  if (t === "expense") return "Expense";
  if (t === "transfer") return "Transfer";
  return t || "Transaction";
}

function splitLabel(split) {
  const t = split?.type;
  if (t === "equal") return "Equal";
  if (t === "personal") return "Personal";
  if (t === "ratio") return "Ratio";
  if (t === "fixed") return "Fixed Amount";
  return "";
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

  if (name === "plus") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }
  if (name === "download") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
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
  if (name === "sun") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }
  if (name === "moon") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M21 14.2A8 8 0 0 1 9.8 3 7 7 0 1 0 21 14.2z" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M13 2 3 14h8l-1 8 11-14h-8l0-6z" />
      </svg>
    );
  }
  if (name === "edit") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    );
  }
  if (name === "wallet") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M3 7h18v14H3z" />
        <path d="M3 7l2-4h14l2 4" />
        <path d="M17 14h4" />
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

function TypeDot({ txType }) {
  const map = {
    income: "bg-emerald-500 shadow-emerald-500/40",
    expense: "bg-rose-500 shadow-rose-500/40",
    transfer: "bg-sky-500 shadow-sky-500/40",
  };
  return (
    <span
      className={cn(
        "inline-block h-3 w-3 rounded-full shadow-lg ring-4 ring-white dark:ring-slate-950",
        map[txType] || "bg-slate-400"
      )}
    />
  );
}

function PillButton({ active, children, onClick, tone = "slate" }) {
  const activeMap = {
    slate: "bg-slate-950 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-950",
    income: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25",
    expense: "bg-rose-600 text-white shadow-lg shadow-rose-500/25",
    transfer: "bg-sky-600 text-white shadow-lg shadow-sky-500/25",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
        active
          ? activeMap[tone]
          : "border border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, onClick, variant = "primary", type = "button", disabled = false }) {
  const variants = {
    primary:
      "bg-slate-950 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
    warm:
      "bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35",
    soft:
      "border border-slate-200 bg-white/80 text-slate-700 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
        variants[variant]
      )}
    >
      {children}
    </button>
  );
}

function MetricCard({ title, value, subtitle, tone = "neutral", icon = "chart" }) {
  const toneMap = {
    neutral: {
      card: "from-slate-50 via-white to-slate-100 border-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-white/10",
      badge: "bg-slate-900 text-white dark:bg-white dark:text-slate-950",
      glow: "bg-slate-300/40",
    },
    income: {
      card: "from-emerald-50 via-white to-teal-50 border-emerald-200 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 dark:border-emerald-500/20",
      badge: "bg-emerald-600 text-white",
      glow: "bg-emerald-400/30",
    },
    expense: {
      card: "from-rose-50 via-white to-orange-50 border-rose-200 dark:from-rose-950/40 dark:via-slate-900 dark:to-orange-950/25 dark:border-rose-500/20",
      badge: "bg-rose-600 text-white",
      glow: "bg-rose-400/30",
    },
    transfer: {
      card: "from-sky-50 via-white to-cyan-50 border-sky-200 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/25 dark:border-sky-500/20",
      badge: "bg-sky-600 text-white",
      glow: "bg-sky-400/30",
    },
    net: {
      card: "from-violet-50 via-white to-fuchsia-50 border-violet-200 dark:from-violet-950/40 dark:via-slate-900 dark:to-fuchsia-950/25 dark:border-violet-500/20",
      badge: "bg-violet-600 text-white",
      glow: "bg-violet-400/30",
    },
  };

  const s = toneMap[tone] || toneMap.neutral;

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl sm:p-4", s.card)}>
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition group-hover:scale-125", s.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs sm:tracking-[0.18em]">
            {title}
          </div>
          <div className="mt-1.5 break-words text-xl font-black tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-2xl">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-1.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-xs sm:leading-5">
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className={cn("hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:flex", s.badge)}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{children}</label>;
}

function FieldInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition [color-scheme:light] focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:[color-scheme:dark] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm",
        className
      )}
    />
  );
}

function FieldSelect({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition [color-scheme:light] focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:[color-scheme:dark] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm",
        className
      )}
    >
      {children}
    </select>
  );
}

export default function Ledger() {
  const me = getUser();

  const [month, setMonth] = useState(monthNow());
  const [activeTab, setActiveTab] = useState("all");
  const [day, setDay] = useState(dayNow());
  const [members, setMembers] = useState([]);
  const [incomeCats, setIncomeCats] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [memberFilter, setMemberFilter] = useState("all");
  const [q, setQ] = useState("");

  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [ledgerItems, setLedgerItems] = useState([]);

  const [totals, setTotals] = useState({
    income: 0,
    expense: 0,
    transfer: 0,
    netCashflow: 0,
  });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    txType: "expense",
    date: new Date().toISOString().slice(0, 10),
    categoryId: "",
    amount: "",
    note: "",
    fromAccountId: "",
    toAccountId: "",
    paidByUserId: "",
    receivedByUserId: "",
    splitType: "personal",
    personalUserId: "",
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
  });

  const fixedExpenseTotal = useMemo(() => {
    return (allItems || [])
      .filter(
        (t) =>
          t.txType === "expense" &&
          (t.note?.toLowerCase().includes("fixed") ||
            t.categoryId?.name?.toLowerCase().includes("housing"))
      )
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [allItems]);

  const remainingExpense = useMemo(() => {
    return Number(totals.expense || 0) - Number(fixedExpenseTotal || 0);
  }, [totals, fixedExpenseTotal]);

  async function loadBasics() {
    const [mRes, inc, exp, acc] = await Promise.all([
      api.get("/api/family/members"),
      api.get("/api/categories", { params: { kind: "income" } }),
      api.get("/api/categories", { params: { kind: "expense" } }),
      api.get("/api/accounts"),
    ]);

    setMembers(mRes.data.members || []);
    setIncomeCats(inc.data.items || []);
    setExpenseCats(exp.data.items || []);
    setAccounts((acc.data.items || []).filter((a) => a.isActive !== false));
  }

  async function loadTransactions() {
    setLoading(true);
    setMsg("");

    try {
      const baseParams = { month };

      const txParams = { ...baseParams };
      if (activeTab !== "all") txParams.txType = activeTab;

      const ledgerParams = { ...baseParams };
      if (activeTab !== "all" && activeTab !== "transfer") {
        ledgerParams.entryType = activeTab;
      }

      const [listRes, allRes, sumRes, ledgerRes] = await Promise.all([
        api.get("/api/transactions", { params: txParams }),
        api.get("/api/transactions", { params: baseParams }),
        api.get("/api/transactions/summary", { params: baseParams }),
        api.get("/api/ledger", { params: ledgerParams }),
      ]);

      setItems(listRes.data.items || []);
      setAllItems(allRes.data.items || []);
      setTotals(
        sumRes.data.totals || {
          income: 0,
          expense: 0,
          transfer: 0,
          netCashflow: 0,
        }
      );
      setLedgerItems(ledgerRes.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBasics().catch((e) => setMsg(e?.response?.data?.message || "Failed to load basic data"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, activeTab]);

  const memberById = useMemo(() => {
    const m = new Map();
    for (const x of members || []) m.set(getId(x), x);
    return m;
  }, [members]);

  const accountsById = useMemo(() => {
    const m = new Map();
    for (const a of accounts || []) m.set(String(a._id), a);
    return m;
  }, [accounts]);

  const ownerToMemberId = useMemo(() => {
    const out = { Mahbub: "", Mirza: "", Joint: "" };
    const lowerMembers = (members || []).map((m) => ({
      id: getId(m),
      name: String(m.name || "").toLowerCase(),
    }));
    const findByKeyword = (kw) =>
      lowerMembers.find((x) => x.name.includes(kw.toLowerCase()))?.id || "";
    out.Mahbub = findByKeyword("mahbub");
    out.Mirza = findByKeyword("mirza");
    return out;
  }, [members]);

  const otherMember = useMemo(() => {
    const myId = String(me?.id || "");
    return (members || []).find((m) => String(getId(m)) !== myId) || null;
  }, [members, me?.id]);

  const showCategory = form.txType !== "transfer";
  const showFrom = form.txType === "expense" || form.txType === "transfer";
  const showTo = form.txType === "income" || form.txType === "transfer";

  function getDefaultForm(next = {}) {
    const defaultUser = getId(members?.[0]) || "";
    const defaultAccount = accounts?.[0]?._id || "";

    return {
      txType: next.txType || "expense",
      date: next.date || new Date().toISOString().slice(0, 10),
      categoryId: next.categoryId || "",
      amount: next.amount === 0 || next.amount ? String(next.amount) : "",
      note: next.note || "",
      fromAccountId: next.fromAccountId || defaultAccount,
      toAccountId: next.toAccountId || defaultAccount,
      paidByUserId: next.paidByUserId || defaultUser,
      receivedByUserId: next.receivedByUserId || defaultUser,
      splitType: next.splitType || "personal",
      personalUserId: next.personalUserId || next.paidByUserId || defaultUser,
      ratioMe: next.ratioMe ?? 50,
      ratioOther: next.ratioOther ?? 50,
      fixedMe: next.fixedMe ?? "",
      fixedOther: next.fixedOther ?? "",
    };
  }

  function openModal() {
    setMsg("");
    setIsEditing(false);
    setEditId(null);
    setForm(getDefaultForm());
    setOpen(true);
  }

  function transactionSplitToForm(item) {
    const split = item?.split || {};
    const splitType = split?.type || "personal";

    const out = {
      splitType,
      personalUserId: getId(split.personalUserId) || getId(item?.paidByUserId),
      ratioMe: 50,
      ratioOther: 50,
      fixedMe: "",
      fixedOther: "",
    };

    if (splitType === "ratio" && Array.isArray(split.ratios)) {
      const myRatio = split.ratios.find((r) => String(getId(r.userId)) === String(me?.id));
      const otherRatio = split.ratios.find((r) => String(getId(r.userId)) === String(getId(otherMember)));
      out.ratioMe = myRatio?.ratio ?? 50;
      out.ratioOther = otherRatio?.ratio ?? 50;
    }

    if (splitType === "fixed" && Array.isArray(split.fixed)) {
      const myFixed = split.fixed.find((f) => String(getId(f.userId)) === String(me?.id));
      const otherFixed = split.fixed.find((f) => String(getId(f.userId)) === String(getId(otherMember)));
      out.fixedMe = myFixed?.amount ?? "";
      out.fixedOther = otherFixed?.amount ?? "";
    }

    return out;
  }

  function openEditModal(item) {
    setMsg("");
    setIsEditing(true);
    setEditId(item._id);
    setForm(
      getDefaultForm({
        txType: item.txType || "expense",
        date: toLocalYMD(item.date),
        categoryId: getId(item.categoryId),
        amount: item.amount,
        note: item.note || "",
        fromAccountId: getId(item.fromAccountId),
        toAccountId: getId(item.toAccountId),
        paidByUserId: getId(item.paidByUserId),
        receivedByUserId: getId(item.receivedByUserId),
        ...transactionSplitToForm(item),
      })
    );
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setIsEditing(false);
    setEditId(null);
    setMsg("");
  }

  async function saveTx() {
    setMsg("");
    try {
      const amt = Number(form.amount);
      if (!amt || amt <= 0) return setMsg("Amount must be > 0");
      if (showCategory && !form.categoryId) return setMsg("Select a category");
      if (showFrom && !form.fromAccountId) return setMsg("Select From account");
      if (showTo && !form.toAccountId) return setMsg("Select To account");
      if (form.txType === "transfer" && form.fromAccountId === form.toAccountId) {
        return setMsg("From and To accounts must be different");
      }

      let split = null;

      if (form.txType === "expense") {
        if (!form.paidByUserId) return setMsg("Select Paid By");

        split = { type: form.splitType || "personal" };

        if (form.splitType === "personal") {
          if (!form.personalUserId) return setMsg("Select Personal For");
          split.personalUserId = form.personalUserId;
        }

        if (form.splitType === "ratio") {
          if (!otherMember) return setMsg("Need 2 members for Ratio split");
          const r1 = Number(form.ratioMe || 0);
          const r2 = Number(form.ratioOther || 0);
          if (r1 + r2 !== 100) return setMsg("Ratio split must sum to 100");
          split.ratios = [
            { userId: getId(me), ratio: r1 },
            { userId: getId(otherMember), ratio: r2 },
          ];
        }

        if (form.splitType === "fixed") {
          if (!otherMember) return setMsg("Need 2 members for Fixed split");
          const f1 = Number(form.fixedMe || 0);
          const f2 = Number(form.fixedOther || 0);
          if (Math.round((f1 + f2) * 100) / 100 !== Math.round(amt * 100) / 100) {
            return setMsg("Fixed split amounts must sum to total amount");
          }
          split.fixed = [
            { userId: getId(me), amount: f1 },
            { userId: getId(otherMember), amount: f2 },
          ];
        }
      }

      const payload = {
        txType: form.txType,
        date: form.date,
        amount: amt,
        note: form.note,
        categoryId: showCategory ? form.categoryId : null,
        fromAccountId: showFrom ? form.fromAccountId : null,
        toAccountId: showTo ? form.toAccountId : null,
        paidByUserId: form.txType === "expense" ? form.paidByUserId : null,
        receivedByUserId: form.txType === "income" ? form.receivedByUserId : null,
        split,
      };

      if (isEditing && editId) {
        await api.put(`/api/transactions/${editId}`, payload);
      } else {
        await api.post("/api/transactions", payload);
      }

      closeModal();
      await loadTransactions();
    } catch (e) {
      setMsg(e?.response?.data?.message || (isEditing ? "Update failed" : "Create failed"));
    }
  }

  function deleteTx(id) {
    setDeleteId(id);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);
    try {
      await api.delete(`/api/transactions/${deleteId}`);
      await loadTransactions();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  async function rebuildLedger() {
    setMsg("");
    try {
      await api.post("/api/ledger/rebuild", { month });
      await loadTransactions();
      setMsg("✅ Ledger rebuilt successfully for " + month);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Rebuild failed");
    }
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const filtered = (items || []).filter((it) => {
      if (memberFilter !== "all") {
        const filterId = String(memberFilter);
        if (it.txType === "income" && getId(it.receivedByUserId) !== filterId) return false;
        if (it.txType === "expense" && getId(it.paidByUserId) !== filterId) return false;
      }

      if (!needle) return true;

      const catName = it.categoryId?.name || "";
      const fromName = it.fromAccountId?.name || "";
      const toName = it.toAccountId?.name || "";
      const note = it.note || "";
      const splitName = splitLabel(it.split);
      const hay = `${catName} ${fromName} ${toName} ${note} ${splitName} ${it.txType}`.toLowerCase();
      return hay.includes(needle);
    });

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [items, memberFilter, q]);

  const availableDates = useMemo(() => {
    const s = new Set();
    for (const it of rows || []) s.add(toLocalYMD(it.date));
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1));
  }, [rows]);

  useEffect(() => {
    if (!availableDates.length) return;

    const dayMonth = (day || "").slice(0, 7);
    if (dayMonth !== month) {
      setDay(availableDates[0]);
      return;
    }

    if (!availableDates.includes(day)) setDay(availableDates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates, month]);

  const dayRows = useMemo(() => {
    return (rows || []).filter((it) => toLocalYMD(it.date) === day);
  }, [rows, day]);

  const dayTotals = useMemo(() => {
    return dayRows.reduce(
      (acc, it) => {
        acc[it.txType] = Number(acc[it.txType] || 0) + Number(it.amount || 0);
        return acc;
      },
      { income: 0, expense: 0, transfer: 0 }
    );
  }, [dayRows]);

  const memberStats = useMemo(() => {
    const by = {};
    for (const m of members || []) {
      const id = getId(m);
      by[id] = {
        id,
        name: m.name,
        income: 0,
        expense: 0,
        transferIn: 0,
        transferOut: 0,
      };
    }

    for (const e of ledgerItems || []) {
      const amt = Number(e.amountTotal || 0);

      if (e.entryType === "income") {
        const splits = Array.isArray(e.splits) ? e.splits : [];
        if (splits.length > 0) {
          for (const s of splits) {
            const id = getId(s.userId);
            if (id && by[id]) by[id].income += Number(s.shareAmount || 0);
          }
        } else {
          const id = getId(e.receivedByUserId);
          if (id && by[id]) by[id].income += amt;
        }
      }

      if (e.entryType === "expense") {
        const splits = Array.isArray(e.splits) ? e.splits : [];
        if (splits.length > 0) {
          for (const s of splits) {
            const id = getId(s.userId);
            if (id && by[id]) by[id].expense += Number(s.shareAmount || 0);
          }
        } else {
          const id = getId(e.paidByUserId);
          if (id && by[id]) by[id].expense += amt;
        }
      }
    }

    const membersArr = Object.values(by);
    const memberCount = Math.max(1, membersArr.length);

    const participantsForOwner = (owner) => {
      const normalizedOwner = owner || "Joint";
      const ownerMemberId = ownerToMemberId[normalizedOwner] || "";

      if (normalizedOwner !== "Joint" && ownerMemberId && by[ownerMemberId]) {
        return [{ id: ownerMemberId, ratio: 1 }];
      }

      const ratio = 1 / memberCount;
      return membersArr.map((m) => ({ id: m.id, ratio }));
    };

    for (const t of allItems || []) {
      if (t.txType !== "transfer") continue;

      const amt = Number(t.amount || 0);
      const fromAcc = accountsById.get(getId(t.fromAccountId));
      const toAcc = accountsById.get(getId(t.toAccountId));

      const fromOwner = fromAcc?.owner || "Joint";
      const toOwner = toAcc?.owner || "Joint";

      if (fromOwner === toOwner) continue;

      for (const part of participantsForOwner(fromOwner)) {
        if (by[part.id]) by[part.id].transferOut += amt * part.ratio;
      }

      for (const part of participantsForOwner(toOwner)) {
        if (by[part.id]) by[part.id].transferIn += amt * part.ratio;
      }
    }

    const list = Object.values(by).map((x) => {
      const transferIn = Number(x.transferIn || 0);
      const transferOut = Number(x.transferOut || 0);
      const transferNet = transferIn - transferOut;

      return {
        ...x,
        transferIn,
        transferOut,
        transferNet,
        remaining: Number(x.income || 0) - Number(x.expense || 0) + transferNet,
      };
    });

    list.sort((a, b) => b.remaining - a.remaining);
    return list;
  }, [ledgerItems, allItems, members, accountsById, ownerToMemberId]);

  const topExpenseCategory = useMemo(() => {
    const m = new Map();
    for (const it of allItems || []) {
      if (it.txType !== "expense") continue;
      const name = it.categoryId?.name || "Uncategorized";
      m.set(name, (m.get(name) || 0) + Number(it.amount || 0));
    }
    let best = { name: "—", amount: 0 };
    for (const [name, amount] of m.entries()) {
      if (amount > best.amount) best = { name, amount };
    }
    return best;
  }, [allItems]);

  const biggestTransaction = useMemo(() => {
    if (!allItems.length) return null;
    return [...allItems].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
  }, [allItems]);

  const memberRemainingTotal = useMemo(() => {
    return memberStats.reduce((s, x) => s + Number(x.remaining || 0), 0);
  }, [memberStats]);

  async function exportTransactionsPdf() {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      const exportRows = [...rows].sort((a, b) => new Date(a.date) - new Date(b.date));

      const title = "HomeFinance Transaction Statement";
      const subtitle = `Month: ${month}`;
      const filterLine = `Type: ${activeTab === "all" ? "All" : typeLabel(activeTab)} | Member: ${
        memberFilter === "all"
          ? "All members"
          : members.find((m) => getId(m) === memberFilter)?.name || "All members"
      }`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(title, 14, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(subtitle, 14, 23);
      doc.text(filterLine, 14, 28);

      doc.setFont("helvetica", "bold");
      doc.text(`Generated: ${formatPdfDate(new Date())}`, pageWidth - 14, 16, {
        align: "right",
      });

      autoTable(doc, {
        startY: 34,
        theme: "grid",
        head: [["Summary", "Amount"]],
        body: [
          ["Income", moneyPdf(totals.income)],
          ["Expense", moneyPdf(totals.expense)],
          ["Transfer", moneyPdf(totals.transfer)],
          ["Net Cashflow", moneyPdf(totals.netCashflow)],
          ["Remaining Expense", moneyPdf(remainingExpense)],
          ["Transactions Count", String(exportRows.length)],
        ],
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        theme: "grid",
        head: [["Member", "Income", "Expense", "Transfer In", "Transfer Out", "Transfer Net", "Remaining"]],
        body: memberStats.map((m) => [
          m.name || "-",
          moneyPdf(m.income),
          moneyPdf(m.expense),
          moneyPdf(m.transferIn),
          moneyPdf(m.transferOut),
          moneyPdf(m.transferNet),
          moneyPdf(m.remaining),
        ]),
        styles: { fontSize: 8.5, cellPadding: 2.2 },
        headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        theme: "grid",
        head: [["Date", "Type", "Member", "Category / Details", "From", "To", "Amount", "Split", "Note"]],
        body: exportRows.map((it) => {
          const who =
            it.txType === "income"
              ? memberById.get(getId(it.receivedByUserId))?.name || "-"
              : it.txType === "expense"
                ? memberById.get(getId(it.paidByUserId))?.name || "-"
                : "-";

          return [
            formatPdfDate(it.date),
            typeLabel(it.txType),
            who,
            it.categoryId?.name || (it.txType === "transfer" ? "Transfer" : "-"),
            it.fromAccountId?.name || "-",
            it.toAccountId?.name || "-",
            `${it.txType === "expense" ? "-" : it.txType === "income" ? "+" : ""}${moneyPdf(it.amount)}`,
            it.txType === "expense" ? splitLabel(it.split) || "-" : "-",
            it.note || "-",
          ];
        }),
        styles: {
          fontSize: 7.5,
          cellPadding: 1.7,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: { fillColor: [240, 240, 240], textColor: 20, fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 17 },
          1: { cellWidth: 15 },
          2: { cellWidth: 23 },
          3: { cellWidth: 30 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 },
          6: { cellWidth: 22 },
          7: { cellWidth: 18 },
          8: { cellWidth: 28 },
        },
        didDrawPage: () => {
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height || pageSize.getHeight();

          doc.setFontSize(9);
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
            pageWidth - 14,
            pageHeight - 8,
            { align: "right" }
          );
        },
      });

      doc.save(`Transactions_${month}.pdf`);
    } catch (error) {
      console.error(error);
      setMsg("PDF export failed");
    }
  }

  const tabCount = {
    all: allItems.length,
    income: allItems.filter((x) => x.txType === "income").length,
    expense: allItems.filter((x) => x.txType === "expense").length,
    transfer: allItems.filter((x) => x.txType === "transfer").length,
  };

  const monthLabel = formatMonthLabel(month);

  return (
    <AppLayout>
      <div className="ledger-page">
        <div className="min-h-[calc(100vh-7rem)] rounded-2xl bg-slate-100/70 p-2 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white sm:rounded-[2rem] sm:p-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 sm:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl" />
              <div className="absolute right-0 top-8 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />
              <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
            </div>

            <div className="relative p-3 sm:p-5 lg:p-7">
              <section className="overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-900 p-4 text-white shadow-xl shadow-violet-900/20 dark:border-white/10 sm:rounded-[1.75rem] sm:p-6">
                <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur sm:px-3 sm:py-1.5 sm:text-xs">
                      <Icon name="spark" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Monthly ledger
                    </div>
                    <h1 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
                      Ledger Overview
                    </h1>
                    <p className="mt-2 max-w-3xl text-xs leading-5 text-white/75 sm:mt-3 sm:text-sm sm:leading-7 md:text-base">
                      Track income, expenses, transfers, splits, accounts, and member-wise remaining balance.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
                      <ActionButton onClick={openModal} variant="warm">
                        <Icon name="plus" className="h-4 w-4" /> Add Transaction
                      </ActionButton>
                      <ActionButton onClick={exportTransactionsPdf} variant="soft">
                        <Icon name="download" className="h-4 w-4" /> Export PDF
                      </ActionButton>
                    </div>
                  </div>

                  <div className="hidden min-w-[260px] grid-cols-2 gap-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 backdrop-blur-xl sm:grid lg:min-w-[360px]">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs text-white/60">Month</div>
                      <div className="mt-1 text-xl font-black">{monthLabel}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs text-white/60">Transactions</div>
                      <div className="mt-1 text-xl font-black">{allItems.length}</div>
                    </div>
                    <div className="col-span-2 rounded-2xl bg-white/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-white/60">Net Cashflow</div>
                          <div className="mt-1 text-2xl font-black">{money(totals.netCashflow)}</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-950">
                          {totals.netCashflow < 0 ? "Needs control" : "Healthy"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-4 grid gap-3 sm:mt-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <FieldLabel>Month</FieldLabel>
                    <div className="relative">
                      <Icon name="calendar" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <FieldInput
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        type="month"
                        className="pl-10 sm:pl-11"
                        aria-label="Select month"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-2">
                    <FieldLabel>Search</FieldLabel>
                    <div className="relative">
                      <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <FieldInput
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-11"
                        placeholder="Search category, note, account..."
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Member</FieldLabel>
                    <FieldSelect value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} title="Filter by member">
                      <option value="all">All members</option>
                      {members.map((m) => (
                        <option key={getId(m)} value={getId(m)}>
                          {m.name}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                </div>
              </section>

              {msg ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {msg}
                </div>
              ) : null}

              <section className="ledger-no-scrollbar mt-4 flex touch-pan-x gap-2 overflow-x-auto pb-1 sm:mt-5">
                <PillButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
                  All <span className="ml-1 opacity-70">{tabCount.all}</span>
                </PillButton>
                <PillButton active={activeTab === "income"} tone="income" onClick={() => setActiveTab("income")}>
                  Income <span className="ml-1 opacity-70">{tabCount.income}</span>
                </PillButton>
                <PillButton active={activeTab === "expense"} tone="expense" onClick={() => setActiveTab("expense")}>
                  Expense <span className="ml-1 opacity-70">{tabCount.expense}</span>
                </PillButton>
                <PillButton active={activeTab === "transfer"} tone="transfer" onClick={() => setActiveTab("transfer")}>
                  Transfer <span className="ml-1 opacity-70">{tabCount.transfer}</span>
                </PillButton>
              </section>

              <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5">
                <MetricCard title="Income" value={money(totals.income)} tone="income" icon="wallet" />
                <MetricCard title="Expense" value={money(totals.expense)} tone="expense" icon="chart" />
                <MetricCard title="Remaining Expense" value={money(remainingExpense)} subtitle={`Expense - Fixed (${money(fixedExpenseTotal)})`} tone="neutral" icon="spark" />
                <MetricCard title="Transfer" value={money(totals.transfer)} tone="transfer" icon="download" />
                <MetricCard
                  title="Net Cashflow"
                  value={money(totals.netCashflow)}
                  subtitle={totals.netCashflow < 0 ? "Expense is higher than income" : "Income is covering expenses"}
                  tone="net"
                  icon="chart"
                />
              </section>

              <section className="mt-4 grid items-start gap-4 sm:mt-5 xl:grid-cols-[1fr_380px] xl:gap-5">
                <div className="space-y-4 sm:space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/50 sm:rounded-[1.75rem] sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Individual Summary</div>
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm sm:leading-6">
                          Remaining = income split − expense split + transfer net.
                        </p>
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                          Ledger entries: <b>{ledgerItems.length}</b> • Transactions: <b>{allItems.length}</b>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:rounded-2xl sm:px-4 sm:text-sm">
                          Total Remaining: <b className="text-slate-950 dark:text-white">{money(memberRemainingTotal)}</b>
                        </div>
                        {ledgerItems.length === 0 && allItems.length > 0 ? (
                          <ActionButton onClick={rebuildLedger} variant="soft">
                            Rebuild Ledger
                          </ActionButton>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {memberStats.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                          No family members found.
                        </div>
                      ) : (
                        memberStats.map((m, idx) => {
                          const maxAbs = Math.max(
                            1,
                            ...memberStats.map((x) =>
                              Math.max(
                                Math.abs(x.income),
                                Math.abs(x.expense),
                                Math.abs(x.remaining),
                                Math.abs(x.transferIn),
                                Math.abs(x.transferOut)
                              )
                            )
                          );

                          const remP = pct(Math.abs(m.remaining), maxAbs);
                          const isNeg = m.remaining < 0;

                          return (
                            <div key={m.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm dark:border-white/10 dark:from-white/10 dark:to-white/5 sm:rounded-3xl sm:p-4">
                              <div className={cn("absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl", idx % 2 === 0 ? "bg-violet-400/20" : "bg-emerald-400/20")} />
                              <div className="relative flex items-start gap-3">
                                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-950 sm:flex">
                                  {initials(m.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-bold text-slate-950 dark:text-white sm:text-base">{m.name}</div>
                                      <div className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-5">
                                        Income {money(m.income)} • Expense {money(m.expense)}
                                        <span className="hidden sm:inline">
                                          <br />
                                          In {money(m.transferIn)} • Out {money(m.transferOut)} • Net {money(m.transferNet)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className={cn("shrink-0 rounded-xl px-2.5 py-1 text-xs font-black sm:rounded-2xl sm:px-3 sm:text-sm", isNeg ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200")}>
                                      {money(m.remaining)}
                                    </div>
                                  </div>

                                  <div className="mt-3 sm:mt-4">
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10 sm:h-3">
                                      <div className={cn("h-full rounded-full", isNeg ? "bg-gradient-to-r from-rose-500 to-orange-400" : "bg-gradient-to-r from-emerald-500 to-teal-400")} style={{ width: `${remP}%` }} />
                                    </div>
                                    <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-xs">
                                      {isNeg ? "Negative balance" : "Remaining after expenses"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/50 sm:rounded-[1.75rem] sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Selected Day</div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                          Income, expense and transfer for {formatPrettyDate(day)}.
                        </p>
                      </div>
                      <div className="w-full sm:w-[190px]">
                        <FieldInput
                          type="date"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          aria-label="Select day"
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] sm:mt-4 sm:text-xs">
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200 sm:rounded-2xl sm:p-3">
                        <div>Income</div>
                        <b>{money(dayTotals.income)}</b>
                      </div>
                      <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200 sm:rounded-2xl sm:p-3">
                        <div>Expense</div>
                        <b>{money(dayTotals.expense)}</b>
                      </div>
                      <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200 sm:rounded-2xl sm:p-3">
                        <div>Transfer</div>
                        <b>{money(dayTotals.transfer)}</b>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/50 sm:rounded-[1.75rem] sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Quick Insights</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Readable overview for this month.</p>
                    </div>
                    <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white sm:flex">
                      <Icon name="spark" className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-white/5 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Shown transactions</span>
                      <b>{rows.length}</b>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-white/5 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Selected day items</span>
                      <b>{dayRows.length}</b>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-white/5 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      <div className="text-slate-500 dark:text-slate-400">Top expense category</div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <b className="truncate" title={topExpenseCategory.name}>{topExpenseCategory.name}</b>
                        <b className="text-rose-600 dark:text-rose-300">{money(topExpenseCategory.amount)}</b>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-white/5 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      <div className="text-slate-500 dark:text-slate-400">Biggest transaction</div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <b>{biggestTransaction ? typeLabel(biggestTransaction.txType) : "—"}</b>
                        <b>{biggestTransaction ? money(biggestTransaction.amount) : money(0)}</b>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 hidden rounded-2xl border border-violet-100 bg-violet-50 p-4 text-xs leading-5 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 sm:block">
                    Transfers use account ownership: Mahbub, Mirza, or Joint. Same-owner transfers are not counted as personal spending.
                  </div>
                </div>
              </section>

              <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/50 sm:mt-5 sm:rounded-[1.75rem]">
                <div className="border-b border-slate-200 p-4 dark:border-white/10 sm:p-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Transaction Timeline</div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                        {monthLabel} — {dayRows.length} item(s) for {formatPrettyDate(day)}
                      </p>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                      <div className="min-w-0 sm:w-[190px]">
                        <FieldInput
                          type="date"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          aria-label="Select timeline date"
                        />
                      </div>
                      <ActionButton onClick={() => setDay(dayNow())} variant="soft">
                        Today
                      </ActionButton>
                      <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-white/5 dark:text-slate-400 sm:rounded-2xl sm:px-4 sm:text-xs">
                        Logged in as <b className="text-slate-900 dark:text-white">{me?.name || "User"}</b>
                      </div>
                    </div>
                  </div>

                  {availableDates.length > 0 ? (
                    <div className="ledger-no-scrollbar mt-3 flex touch-pan-x gap-2 overflow-x-auto pb-1 sm:mt-4">
                      {availableDates.slice(0, 12).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDay(d)}
                          className={cn(
                            "whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition sm:rounded-2xl sm:text-xs",
                            day === d
                              ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          )}
                        >
                          {formatPrettyDate(d)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {loading ? (
                  <Loader text="Loading ledger" subtext="Collecting transactions and balances" />
                ) : rows.length === 0 ? (
                  <div className="p-8 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                    No transactions match your filters. Click <b>+ Add Transaction</b> to create one.
                  </div>
                ) : dayRows.length === 0 ? (
                  <div className="p-8 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                    No transactions found for <b>{day}</b>. Try another date.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {dayRows.map((it) => {
                      const catName = it.categoryId?.name;
                      const fromName = it.fromAccountId?.name;
                      const toName = it.toAccountId?.name;

                      let details = "";
                      if (it.txType === "transfer") details = `${fromName || "-"} → ${toName || "-"}`;
                      else if (it.txType === "income") details = `${catName || "-"} • To: ${toName || "-"}`;
                      else details = `${catName || "-"} • From: ${fromName || "-"}`;

                      const splitText = it.txType === "expense" ? splitLabel(it.split) : "";

                      const who =
                        it.txType === "income"
                          ? memberById.get(getId(it.receivedByUserId))?.name
                          : it.txType === "expense"
                            ? memberById.get(getId(it.paidByUserId))?.name
                            : null;

                      return (
                        <div key={it._id} className="group px-3 py-3 transition hover:bg-slate-50/70 dark:hover:bg-white/[0.03] sm:px-5 sm:py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-4">
                              <div className="pt-1">
                                <TypeDot txType={it.txType} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <div className="text-sm font-black text-slate-950 dark:text-white sm:text-base">{typeLabel(it.txType)}</div>
                                  {who ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:px-2.5 sm:py-1 sm:text-xs">
                                      {who}
                                    </span>
                                  ) : null}
                                  {splitText ? (
                                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200 sm:px-2.5 sm:py-1 sm:text-xs">
                                      <span className="hidden sm:inline">Split: </span>{splitText}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm sm:leading-6">
                                  {details}
                                </div>
                                {it.note ? (
                                  <div className="mt-2 max-w-full truncate rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400 sm:rounded-2xl sm:text-sm" title={it.note}>
                                    {it.note}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div
                                className={cn(
                                  "whitespace-nowrap text-sm font-black sm:text-lg",
                                  it.txType === "income"
                                    ? "text-emerald-600 dark:text-emerald-300"
                                    : it.txType === "expense"
                                      ? "text-rose-600 dark:text-rose-300"
                                      : "text-sky-600 dark:text-sky-300"
                                )}
                              >
                                {it.txType === "expense" ? "-" : it.txType === "income" ? "+" : ""}
                                {money(it.amount)}
                              </div>
                              <div className="mt-2 flex items-center justify-end gap-1.5 sm:gap-2">
                                <button
                                  onClick={() => openEditModal(it)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
                                >
                                  <Icon name="edit" className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  onClick={() => deleteTx(it._id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
                                >
                                  <Icon name="trash" className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        <ConfirmModal
          open={confirmOpen}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {open && (
          <div className="app-modal-overlay">
            <div className="app-modal-panel max-w-3xl rounded-[1.75rem] border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white">{isEditing ? "Edit Transaction" : "Add Transaction"}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Use <b>Transfer</b> for moving money between accounts. Expense entries support Personal, Equal, Ratio and Fixed split.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <FieldSelect
                    value={form.txType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        txType: e.target.value,
                        categoryId: "",
                        splitType: e.target.value === "expense" ? form.splitType : "personal",
                      })
                    }
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                  </FieldSelect>
                </div>

                <div>
                  <FieldLabel>Date</FieldLabel>
                  <FieldInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>

                {showCategory && (
                  <div className="md:col-span-2">
                    <FieldLabel>Category</FieldLabel>
                    <FieldSelect value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">Select category</option>
                      {(form.txType === "income" ? incomeCats : expenseCats).map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                )}

                {showFrom && (
                  <div className="md:col-span-2">
                    <FieldLabel>From Account</FieldLabel>
                    <FieldSelect value={form.fromAccountId} onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}>
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} {a.owner ? `(${a.owner})` : ""}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                )}

                {showTo && (
                  <div className="md:col-span-2">
                    <FieldLabel>To Account</FieldLabel>
                    <FieldSelect value={form.toAccountId} onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}>
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} {a.owner ? `(${a.owner})` : ""}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                )}

                {form.txType === "expense" && (
                  <div className="md:col-span-2">
                    <FieldLabel>Paid By</FieldLabel>
                    <FieldSelect value={form.paidByUserId} onChange={(e) => setForm({ ...form, paidByUserId: e.target.value })}>
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={getId(m)} value={getId(m)}>
                          {m.name}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                )}

                {form.txType === "expense" && (
                  <div className="md:col-span-2 rounded-[1.5rem] border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950 dark:text-white">Split Details</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Select how this expense should affect personal remaining.</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FieldLabel>Split Type</FieldLabel>
                        <FieldSelect value={form.splitType} onChange={(e) => setForm({ ...form, splitType: e.target.value })}>
                          <option value="personal">Personal</option>
                          <option value="equal">Equal</option>
                          <option value="ratio">Ratio</option>
                          <option value="fixed">Fixed Amount</option>
                        </FieldSelect>
                      </div>

                      {form.splitType === "personal" && (
                        <div className="sm:col-span-2">
                          <FieldLabel>Personal For</FieldLabel>
                          <FieldSelect value={form.personalUserId} onChange={(e) => setForm({ ...form, personalUserId: e.target.value })}>
                            <option value="">Select member</option>
                            {members.map((m) => (
                              <option key={getId(m)} value={getId(m)}>
                                {m.name}
                              </option>
                            ))}
                          </FieldSelect>
                        </div>
                      )}

                      {form.splitType === "ratio" && otherMember && (
                        <>
                          <div>
                            <FieldLabel>My %</FieldLabel>
                            <FieldInput type="number" value={form.ratioMe} onChange={(e) => setForm({ ...form, ratioMe: e.target.value })} />
                          </div>
                          <div>
                            <FieldLabel>{otherMember.name} %</FieldLabel>
                            <FieldInput type="number" value={form.ratioOther} onChange={(e) => setForm({ ...form, ratioOther: e.target.value })} />
                          </div>
                          <div className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">Ratio total must be exactly 100.</div>
                        </>
                      )}

                      {form.splitType === "fixed" && otherMember && (
                        <>
                          <div>
                            <FieldLabel>My Amount</FieldLabel>
                            <FieldInput type="number" value={form.fixedMe} onChange={(e) => setForm({ ...form, fixedMe: e.target.value })} placeholder="e.g., 300" />
                          </div>
                          <div>
                            <FieldLabel>{otherMember.name} Amount</FieldLabel>
                            <FieldInput type="number" value={form.fixedOther} onChange={(e) => setForm({ ...form, fixedOther: e.target.value })} placeholder="e.g., 200" />
                          </div>
                          <div className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">Fixed amounts must be equal to the total expense amount.</div>
                        </>
                      )}

                      {form.splitType === "equal" && (
                        <div className="sm:col-span-2 rounded-2xl bg-white/80 p-3 text-xs leading-5 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                          The expense will be shared equally among all family members.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {form.txType === "income" && (
                  <div className="md:col-span-2">
                    <FieldLabel>Received By</FieldLabel>
                    <FieldSelect value={form.receivedByUserId} onChange={(e) => setForm({ ...form, receivedByUserId: e.target.value })}>
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={getId(m)} value={getId(m)}>
                          {m.name}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>
                )}

                <div className="md:col-span-2">
                  <FieldLabel>Amount</FieldLabel>
                  <FieldInput type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g., 5000" />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Note</FieldLabel>
                  <FieldInput
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={form.txType === "transfer" ? "e.g., DPS deposit" : "e.g., Electricity bill"}
                  />
                </div>
              </div>

              {msg ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{msg}</div> : null}

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                <ActionButton onClick={closeModal} variant="soft">
                  Cancel
                </ActionButton>
                <ActionButton onClick={saveTx} variant="warm">
                  {isEditing ? "Update Transaction" : "Save Transaction"}
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
