import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
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
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition [color-scheme:light] focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:[color-scheme:dark] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
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
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition [color-scheme:light] focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:[color-scheme:dark] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
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
  const savingRef = useRef(false);
  const [savingTx, setSavingTx] = useState(false);

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
    paymentMode: "single",
    paymentParts: [],
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
  const showFrom = (form.txType === "expense" && form.paymentMode !== "split") || form.txType === "transfer";
  const showTo = form.txType === "income" || form.txType === "transfer";

  const visibleCategoryList = useMemo(() => {
    const list = form.txType === "income" ? incomeCats : expenseCats;

    return (list || []).filter(
      (c) => String(c?.name || "").trim().toLowerCase() !== "emi"
    );
  }, [form.txType, incomeCats, expenseCats]);

  function isSavingsAccount(account) {
    const type = String(account?.type || "").trim().toLowerCase();
    const name = String(account?.name || "").trim().toLowerCase();

    return (
      type === "saving" ||
      type === "savings" ||
      name.includes("saving")
    );
  }

  function isNormalPaymentAccount(account) {
    const type = String(account?.type || "").trim().toLowerCase();

    return (
      account?.isActive !== false &&
      ["cash", "bank", "wallet"].includes(type) &&
      !isSavingsAccount(account)
    );
  }

  function accountLabel(account) {
    if (!account) return "";

    const name = account.name || "Account";
    const owner = account.owner ? ` (${account.owner})` : "";

    return `${name}${owner}`;
  }

  function accountMatchesPaidBy(account, paidByUserId) {
    if (!paidByUserId) return true;

    const owner = String(account?.owner || "").trim().toLowerCase();

    if (!owner) return true;
    if (["joint", "shared", "family"].includes(owner)) return true;

    const member = memberById.get(String(paidByUserId));
    const memberName = String(member?.name || "").trim().toLowerCase();

    if (!memberName) return true;

    const memberParts = memberName.split(/\s+/).filter(Boolean);

    return (
      memberName.includes(owner) ||
      owner.includes(memberName) ||
      memberParts.some((part) => owner.includes(part) || part.includes(owner))
    );
  }

  function getNormalAccountsForMember(memberId) {
    return (accounts || []).filter(
      (account) =>
        isNormalPaymentAccount(account) &&
        accountMatchesPaidBy(account, memberId)
    );
  }

  function getDefaultPaymentParts(existingParts = []) {
    const existingMap = new Map(
      (existingParts || []).map((part) => [String(getId(part.userId)), part])
    );

    return (members || []).map((member) => {
      const userId = getId(member);
      const previous = existingMap.get(String(userId));
      const availableAccounts = getNormalAccountsForMember(userId);
      const previousAccountId = getId(previous?.accountId);
      const previousAccountStillValid = availableAccounts.some(
        (account) => String(account._id) === String(previousAccountId)
      );

      return {
        userId,
        accountId: previousAccountStillValid
          ? previousAccountId
          : availableAccounts?.[0]?._id || "",
        amount: previous?.amount === 0 || previous?.amount ? String(previous.amount) : "",
      };
    });
  }

  function getPaymentPartsTotal(parts = []) {
    const total = (parts || []).reduce(
      (sum, part) => sum + Number(part.amount || 0),
      0
    );

    return Math.round((total + Number.EPSILON) * 100) / 100;
  }

  function amountInputValue(value) {
    const n = Number(value || 0);
    if (!n || n <= 0) return "";
    return String(Math.round((n + Number.EPSILON) * 100) / 100);
  }

  function setPaymentPart(index, key, value) {
    setForm((prev) => {
      const nextParts = [...(prev.paymentParts || [])];
      nextParts[index] = { ...(nextParts[index] || {}), [key]: value };

      if (key === "amount") {
        const total = getPaymentPartsTotal(nextParts);
        return {
          ...prev,
          paymentParts: nextParts,
          amount: amountInputValue(total),
        };
      }

      return { ...prev, paymentParts: nextParts };
    });
  }

  function paymentSummary(item) {
    if (item?.txType !== "expense") return "";

    const parts = Array.isArray(item.paymentParts) ? item.paymentParts : [];
    if (item.paymentMode === "split" && parts.length > 0) {
      return parts
        .map((part) => {
          const memberName = part.userId?.name || memberById.get(getId(part.userId))?.name || "Member";
          const accountName = part.accountId?.name || accountsById.get(getId(part.accountId))?.name || "Account";
          return `${memberName}: ${money(part.amount)} from ${accountName}`;
        })
        .join(" + ");
    }

    const memberName = item.paidByUserId?.name || memberById.get(getId(item.paidByUserId))?.name || "-";
    const accountName = item.fromAccountId?.name || accountsById.get(getId(item.fromAccountId))?.name || "-";
    return `${memberName} from ${accountName}`;
  }

  const fromAccountOptions = useMemo(() => {
    if (form.txType === "expense") {
      return getNormalAccountsForMember(form.paidByUserId);
    }

    // Transfer should show all active accounts, including savings.
    return accounts || [];
  }, [accounts, form.txType, form.paidByUserId, memberById]);

  const toAccountOptions = useMemo(() => {
    if (form.txType === "income") {
      return getNormalAccountsForMember(form.receivedByUserId);
    }

    // Transfer should show all active accounts, including savings.
    return accounts || [];
  }, [accounts, form.txType, form.receivedByUserId, memberById]);

  function getDefaultForm(next = {}) {
    const defaultUser = getId(members?.[0]) || "";
    const txType = next.txType || "expense";

    const paymentMode = next.paymentMode === "split" ? "split" : "single";
    const defaultPaidBy = paymentMode === "split" ? "" : next.paidByUserId || defaultUser;
    const defaultReceivedBy = next.receivedByUserId || defaultUser;

    const availableFromAccounts =
      txType === "expense" && paymentMode !== "split"
        ? getNormalAccountsForMember(defaultPaidBy)
        : accounts || [];

    const availableToAccounts =
      txType === "income"
        ? getNormalAccountsForMember(defaultReceivedBy)
        : accounts || [];

    const nextFromExists = availableFromAccounts.some(
      (account) => String(account._id) === String(next.fromAccountId)
    );

    const nextToExists = availableToAccounts.some(
      (account) => String(account._id) === String(next.toAccountId)
    );

    const defaultFromAccount = nextFromExists
      ? next.fromAccountId
      : availableFromAccounts?.[0]?._id || "";

    const defaultToAccount = nextToExists
      ? next.toAccountId
      : availableToAccounts?.[0]?._id || "";

    return {
      txType,
      date: next.date || new Date().toISOString().slice(0, 10),
      categoryId: next.categoryId || "",
      amount: next.amount === 0 || next.amount ? String(next.amount) : "",
      note: next.note || "",
      fromAccountId: defaultFromAccount,
      toAccountId: defaultToAccount,
      paidByUserId: defaultPaidBy,
      receivedByUserId: defaultReceivedBy,
      paymentMode,
      paymentParts: paymentMode === "split" ? getDefaultPaymentParts(next.paymentParts || []) : [],
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
        paymentMode: item.paymentMode === "split" ? "split" : "single",
        paymentParts: Array.isArray(item.paymentParts)
          ? item.paymentParts.map((part) => ({
            userId: getId(part.userId),
            accountId: getId(part.accountId),
            amount: part.amount,
          }))
          : [],
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
    if (savingRef.current) return;

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

      let paymentParts = [];

      if (form.txType === "expense") {
        if (form.paymentMode === "split") {
          paymentParts = (form.paymentParts || []).map((part) => ({
            userId: part.userId,
            accountId: part.accountId,
            amount: Number(part.amount || 0),
          }));

          if (paymentParts.length < 2) return setMsg("Split payment needs both members");

          const invalidPayment = paymentParts.find(
            (part) => !part.userId || !part.accountId || !part.amount || part.amount <= 0
          );
          if (invalidPayment) return setMsg("Select account and amount for every split payment row");

          const paidTotal = Math.round(
            paymentParts.reduce((sum, part) => sum + Number(part.amount || 0), 0) * 100
          ) / 100;

          if (paidTotal !== Math.round(amt * 100) / 100) {
            return setMsg("Split payment amounts must sum to total amount");
          }
        } else {
          if (!form.paidByUserId) return setMsg("Select Paid By");
          if (!form.fromAccountId) return setMsg("Select From account");
        }

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
        paidByUserId:
          form.txType === "expense" && form.paymentMode !== "split"
            ? form.paidByUserId
            : null,
        receivedByUserId: form.txType === "income" ? form.receivedByUserId : null,
        paymentMode: form.txType === "expense" ? form.paymentMode : "single",
        paymentParts: form.txType === "expense" && form.paymentMode === "split" ? paymentParts : [],
        split,
      };

      savingRef.current = true;
      setSavingTx(true);

      if (isEditing && editId) {
        await api.put(`/api/transactions/${editId}`, payload);
      } else {
        await api.post("/api/transactions", payload);
      }

      closeModal();
      await loadTransactions();
    } catch (e) {
      setMsg(e?.response?.data?.message || (isEditing ? "Update failed" : "Create failed"));
    } finally {
      savingRef.current = false;
      setSavingTx(false);
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
        if (it.txType === "expense") {
          const parts = Array.isArray(it.paymentParts) ? it.paymentParts : [];
          const memberPaidInSplit = it.paymentMode === "split" && parts.some((part) => getId(part.userId) === filterId);
          if (!memberPaidInSplit && getId(it.paidByUserId) !== filterId) return false;
        }
      }

      if (!needle) return true;

      const catName = it.categoryId?.name || "";
      const fromName = it.fromAccountId?.name || "";
      const toName = it.toAccountId?.name || "";
      const note = it.note || "";
      const splitName = splitLabel(it.split);
      const payText = paymentSummary(it);
      const hay = `${catName} ${fromName} ${toName} ${note} ${splitName} ${payText} ${it.txType}`.toLowerCase();
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

  async function savePdfToPhone(doc, fileName) {
    const dataUri = doc.output("datauristring");
    const base64Data = dataUri.split(",")[1];

    if (!base64Data) {
      throw new Error("PDF data generation failed");
    }

    const folderName = "HomeFinance";
    const finalPath = `${folderName}/${fileName}`;

    try {
      await Filesystem.requestPermissions();
    } catch {
      // Permission prompt may not appear on newer Android versions.
    }

    try {
      await Filesystem.mkdir({
        path: folderName,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch {
      // Folder may already exist.
    }

    await Filesystem.writeFile({
      path: finalPath,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    // Cache copy is for Android share/open dialog.
    // Share plugin can share cache files by default.
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    const cacheFile = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    try {
      await Share.share({
        title: fileName,
        text: `PDF saved to Documents/${finalPath}`,
        files: [cacheFile.uri],
        dialogTitle: "Open or share PDF",
      });
    } catch {
      // User may close the share sheet.
    }

    return finalPath;
  }

  async function exportTransactionsPdf() {
    try {
      const doc = new jsPDF("l", "mm", "a4"); // landscape = better table width

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginX = 10;
      const contentWidth = pageWidth - marginX * 2;

      const COLORS = {
        navy: [15, 23, 42],
        navy2: [30, 41, 59],
        blue: [37, 99, 235],
        blueSoft: [239, 246, 255],
        green: [22, 163, 74],
        greenSoft: [240, 253, 244],
        red: [220, 38, 38],
        redSoft: [254, 242, 242],
        amber: [245, 158, 11],
        amberSoft: [255, 251, 235],
        slate: [71, 85, 105],
        slateSoft: [248, 250, 252],
        border: [226, 232, 240],
        white: [255, 255, 255],
      };

      const exportRows = [...rows].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const selectedMemberName =
        memberFilter === "all"
          ? "All members"
          : members.find((m) => getId(m) === memberFilter)?.name || "All members";

      const reportTitle = "HomeFinance Transaction Statement";
      const reportMonth = formatMonthLabel(month);
      const filterLine = `${activeTab === "all" ? "All transaction types" : typeLabel(activeTab)} • ${selectedMemberName}`;
      const generatedLine = `Generated: ${formatPdfDate(new Date())}`;

      doc.setProperties({
        title: `Transactions_${month}`,
        subject: "HomeFinance Ledger Statement",
        author: "HomeFinance",
        creator: "HomeFinance",
      });

      const safeText = (value) => {
        if (value === null || value === undefined || value === "") return "-";
        return String(value).replace(/\s+/g, " ").trim();
      };

      const pdfOwnerLabel = (ownerValue) => {
        if (!ownerValue) return "";

        if (typeof ownerValue === "object") {
          const ownerId = getId(ownerValue);
          return (
            ownerValue.name ||
            ownerValue.fullName ||
            memberById.get(String(ownerId))?.name ||
            ""
          );
        }

        const ownerText = String(ownerValue).trim();
        if (!ownerText) return "";

        const byId = memberById.get(ownerText)?.name;
        if (byId) return byId;

        const lowerOwner = ownerText.toLowerCase();

        if (["joint", "shared", "family"].includes(lowerOwner)) {
          return "Joint";
        }

        const matchedMember = (members || []).find((member) => {
          const memberName = String(member.name || "").toLowerCase();
          const memberParts = memberName.split(/\s+/).filter(Boolean);

          return (
            memberName.includes(lowerOwner) ||
            lowerOwner.includes(memberName) ||
            memberParts.some(
              (part) => part === lowerOwner || part.includes(lowerOwner) || lowerOwner.includes(part)
            )
          );
        });

        return matchedMember?.name || ownerText;
      };

      const pdfAccountLabel = (accountOrId) => {
        if (!accountOrId) return "-";

        const accountId = getId(accountOrId);
        const fullAccount = accountId ? accountsById.get(String(accountId)) : null;

        const account =
          typeof accountOrId === "object"
            ? { ...(fullAccount || {}), ...(accountOrId || {}) }
            : fullAccount;

        if (!account) return "-";

        const accountName = account.name || "Account";
        const ownerName = pdfOwnerLabel(account.owner);

        return ownerName ? `${ownerName} • ${accountName}` : accountName;
      };

      const drawTopHeader = (compact = false) => {
        const headerY = 8;
        const headerH = compact ? 18 : 30;

        doc.setFillColor(...COLORS.navy);
        doc.roundedRect(marginX, headerY, contentWidth, headerH, 4, 4, "F");

        doc.setFillColor(...COLORS.blue);
        doc.roundedRect(marginX, headerY, 5, headerH, 4, 4, "F");

        doc.setTextColor(...COLORS.white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(compact ? 11 : 17);
        doc.text(reportTitle, marginX + 10, compact ? 20 : 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(compact ? 8 : 9);
        doc.setTextColor(203, 213, 225);
        doc.text(
          compact ? `${reportMonth} • ${filterLine}` : `Month: ${reportMonth}`,
          marginX + 10,
          compact ? 26 : 26
        );

        if (!compact) {
          doc.text(filterLine, marginX + 10, 31);
        }

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(71, 85, 105);
        doc.roundedRect(pageWidth - marginX - 56, compact ? 13 : 15, 48, 9, 4, 4, "FD");

        doc.setTextColor(...COLORS.navy);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(generatedLine, pageWidth - marginX - 32, compact ? 19 : 21, {
          align: "center",
        });
      };

      const drawFooter = (pageNo, pageCount) => {
        const y = pageHeight - 8;

        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.2);
        doc.line(marginX, y - 5, pageWidth - marginX, y - 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.slate);
        doc.text("HomeFinance Ledger Report", marginX, y);

        doc.setFont("helvetica", "bold");
        doc.text(`Page ${pageNo} of ${pageCount}`, pageWidth - marginX, y, {
          align: "right",
        });
      };

      const drawKpiCard = (x, y, w, h, label, value, color, softColor) => {
        doc.setFillColor(...softColor);
        doc.setDrawColor(...COLORS.border);
        doc.roundedRect(x, y, w, h, 3, 3, "FD");

        doc.setTextColor(...COLORS.slate);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(label.toUpperCase(), x + 3, y + 5);

        doc.setTextColor(...color);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        const valueText = doc.splitTextToSize(value, w - 6);
        doc.text(valueText, x + 3, y + 12);
      };

      drawTopHeader(false);

      const cardGap = 3;
      const cardCount = 6;
      const cardW = (contentWidth - cardGap * (cardCount - 1)) / cardCount;
      const cardY = 43;
      const cardH = 20;

      drawKpiCard(
        marginX,
        cardY,
        cardW,
        cardH,
        "Income",
        moneyPdf(totals.income),
        COLORS.green,
        COLORS.greenSoft
      );

      drawKpiCard(
        marginX + (cardW + cardGap) * 1,
        cardY,
        cardW,
        cardH,
        "Expense",
        moneyPdf(totals.expense),
        COLORS.red,
        COLORS.redSoft
      );

      drawKpiCard(
        marginX + (cardW + cardGap) * 2,
        cardY,
        cardW,
        cardH,
        "Transfer",
        moneyPdf(totals.transfer),
        COLORS.blue,
        COLORS.blueSoft
      );

      drawKpiCard(
        marginX + (cardW + cardGap) * 3,
        cardY,
        cardW,
        cardH,
        "Net Cashflow",
        moneyPdf(totals.netCashflow),
        totals.netCashflow >= 0 ? COLORS.green : COLORS.red,
        totals.netCashflow >= 0 ? COLORS.greenSoft : COLORS.redSoft
      );

      drawKpiCard(
        marginX + (cardW + cardGap) * 4,
        cardY,
        cardW,
        cardH,
        "Remaining Expense",
        moneyPdf(remainingExpense),
        COLORS.amber,
        COLORS.amberSoft
      );

      drawKpiCard(
        marginX + (cardW + cardGap) * 5,
        cardY,
        cardW,
        cardH,
        "Transactions",
        String(exportRows.length),
        COLORS.navy,
        COLORS.slateSoft
      );

      autoTable(doc, {
        startY: 70,
        margin: { left: marginX, right: marginX },
        theme: "plain",
        tableWidth: contentWidth,
        head: [
          [
            "Member",
            "Income",
            "Expense",
            "Transfer In",
            "Transfer Out",
            "Transfer Net",
            "Remaining",
          ],
        ],
        body: memberStats.map((m) => [
          safeText(m.name),
          moneyPdf(m.income),
          moneyPdf(m.expense),
          moneyPdf(m.transferIn),
          moneyPdf(m.transferOut),
          moneyPdf(m.transferNet),
          moneyPdf(m.remaining),
        ]),
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: { top: 2.2, right: 2.4, bottom: 2.2, left: 2.4 },
          lineWidth: 0.15,
          lineColor: COLORS.border,
          textColor: COLORS.navy,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: COLORS.navy2,
          textColor: COLORS.white,
          fontStyle: "bold",
          fontSize: 7.8,
          halign: "center",
        },
        bodyStyles: {
          fillColor: COLORS.white,
        },
        alternateRowStyles: {
          fillColor: COLORS.slateSoft,
        },
        columnStyles: {
          0: { cellWidth: 52, fontStyle: "bold" },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const raw = String(data.cell.raw || "");
            if (raw.includes("-")) {
              data.cell.styles.textColor = COLORS.red;
            } else {
              data.cell.styles.textColor = COLORS.green;
            }
          }
        },
      });

      const transactionStartY = doc.lastAutoTable.finalY + 8;

      const transactionBody = exportRows.map((it) => {
        const who =
          it.txType === "income"
            ? memberById.get(getId(it.receivedByUserId))?.name || "-"
            : it.txType === "expense"
              ? it.paymentMode === "split"
                ? "Split Payment"
                : memberById.get(getId(it.paidByUserId))?.name || "-"
              : "-";

        return {
          rawType: it.txType,
          date: formatPdfDate(it.date),
          type: typeLabel(it.txType),
          member: safeText(who),
          category: safeText(
            it.categoryId?.name || (it.txType === "transfer" ? "Transfer" : "-")
          ),
          from:
            it.txType === "expense" && it.paymentMode === "split"
              ? safeText(paymentSummary(it))
              : it.txType === "transfer"
                ? safeText(pdfAccountLabel(it.fromAccountId))
                : safeText(it.fromAccountId?.name),

          to:
            it.txType === "transfer"
              ? safeText(pdfAccountLabel(it.toAccountId))
              : safeText(it.toAccountId?.name),
          amount: `${it.txType === "expense" ? "-" : it.txType === "income" ? "+" : ""}${moneyPdf(
            it.amount
          )}`,
          split: it.txType === "expense" ? safeText(splitLabel(it.split)) : "-",
          note: safeText(it.note),
        };
      });

      autoTable(doc, {
        startY: transactionStartY,
        margin: { left: marginX, right: marginX, top: 12, bottom: 18 },
        theme: "grid",
        tableWidth: contentWidth,
        showHead: "everyPage",
        columns: [
          { header: "Date", dataKey: "date" },
          { header: "Type", dataKey: "type" },
          { header: "Member", dataKey: "member" },
          { header: "Category", dataKey: "category" },
          { header: "From", dataKey: "from" },
          { header: "To", dataKey: "to" },
          { header: "Amount", dataKey: "amount" },
          { header: "Split", dataKey: "split" },
          { header: "Note", dataKey: "note" },
        ],
        body: transactionBody,
        styles: {
          font: "helvetica",
          fontSize: 7.15,
          cellPadding: { top: 1.6, right: 1.8, bottom: 1.6, left: 1.8 },
          lineWidth: 0.12,
          lineColor: COLORS.border,
          textColor: COLORS.navy,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: COLORS.navy,
          textColor: COLORS.white,
          fontStyle: "bold",
          fontSize: 7.2,
          halign: "center",
          lineColor: COLORS.navy,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          date: { cellWidth: 20, halign: "center" },
          type: { cellWidth: 17, halign: "center", fontStyle: "bold" },
          member: { cellWidth: 35 },
          category: { cellWidth: 30 },
          from: { cellWidth: 34 },
          to: { cellWidth: 34 },
          amount: { cellWidth: 25, halign: "right", fontStyle: "bold" },
          split: { cellWidth: 18, halign: "center" },
          note: { cellWidth: 64 },
        },
        didParseCell: (data) => {
          if (data.section !== "body") return;

          const rawType = data.row.raw?.rawType;

          if (data.column.dataKey === "type") {
            data.cell.styles.fontStyle = "bold";

            if (rawType === "income") {
              data.cell.styles.textColor = COLORS.green;
              data.cell.styles.fillColor = COLORS.greenSoft;
            } else if (rawType === "expense") {
              data.cell.styles.textColor = COLORS.red;
              data.cell.styles.fillColor = COLORS.redSoft;
            } else {
              data.cell.styles.textColor = COLORS.blue;
              data.cell.styles.fillColor = COLORS.blueSoft;
            }
          }

          if (data.column.dataKey === "amount") {
            if (rawType === "income") {
              data.cell.styles.textColor = COLORS.green;
            } else if (rawType === "expense") {
              data.cell.styles.textColor = COLORS.red;
            } else {
              data.cell.styles.textColor = COLORS.blue;
            }
          }

          if (data.column.dataKey === "member") {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      const pageCount = doc.getNumberOfPages();

      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        drawFooter(i, pageCount);
      }

      const fileName = `Transactions_${month}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const savedPath = await savePdfToPhone(doc, fileName);
        setMsg(`✅ PDF saved to Documents/${savedPath}`);
      } else {
        doc.save(fileName);
      }
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
      <div className="ledger-page min-h-[calc(100vh-64px)] bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
        <div className="relative p-3 sm:p-5 lg:p-3">
          <section className="overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-900 p-4 text-white shadow-xl shadow-violet-900/20 dark:border-white/10 sm:rounded-[1.75rem] sm:p-6">
            <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur sm:px-3 sm:py-1.5 sm:text-xs">
                  <Icon name="spark" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Monthly ledger
                </div>
                <h1 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:mt-4 sm:text-4xl lg:text-4xl">
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

          <section className="mt-4 grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2 sm:mt-5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5 xl:[&>*:last-child:nth-child(odd)]:col-span-1">
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
                  else {
                    const payText = paymentSummary(it);
                    details = `${catName || "-"}${payText ? ` • ${payText}` : ""}`;
                  }

                  const splitText = it.txType === "expense" ? splitLabel(it.split) : "";

                  const who =
                    it.txType === "income"
                      ? memberById.get(getId(it.receivedByUserId))?.name
                      : it.txType === "expense"
                        ? it.paymentMode === "split"
                          ? "Split Payment"
                          : memberById.get(getId(it.paidByUserId))?.name
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

        <ConfirmModal
          open={confirmOpen}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {open && (
          <div className="app-modal-overlay items-stretch p-0 sm:items-center sm:px-4 sm:py-5">
            <div className="app-modal-panel ledger-modal-panel flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-none border border-white/70 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:h-auto sm:max-h-[92vh] sm:rounded-[30px]">
              {/* Modal Header */}
              <div className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:px-6 sm:py-4">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 hidden rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 sm:inline-flex">
                      {isEditing ? "Update ledger" : "New ledger"}
                    </div>

                    <h3 className="pt-1 text-lg font-black text-slate-950 dark:text-white sm:pt-0 sm:text-xl">
                      {isEditing ? "Edit Transaction" : "Add Transaction"}
                    </h3>

                    <p className="mt-1 hidden text-sm leading-5 text-slate-500 dark:text-slate-400 sm:block">
                      Use Transfer for moving money between accounts. Expense entries support Personal, Equal, Ratio and Fixed split.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black leading-none text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="ledger-modal-scroll flex-1 overflow-y-auto bg-white p-4 pb-5 dark:bg-slate-950 sm:p-6">
                <div className="rounded-[26px] border border-slate-200/70 bg-slate-50/80 p-4 shadow-inner shadow-white/60 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20">
                      <Icon name="wallet" className="h-5 w-5" />
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-950 dark:text-white">
                        Transaction Information
                      </h4>
                      <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                        Keep the form compact and readable in both mobile and desktop.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 sm:gap-4">
                    <div>
                      <FieldLabel>Type</FieldLabel>
                      <FieldSelect
                        value={form.txType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          const defaultUser = getId(members?.[0]) || "";

                          const nextPaidBy = form.paidByUserId || defaultUser;
                          const nextReceivedBy = form.receivedByUserId || defaultUser;

                          const availableFromAccounts =
                            nextType === "expense"
                              ? getNormalAccountsForMember(nextPaidBy)
                              : accounts || [];

                          const availableToAccounts =
                            nextType === "income"
                              ? getNormalAccountsForMember(nextReceivedBy)
                              : accounts || [];

                          const fromStillValid = availableFromAccounts.some(
                            (account) => String(account._id) === String(form.fromAccountId)
                          );

                          const toStillValid = availableToAccounts.some(
                            (account) => String(account._id) === String(form.toAccountId)
                          );

                          setForm({
                            ...form,
                            txType: nextType,
                            categoryId: "",
                            paymentMode: nextType === "expense" ? form.paymentMode || "single" : "single",
                            paymentParts: nextType === "expense" && form.paymentMode === "split" ? getDefaultPaymentParts(form.paymentParts) : [],
                            splitType: nextType === "expense" ? form.splitType : "personal",
                            paidByUserId: nextType === "expense" && form.paymentMode === "split" ? "" : nextPaidBy,
                            receivedByUserId: nextReceivedBy,
                            fromAccountId: fromStillValid
                              ? form.fromAccountId
                              : availableFromAccounts?.[0]?._id || "",
                            toAccountId: toStillValid
                              ? form.toAccountId
                              : availableToAccounts?.[0]?._id || "",
                          });
                        }}
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                      </FieldSelect>
                    </div>

                    <div>
                      <FieldLabel>Date</FieldLabel>
                      <div className="relative">
                        <FieldInput
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          onClick={(e) => {
                            try {
                              e.currentTarget.showPicker?.();
                            } catch {
                              e.currentTarget.focus();
                            }
                          }}
                          className="ledger-date-input cursor-pointer pr-10"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                          <Icon name="calendar" className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    {showCategory && (
                      <div className="md:col-span-2">
                        <FieldLabel>Category</FieldLabel>
                        <FieldSelect
                          value={form.categoryId}
                          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                        >
                          <option value="">Select category</option>

                          {visibleCategoryList.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </FieldSelect>
                      </div>
                    )}

                    {form.txType === "expense" && (
                      <div className="md:col-span-2">
                        <FieldLabel>Paid By</FieldLabel>
                        <FieldSelect
                          value={form.paymentMode === "split" ? "__split__" : form.paidByUserId}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === "__split__") {
                              setForm({
                                ...form,
                                paymentMode: "split",
                                paidByUserId: "",
                                fromAccountId: "",
                                paymentParts: getDefaultPaymentParts(form.paymentParts),
                                amount: amountInputValue(
                                  getPaymentPartsTotal(getDefaultPaymentParts(form.paymentParts))
                                ),
                              });
                              return;
                            }

                            const nextPaidBy = value;
                            const availableAccounts = getNormalAccountsForMember(nextPaidBy);

                            const currentAccountStillValid = availableAccounts.some(
                              (account) => String(account._id) === String(form.fromAccountId)
                            );

                            setForm({
                              ...form,
                              paymentMode: "single",
                              paymentParts: [],
                              paidByUserId: nextPaidBy,
                              personalUserId:
                                !form.personalUserId || form.personalUserId === form.paidByUserId
                                  ? nextPaidBy
                                  : form.personalUserId,
                              fromAccountId: currentAccountStillValid
                                ? form.fromAccountId
                                : availableAccounts?.[0]?._id || "",
                            });
                          }}
                        >
                          <option value="">Select member</option>
                          {members.map((m) => (
                            <option key={getId(m)} value={getId(m)}>
                              {m.name}
                            </option>
                          ))}
                          <option value="__split__">Split Payment</option>
                        </FieldSelect>
                      </div>
                    )}

                    {showFrom && (
                      <div className="md:col-span-2">
                        <FieldLabel>From Account</FieldLabel>
                        <FieldSelect
                          value={form.fromAccountId}
                          onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                        >
                          <option value="">Select account</option>

                          {fromAccountOptions.map((a) => (
                            <option key={a._id} value={a._id}>
                              {form.txType === "transfer" ? accountLabel(a) : a.name}
                            </option>
                          ))}
                        </FieldSelect>
                      </div>
                    )}

                    {form.txType === "expense" && form.paymentMode === "split" && (
                      <div className="md:col-span-2 rounded-[1.25rem] border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:rounded-[1.5rem] sm:p-4">
                        <div className="mb-3">
                          <div className="font-black text-slate-950 dark:text-white">
                            Split Payment Sources
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Select which account each member paid from and how much they paid.
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {(form.paymentParts || []).map((part, index) => {
                            const member = memberById.get(String(part.userId));
                            const accountOptions = getNormalAccountsForMember(part.userId);

                            return (
                              <div
                                key={part.userId || index}
                                className="grid grid-cols-1 gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[1fr_1.3fr_1fr]"
                              >
                                <div>
                                  <FieldLabel>Member</FieldLabel>
                                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm">
                                    {member?.name || "Member"}
                                  </div>
                                </div>

                                <div>
                                  <FieldLabel>Paid From Account</FieldLabel>
                                  <FieldSelect
                                    value={part.accountId || ""}
                                    onChange={(e) => setPaymentPart(index, "accountId", e.target.value)}
                                  >
                                    <option value="">Select account</option>
                                    {accountOptions.map((a) => (
                                      <option key={a._id} value={a._id}>
                                        {a.name}
                                      </option>
                                    ))}
                                  </FieldSelect>
                                </div>

                                <div>
                                  <FieldLabel>Paid Amount</FieldLabel>
                                  <FieldInput
                                    type="number"
                                    value={part.amount || ""}
                                    onChange={(e) => setPaymentPart(index, "amount", e.target.value)}
                                    placeholder="e.g., 500"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
                          Total paid: <b>{money(getPaymentPartsTotal(form.paymentParts))}</b>
                          <span className="mx-2">•</span>
                          Transaction amount: <b>{money(form.amount)}</b>
                        </div>
                      </div>
                    )}

                    {form.txType === "income" && (
                      <div className="md:col-span-2">
                        <FieldLabel>Received By</FieldLabel>
                        <FieldSelect
                          value={form.receivedByUserId}
                          onChange={(e) => {
                            const nextReceivedBy = e.target.value;
                            const availableAccounts = getNormalAccountsForMember(nextReceivedBy);

                            const currentAccountStillValid = availableAccounts.some(
                              (account) => String(account._id) === String(form.toAccountId)
                            );

                            setForm({
                              ...form,
                              receivedByUserId: nextReceivedBy,
                              toAccountId: currentAccountStillValid
                                ? form.toAccountId
                                : availableAccounts?.[0]?._id || "",
                            });
                          }}
                        >
                          <option value="">Select member</option>
                          {members.map((m) => (
                            <option key={getId(m)} value={getId(m)}>
                              {m.name}
                            </option>
                          ))}
                        </FieldSelect>
                      </div>
                    )}

                    {showTo && (
                      <div className="md:col-span-2">
                        <FieldLabel>To Account</FieldLabel>
                        <FieldSelect
                          value={form.toAccountId}
                          onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                        >
                          <option value="">Select account</option>

                          {toAccountOptions.map((a) => (
                            <option key={a._id} value={a._id}>
                              {form.txType === "transfer" ? accountLabel(a) : a.name}
                            </option>
                          ))}
                        </FieldSelect>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <FieldLabel>Amount</FieldLabel>
                      <FieldInput
                        type="number"
                        value={form.amount}
                        onChange={(e) => {
                          if (form.txType === "expense" && form.paymentMode === "split") return;
                          setForm({ ...form, amount: e.target.value });
                        }}
                        readOnly={form.txType === "expense" && form.paymentMode === "split"}
                        placeholder={
                          form.txType === "expense" && form.paymentMode === "split"
                            ? "Auto calculated from split payments"
                            : "e.g., 5000"
                        }
                        className={
                          form.txType === "expense" && form.paymentMode === "split"
                            ? "cursor-not-allowed bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
                            : ""
                        }
                      />
                      {form.txType === "expense" && form.paymentMode === "split" ? (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          This amount is automatically calculated from the member-wise paid amounts above.
                        </p>
                      ) : null}
                    </div>

                    {form.txType === "expense" && (
                      <div className="md:col-span-2 rounded-[1.25rem] border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-500/20 dark:bg-violet-500/10 sm:rounded-[1.5rem] sm:p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-black text-slate-950 dark:text-white">
                              Split Details
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Select how this expense should affect personal remaining.
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                          <div className="sm:col-span-2">
                            <FieldLabel>Split Type</FieldLabel>
                            <FieldSelect
                              value={form.splitType}
                              onChange={(e) => setForm({ ...form, splitType: e.target.value })}
                            >
                              <option value="personal">Personal</option>
                              <option value="equal">Equal</option>
                              <option value="ratio">Ratio</option>
                              <option value="fixed">Fixed Amount</option>
                            </FieldSelect>
                          </div>

                          {form.splitType === "personal" && (
                            <div className="sm:col-span-2">
                              <FieldLabel>Personal For</FieldLabel>
                              <FieldSelect
                                value={form.personalUserId}
                                onChange={(e) =>
                                  setForm({ ...form, personalUserId: e.target.value })
                                }
                              >
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
                                <FieldInput
                                  type="number"
                                  value={form.ratioMe}
                                  onChange={(e) =>
                                    setForm({ ...form, ratioMe: e.target.value })
                                  }
                                />
                              </div>

                              <div>
                                <FieldLabel>{otherMember.name} %</FieldLabel>
                                <FieldInput
                                  type="number"
                                  value={form.ratioOther}
                                  onChange={(e) =>
                                    setForm({ ...form, ratioOther: e.target.value })
                                  }
                                />
                              </div>

                              <div className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
                                Ratio total must be exactly 100.
                              </div>
                            </>
                          )}

                          {form.splitType === "fixed" && otherMember && (
                            <>
                              <div>
                                <FieldLabel>My Amount</FieldLabel>
                                <FieldInput
                                  type="number"
                                  value={form.fixedMe}
                                  onChange={(e) =>
                                    setForm({ ...form, fixedMe: e.target.value })
                                  }
                                  placeholder="e.g., 300"
                                />
                              </div>

                              <div>
                                <FieldLabel>{otherMember.name} Amount</FieldLabel>
                                <FieldInput
                                  type="number"
                                  value={form.fixedOther}
                                  onChange={(e) =>
                                    setForm({ ...form, fixedOther: e.target.value })
                                  }
                                  placeholder="e.g., 200"
                                />
                              </div>

                              <div className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
                                Fixed amounts must be equal to the total expense amount.
                              </div>
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

                    <div className="md:col-span-2">
                      <FieldLabel>Note</FieldLabel>
                      <FieldInput
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder={
                          form.txType === "transfer"
                            ? "e.g., DPS deposit"
                            : "e.g., Electricity bill"
                        }
                      />
                    </div>
                  </div>

                  {msg ? (
                    <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                      {msg}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-slate-100 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:px-6 sm:py-4">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={saveTx}
                    disabled={savingTx}
                    aria-busy={savingTx}
                    className={cn(
                      "order-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition active:translate-y-0 dark:bg-white dark:text-slate-950 sm:order-2 sm:w-auto sm:px-5 sm:text-sm",
                      savingTx
                        ? "cursor-not-allowed opacity-70"
                        : "hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-100"
                    )}
                  >
                    {savingTx && (
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    )}

                    {savingTx ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update" : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="order-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:order-1 sm:w-auto sm:px-5 sm:text-sm"
                  >
                    Cancel
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
