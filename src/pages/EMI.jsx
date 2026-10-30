import HFPageLead from "../components/design/HFPageLead";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthInRange(targetMonth, startMonth, endMonth) {
  if (!targetMonth || !startMonth || !endMonth) return false;
  return targetMonth >= startMonth && targetMonth <= endMonth;
}

function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function monthLabel(value) {
  if (!value) return "Selected Month";
  const [year, month] = String(value).split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v._id || v.id || "");
  return String(v);
}

function ownerFromMemberName(name) {
  const n = String(name || "").trim().toLowerCase();

  if (n.includes("mahbub")) return "Mahbub";
  if (n.includes("mirza")) return "Mirza";

  return "";
}

function safeDate(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function percentage(value, total) {
  const v = Number(value || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.min(100, Math.max(0, Math.round((v / t) * 100)));
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function openNativePicker(e) {
  const input = e.currentTarget.querySelector("input");
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers only allow showPicker on a direct input click.
    }
  }
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200";
  }

  if (s === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200";
  }

  if (s === "active") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200";
  }

  if (s === "closed") {
    return "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
}

function splitLabel(value) {
  const v = String(value || "equal").toLowerCase();
  if (v === "personal") return "Personal";
  if (v === "ratio") return "Ratio";
  if (v === "fixed") return "Fixed";
  return "Equal";
}

function scheduledAmountForMonth(plan, selectedMonth) {
  const schedule = Array.isArray(plan?.scheduleMonths) && plan.scheduleMonths.length === Number(plan?.months)
    ? plan.scheduleMonths : null;
  if (schedule && !schedule.includes(selectedMonth)) return 0;
  if (!schedule && !monthInRange(selectedMonth, plan?.startMonth, plan?.endMonth)) return 0;
  const [startYear, startM] = String(plan.startMonth).split('-').map(Number);
  const [year, m] = String(selectedMonth).split('-').map(Number);
  const index = schedule ? schedule.indexOf(selectedMonth) : (year - startYear) * 12 + m - startM;
  const regular = Number(plan?.monthlyAmount || 0);
  if (index === Number(plan?.months || 0) - 1) {
    return Math.round((Number(plan?.totalPayable || 0) - regular * index) * 100) / 100;
  }
  return regular;
}

function splitMonthlyAmount(plan, members, selectedMonth) {
  const total = scheduledAmountForMonth(plan, selectedMonth);
  const splitType = String(plan?.splitType || "equal").toLowerCase();

  if (!total || !Array.isArray(members) || members.length === 0) return [];

  if (splitType === "personal") {
    const userId = normalizeId(plan?.personalUserId);
    const person = members.find((m) => normalizeId(m.id || m._id) === userId);

    return [
      {
        key: userId || "personal",
        userId,
        name: person?.name || "Personal",
        amount: total,
      },
    ];
  }

  if (splitType === "ratio") {
    const ratios = Array.isArray(plan?.ratios) ? plan.ratios : [];
    const validRatios = ratios
      .map((r) => ({
        userId: normalizeId(r?.userId),
        ratio: Number(r?.ratio || 0),
      }))
      .filter((r) => r.userId && r.ratio > 0);

    const ratioSum = validRatios.reduce((s, r) => s + r.ratio, 0);
    if (!validRatios.length || ratioSum <= 0) return [];

    return validRatios.map((r, index) => {
      const person = members.find((m) => normalizeId(m.id || m._id) === r.userId);
      const raw = (total * r.ratio) / ratioSum;

      return {
        key: `${r.userId}-${index}`,
        userId: r.userId,
        name: person?.name || "Unknown",
        amount: Math.round(raw * 100) / 100,
      };
    });
  }

  if (splitType === "fixed") {
    const fixed = Array.isArray(plan?.fixed) ? plan.fixed : [];
    const validFixed = fixed
      .map((f) => ({
        userId: normalizeId(f?.userId),
        amount: Number(f?.amount || 0),
      }))
      .filter((f) => f.userId && f.amount > 0);

    if (!validFixed.length) return [];

    let allocated = 0;
    const nominal = Number(plan?.monthlyAmount || 0);
    return validFixed.map((f, index) => {
      const person = members.find((m) => normalizeId(m.id || m._id) === f.userId);
      const share = index === validFixed.length - 1
        ? Math.round((total - allocated) * 100) / 100
        : Math.round((total * f.amount / nominal) * 100) / 100;
      allocated += share;
      return {
        key: `${f.userId}-${index}`,
        userId: f.userId,
        name: person?.name || "Unknown",
        amount: share,
      };
    });
  }

  const activeMembers = members.filter(Boolean);
  const base = Math.floor((total / activeMembers.length) * 100) / 100;
  let used = 0;

  return activeMembers.map((m, index) => {
    const userId = normalizeId(m.id || m._id);
    const isLast = index === activeMembers.length - 1;
    const amount = isLast ? Math.round((total - used) * 100) / 100 : base;

    used += base;

    return {
      key: userId || index,
      userId,
      name: m.name || "Member",
      amount,
    };
  });
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
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

  if (name === "refresh") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v6h-6" />
      </svg>
    );
  }

  if (name === "card") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-2" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
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

  if (name === "box") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7 12 12l8.7-5" />
        <path d="M12 22V12" />
      </svg>
    );
  }

  return (
    <svg {...common} viewBox="0 0 24 24">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent = "from-sky-500 to-indigo-600",
  icon = "chart",
  hideOnMobile = false,
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition dark:border-white/10 dark:bg-white/[0.06] sm:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-md",
        hideOnMobile && "hidden sm:block"
      )}
    >
      <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-15`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs">
            {label}
          </div>
          <div className="mt-2 break-words text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </div>
          {helper ? (
            <div className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
              {helper}
            </div>
          ) : null}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-sm sm:h-11 sm:w-11`}>
          <Icon name={icon} className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "", hint }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="block text-[11px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 sm:text-xs">
          {label}
        </label>
        {hint ? <span className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/10 ${extra}`;
}

function ActionButton({ children, onClick, variant = "primary", className = "", disabled = false }) {
  const styles = {
    primary:
      "bg-slate-950 text-white hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
    soft:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/20",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

function LiabilitySection({ items, total }) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:to-emerald-400/10 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">কার কত কিস্তি দিতে হবে</div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400 sm:text-sm">
              এই মাসে কার কত টাকা কিস্তি দিতে হবে।
            </p>
          </div>
          <div className="hidden rounded-2xl bg-emerald-50 px-3 py-2 text-right text-xs font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20 sm:block">
            সর্বমোট ৳ {money(total)}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
            এই মাসে কোনো চলমান কিস্তি নেই।
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const share = percentage(item.amount, total);

              return (
                <div key={item.userId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-black text-slate-950 dark:text-white sm:text-base">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{share}এই মাসের অংশ</div>
                    </div>
                    <div className="shrink-0 text-base font-black text-emerald-700 dark:text-emerald-300 sm:text-xl">
                      ৳ {money(item.amount)}
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100 dark:bg-white/10 dark:ring-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function PlanCard({ plan, month, members, onGenerate, onStatus, onEdit, onResume, onDelete }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const progress = Math.min(100, Math.max(0, Number(plan?.stats?.progress || 0)));
  const canCreateBill = plan.status === "active" && scheduledAmountForMonth(plan,month)>0;
  const splitItems = splitMonthlyAmount(plan, members, month);
  const amount = monthInRange(month,plan.startMonth,plan.endMonth) ? scheduledAmountForMonth(plan,month) : plan.monthlyAmount;
  return <article className="hf-v2-emi-row">
    <div className="hf-v2-emi-row-main">
      <div className="hf-v2-emi-product"><strong>{plan.productName}</strong><span>{[plan.brand,plan.category].filter(Boolean).join(' · ')}</span></div>
      <div className="hf-v2-emi-amount"><small>মাসিক কিস্তি</small><strong>৳ {money(amount)}</strong></div>
      <div className="hf-v2-emi-progress"><small>পরিশোধের অগ্রগতি</small><strong>{progress.toLocaleString('bn-BD')}%</strong><div className="hf-v2-progress"><i style={{width:`${progress}%`}}/></div></div>
      <div className="hf-v2-emi-row-actions">
        {canCreateBill && <button type="button" onClick={()=>onGenerate(plan._id,plan.productName)} className="hf-v2-btn hf-v2-btn--main">বিল তৈরি</button>}
        <button type="button" className="hf-v2-btn hf-v2-btn--soft" onClick={()=>onEdit(plan)}>সম্পাদনা</button>
        <button type="button" className="hf-v2-btn hf-v2-btn--soft" onClick={()=>plan.status==='active'?onStatus(plan._id,'paused'):onResume(plan)}>{plan.status==='active'?'বিরতি দিন':'আবার চালু করুন'}</button>
        <button type="button" className="hf-v2-btn hf-v2-btn--danger" onClick={()=>onDelete(plan)}>মুছুন</button>
        <button type="button" className="hf-v2-btn hf-v2-btn--soft" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(v=>!v)}>{detailsOpen?'বন্ধ করুন':'বিস্তারিত'}</button>
      </div>
    </div>
    {Number(plan?.stats?.behindBy||0)>0 && <p className="hf-v2-inline-warning">রেকর্ড অনুযায়ী বকেয়া: ৳ {money(plan.stats.behindBy)}</p>}
    {detailsOpen && <div className="hf-v2-emi-row-extra">
      <div><span>মোট পরিশোধযোগ্য</span><strong>৳ {money(plan.totalPayable)}</strong></div>
      <div><span>বাকি আছে</span><strong>৳ {money(plan?.stats?.remaining||0)}</strong></div>
      <div><span>সময়</span><strong>{plan.startMonth} – {plan.endMonth}</strong></div>
      <div className="hf-v2-emi-members"><span>এই মাসে কার কত ভাগ</span>{splitItems.map(it=><div key={it.key}><b>{it.name}</b><strong>৳ {money(it.amount)}</strong></div>)}</div>
    </div>}
  </article>;
}

export default function EMI() {
  const [hfMore, setHfMore] = useState(false);
  const [emiTab,setEmiTab]=useState('plans');
  const [editingPlanId,setEditingPlanId]=useState('');
  const [resumePlan,setResumePlan]=useState(null);
  const [deletePlan,setDeletePlan]=useState(null);
  const [resumeMode,setResumeMode]=useState('from-now');
  const [resumeMonth,setResumeMonth]=useState(monthNow());
  const me = getUser();
  const myId = normalizeId(me?.id);
  const [month, setMonth] = useState(monthNow());
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const [members, setMembers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [dueSummary, setDueSummary] = useState(null);
  const [integrityReport, setIntegrityReport] = useState(null);
  const [integrityUnavailable, setIntegrityUnavailable] = useState(false);

  const monthOptions = [1, 3, 6, 9, 12, 18, 24, 36];

  const productCategoryOptions = [
    "Electronics",
    "Mobile / Smartphone",
    "Laptop / Computer",
    "PC Accessories",
    "Furniture",
    "Home Appliance",
    "Kitchen Appliance",
    "Vehicle / Bike",
    "Education Device",
    "Medical Device",
    "Fashion / Personal",
    "Others",
  ];

  const [form, setForm] = useState({
    productName: "",
    brand: "",
    category: "",
    purchaseDate: today(),
    originalPrice: "",
    emiCharge: 0,
    totalPayable: "",
    months: 6,
    startMonth: monthNow(),
    splitType: "equal",
    personalUserId: "",
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
    note: "",
  });

  const [emiExpenseCategoryId, setEmiExpenseCategoryId] = useState("");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [payForm, setPayForm] = useState({
    paymentMode: "single",
    paidByUserId: myId || "",
    fromAccountId: "",
    paidDate: today(),
    paymentParts: [],
  });
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteInstallmentId, setDeleteInstallmentId] = useState("");

  const otherMember = useMemo(
    () => members.find((m) => normalizeId(m.id || m._id) !== myId) || null,
    [members, myId]
  );

  const selectedPayerOwner = useMemo(() => {
    const payer = members.find(
      (m) => normalizeId(m.id || m._id) === normalizeId(payForm.paidByUserId)
    );

    return ownerFromMemberName(payer?.name);
  }, [members, payForm.paidByUserId]);

  const payableAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const type = String(account.type || "").trim().toLowerCase();
      const owner = String(account.owner || "").trim();
      const name = String(account.name || "").trim().toLowerCase();

      const isNormalPaymentAccount = ["cash", "bank", "wallet"].includes(type);

      const isSavingAccount =
        type === "savings" ||
        type === "saving" ||
        name.includes("saving");

      const belongsToSelectedPayer =
        owner === selectedPayerOwner ||
        owner === "Joint";

      return (
        account.isActive !== false &&
        isNormalPaymentAccount &&
        !isSavingAccount &&
        belongsToSelectedPayer
      );
    });
  }, [accounts, selectedPayerOwner]);

  const eligibleAccountsFor = (memberId) => {
    const payer = members.find((m) => normalizeId(m.id || m._id) === normalizeId(memberId));
    const selectedOwner = ownerFromMemberName(payer?.name);
    return accounts.filter((account) => {
      const type = String(account.type || "").toLowerCase();
      const owner = String(account.owner || "").trim();
      const name = String(account.name || "").toLowerCase();
      return account.isActive !== false && ["cash", "bank", "wallet"].includes(type)
        && !name.includes("saving") && (owner === "Joint" || (selectedOwner && owner === selectedOwner));
    });
  };

  const splitPaidCents = (payForm.paymentParts || []).reduce(
    (sum, part) => sum + Math.round(Number(part.amount || 0) * 100), 0
  );
  const installmentCents = Math.round(Number(selectedInstallment?.amount || 0) * 100);

  useEffect(() => {
    if (!payModalOpen || payForm.paymentMode !== "single") return;
    const exists = payableAccounts.some((account) => normalizeId(account._id) === normalizeId(payForm.fromAccountId));
    if (!exists) setPayForm((prev) => ({ ...prev, fromAccountId: payableAccounts[0]?._id || "" }));
  }, [payModalOpen, payForm.paymentMode, payForm.fromAccountId, payableAccounts]);


  function calcTotalPayable(originalPrice, emiChargePercent) {
    const op = toNum(originalPrice);
    const pct = toNum(emiChargePercent);
    const t = op + (op * pct) / 100;
    return Math.round(t * 100) / 100;
  }

  async function loadBasics() {
    const [mRes, accRes, exp] = await Promise.all([
      api.get("/api/family/members"),
      api.get("/api/accounts"),
      api.get("/api/categories", { params: { kind: "expense" } }),
    ]);

    const memberItems = mRes.data.members || [];
    setMembers(memberItems);

    if (memberItems.length > 0) {
      const defaultPersonalId = myId || memberItems[0]?.id || "";
      setForm((prev) => ({
        ...prev,
        personalUserId: prev.personalUserId || defaultPersonalId,
      }));
    }

    setAccounts((accRes.data.items || []).filter((a) => a.isActive !== false));

    const items = exp.data.items || [];
    setExpenseCats(items);

    const found = items.find(
      (c) => String(c?.name || "").trim().toLowerCase() === "emi"
    );
    if (found) setEmiExpenseCategoryId(found._id);
  }

  async function loadPlans() {
    const res = await api.get("/api/emi/plans");
    setPlans(res.data.plans || []);
  }

  async function loadInstallments() {
    // This GET is advisory only. It never creates, edits or repairs finance records.
    api.get("/api/emi/integrity", { params: { month } })
      .then((result) => {
        setIntegrityReport(result.data.report || null);
        setIntegrityUnavailable(false);
      })
      .catch(() => { setIntegrityReport(null); setIntegrityUnavailable(true); });
    const res = await api.get("/api/emi/installments", { params: { month } });
    setInstallments(res.data.items || []);
    try {
      const due = await api.get("/api/emi/due-summary", { params: { month } });
      setDueSummary(due.data.summary || null);
    } catch (error) {
      setDueSummary(null);
      if (error?.response?.status === 404) {
        setMsg("EMI due reporting requires the Phase 2A backend update. Restart or redeploy the server.");
      }
    }
  }

  useEffect(() => {
    loadBasics();
    loadPlans();
    loadInstallments();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadInstallments();
    // eslint-disable-next-line
  }, [month]);

  useEffect(() => {
    const computed = calcTotalPayable(form.originalPrice, form.emiCharge);
    if (String(form.totalPayable || "") !== String(computed)) {
      setForm((prev) => ({ ...prev, totalPayable: String(computed) }));
    }
    // eslint-disable-next-line
  }, [form.originalPrice, form.emiCharge]);

  function openModal() {
    setEditingPlanId('');
    setMsg("");
    setForm((f) => ({
      ...f,
      productName: "",
      brand: "",
      category: "",
      purchaseDate: today(),
      originalPrice: "",
      emiCharge: 0,
      totalPayable: "",
      months: 6,
      startMonth: month,
      splitType: "equal",
      personalUserId: myId || members[0]?.id || "",
      ratioMe: 50,
      ratioOther: 50,
      fixedMe: "",
      fixedOther: "",
      note: "",
    }));
    setOpen(true);
  }

  function editPlan(plan) {
    setEditingPlanId(plan._id);
    setMsg('');
    setForm(f=>({...f,productName:plan.productName||'',brand:plan.brand||'',category:plan.category||'',purchaseDate:String(plan.purchaseDate||'').slice(0,10),originalPrice:String(plan.originalPrice||''),emiCharge:String(plan.emiCharge??0),totalPayable:String(plan.totalPayable||''),months:plan.months,startMonth:plan.startMonth,splitType:plan.splitType||'equal',personalUserId:normalizeId(plan.personalUserId)||myId,ratioMe:Number(plan.ratios?.[0]?.ratio??50),ratioOther:Number(plan.ratios?.[1]?.ratio??50),fixedMe:Number(plan.fixed?.[0]?.amount??0),fixedOther:Number(plan.fixed?.[1]?.amount??0),note:plan.note||''}));
    setOpen(true);
  }
  async function resumeExistingPlan() {
    if(!resumePlan)return;
    try {
      await api.post(`/api/emi/plans/${resumePlan._id}/resume`,{resumeMonth,mode:resumeMode});
      setResumePlan(null);await loadPlans();await loadInstallments();
      setMsg('কিস্তি আবার চালু হয়েছে; আগের পরিশোধিত তথ্য অপরিবর্তিত রয়েছে।');
    } catch(e){setMsg(e?.response?.data?.message||'কিস্তি চালু করা যায়নি।');}
  }

  async function confirmDeletePlan() {
    if (!deletePlan) return;
    try {
      await api.delete(`/api/emi/plans/${deletePlan._id}`);
      setMsg('কিস্তির পরিকল্পনা মুছে ফেলা হয়েছে।');
      setDeletePlan(null);
      await Promise.all([loadPlans(), loadInstallments()]);
    } catch (e) {
      setMsg(e?.response?.data?.message || 'পরিকল্পনা মুছতে পারিনি।');
      setDeletePlan(null);
    }
  }

  function closeModal() {
    setOpen(false);
    setMsg("");
  }

  async function createPlan() {
    setMsg("");
    try {
      if (!form.productName) return setMsg("Product name required");
      if (!form.originalPrice || Number(form.originalPrice) <= 0) {
        return setMsg("Original price required");
      }
      if (Number(form.emiCharge) < 0) {
        return setMsg("EMI charge (%) cannot be negative");
      }
      if (!form.months || Number(form.months) <= 0) {
        return setMsg("Months required");
      }
      if (!form.startMonth) return setMsg("Start month required");

      if (form.splitType === "personal" && !form.personalUserId) {
        return setMsg("Please select who this personal EMI belongs to");
      }

      let payload = {
        ...form,
        originalPrice: Number(form.originalPrice),
        emiCharge: Number(form.emiCharge || 0),
        months: Number(form.months),
      };

      if (form.splitType === "personal") {
        payload.personalUserId = form.personalUserId;
      }

      if (form.splitType === "ratio" && otherMember) {
        payload.ratios = [
          { userId: myId, ratio: Number(form.ratioMe) },
          { userId: otherMember.id, ratio: Number(form.ratioOther) },
        ];
      }

      if (form.splitType === "fixed" && otherMember) {
        payload.fixed = [
          { userId: myId, amount: Number(form.fixedMe || 0) },
          { userId: otherMember.id, amount: Number(form.fixedOther || 0) },
        ];
      }

      if(editingPlanId) {
        const original=plans.find(p=>p._id===editingPlanId);
        // Existing generated history is immutable: only change metadata.
        const billHistory=Number(original?.stats?.paidCount||0)>0 || original?.scheduleMonths?.length>0;
        const update= billHistory ? {productName:payload.productName,brand:payload.brand,category:payload.category,note:payload.note} : payload;
        await api.put(`/api/emi/plans/${editingPlanId}`,update);
      } else await api.post("/api/emi/plans", payload);
      closeModal();
      await loadPlans();
      await loadInstallments();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Create plan failed");
    }
  }

  const monthlyPersonTotals = useMemo(() => {
    const map = new Map();

    members.forEach((m) => {
      const id = normalizeId(m.id || m._id);
      map.set(id, {
        userId: id,
        name: m.name || "Member",
        amount: 0,
      });
    });

    plans.forEach((plan) => {
      // "To pay" means an active obligation, not an archived/closed plan.
      // Historical *payments* remain visible through installments and Ledger;
      // a closed plan with missing payment evidence is flagged by EMI Integrity.
      if (String(plan?.status || "active").toLowerCase() !== "active") return;
      const inThisMonth = monthInRange(month, plan?.startMonth, plan?.endMonth);
      if (!inThisMonth) return;

      const parts = splitMonthlyAmount(plan, members, month);

      parts.forEach((part) => {
        const partUserId = normalizeId(part.userId || part.key);
        if (!partUserId) return;

        const existing = map.get(partUserId) || {
          userId: partUserId,
          name: part.name || "Member",
          amount: 0,
        };

        existing.amount =
          Math.round((existing.amount + Number(part.amount || 0)) * 100) / 100;

        if (!existing.name && part.name) existing.name = part.name;

        map.set(partUserId, existing);
      });
    });

    return Array.from(map.values())
      .filter((x) => Number(x.amount || 0) > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [plans, members, month]);

  const monthlyCombinedTotal = useMemo(() => {
    const total = monthlyPersonTotals.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return Math.round(total * 100) / 100;
  }, [monthlyPersonTotals]);

  const activePlansThisMonth = useMemo(
    () =>
      plans.filter(
        (p) => String(p?.status || "") === "active" && scheduledAmountForMonth(p, month) > 0
      ),
    [plans, month]
  );

  const installmentStats = useMemo(() => {
    const total = installments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const paid = installments
      .filter((i) => String(i.status || "").toLowerCase() === "paid")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const pending = Math.max(0, total - paid);
    const pendingCount = installments.filter(
      (i) => String(i.status || "").toLowerCase() !== "paid"
    ).length;
    const paidCount = installments.filter(
      (i) => String(i.status || "").toLowerCase() === "paid"
    ).length;

    return {
      total: Math.round(total * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      pendingCount,
      paidCount,
      progress: total ? Math.round((paid / total) * 100) : 0,
    };
  }, [installments]);

  const nextDueInstallment = useMemo(() => {
    const pending = installments
      .filter((i) => String(i.status || "").toLowerCase() !== "paid")
      .sort((a, b) => new Date(a?.dueDate || 0) - new Date(b?.dueDate || 0));

    return pending[0] || null;
  }, [installments]);

  async function generateMonth() {
    setMsg("");
    try {
      const payload = emiExpenseCategoryId
        ? { month, expenseCategoryId: emiExpenseCategoryId }
        : { month };

      const res = await api.post("/api/emi/generate", payload);
      const catName = res.data?.usedCategory?.name;

      setMsg(
        `Created ${res.data.createdCount} EMI bill(s) for ${monthLabel(month)}` +
        (catName ? ` (Category: ${catName})` : "")
      );

      await loadInstallments();
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || "Generate failed");
    }
  }

  async function generateSinglePlan(planId, productName) {
    setMsg("");
    try {
      const payload = emiExpenseCategoryId
        ? { month, expenseCategoryId: emiExpenseCategoryId }
        : { month };

      const res = await api.post(`/api/emi/plans/${planId}/generate`, payload);
      const createdCount = Number(res.data?.createdCount || 0);
      const catName = res.data?.usedCategory?.name;

      setMsg(
        createdCount > 0
          ? `Created EMI bill for ${productName} in ${monthLabel(month)}` +
          (catName ? ` (Category: ${catName})` : "")
          : `EMI bill already exists for ${productName} in ${monthLabel(month)}`
      );

      await loadInstallments();
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || "Generate failed");
    }
  }

  async function setStatus(planId, status) {
    try {
      await api.put(`/api/emi/plans/${planId}/status`, { status });
      await loadPlans();
      await loadInstallments();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Status update failed");
    }
  }

function openPayModalForInstallment(item) {
  const activeMembers = members.filter((member) => normalizeId(member.id || member._id));
  const totalCents = Math.round(Number(item?.amount || 0) * 100);
  const firstCents = Math.floor(totalCents / Math.max(1, activeMembers.length));
  const parts = activeMembers.map((member, index) => {
    const userId = normalizeId(member.id || member._id);
    const amountCents = index === activeMembers.length - 1
      ? totalCents - firstCents * (activeMembers.length - 1) : firstCents;
    return { userId, accountId: "", amount: (amountCents / 100).toFixed(2) };
  });
  setSelectedInstallment(item);
  setPayError("");
  setPayForm({
    paymentMode: "single",
    paidByUserId: myId || normalizeId(activeMembers[0]?.id || activeMembers[0]?._id),
    fromAccountId: "",
    // Payment date must be today, not the installment's scheduled due date.
    paidDate: today(),
    paymentParts: parts,
  });
  setPayModalOpen(true);
}

  function closePayModal() {
    if (paySubmitting) return;
    setPayModalOpen(false);
    setSelectedInstallment(null);
  }

  function updateEmiSplitPart(index, patch) {
    setPayForm((prev) => ({
      ...prev,
      paymentParts: prev.paymentParts.map((part, i) => i === index ? { ...part, ...patch } : part),
    }));
  }

  async function confirmMarkPaid() {
    if (!selectedInstallment?._id || paySubmitting) return;
    const splitMode = payForm.paymentMode === "split";
    const parts = payForm.paymentParts || [];
    if (!payForm.paidDate) return setPayError("পরিশোধের তারিখ দিন।");
    if (splitMode) {
      if (parts.length < 2) return setPayError("ভাগ করে পরিশোধের জন্য অন্তত দুজন সদস্য প্রয়োজন।");
      if (parts.some((p) => !p.userId || !p.accountId || !Number.isFinite(Number(p.amount)) || Number(p.amount) <= 0))
        return setPayError("প্রত্যেকের টাকার পরিমাণ ও অ্যাকাউন্ট বেছে নিন।");
      if (splitPaidCents !== installmentCents)
        return setPayError("দুজনের দেওয়া টাকার যোগফল সম্পূর্ণ কিস্তির সমান হতে হবে।");
    } else {
      if (!payForm.paidByUserId) return setPayError("কে টাকা দিচ্ছেন, বেছে নিন।");
      if (!payForm.fromAccountId) return setPayError("কোন অ্যাকাউন্ট থেকে দিচ্ছেন, বেছে নিন।");
    }
    setPaySubmitting(true);
    setPayError("");
    setMsg("");
    try {
      await api.put(`/api/emi/installments/${selectedInstallment._id}/status`, {
        status: "paid",
        paymentMode: splitMode ? "split" : "single",
        paidByUserId: splitMode ? null : payForm.paidByUserId,
        fromAccountId: splitMode ? null : payForm.fromAccountId,
        paymentParts: splitMode ? parts.map((p) => ({
          userId: p.userId, accountId: p.accountId, amount: Number(p.amount),
        })) : undefined,
        paidDate: payForm.paidDate,
      });
      setPayModalOpen(false);
      setSelectedInstallment(null);
      await Promise.all([loadInstallments(), loadPlans()]);
      setMsg("কিস্তি পরিশোধ হয়েছে। নির্বাচিত অ্যাকাউন্ট থেকে টাকা কাটা হয়েছে।");
    } catch (e) {
      setPayError(e?.response?.data?.message || "পরিশোধ সংরক্ষণ করা যায়নি।");
    } finally {
      setPaySubmitting(false);
    }
  }

  async function setInstallmentStatus(id, status) {
    try {
      await api.put(`/api/emi/installments/${id}/status`, { status });
      await loadInstallments();
      await loadPlans();
      setMsg("EMI moved back to pending and the payment transaction was removed");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Update failed");
    }
  }

  function deleteInstallment(id) {
    setDeleteInstallmentId(id);
    setConfirmOpen(true);
  }

  async function handleConfirmDeleteInstallment() {
    if (!deleteInstallmentId) return;

    try {
      await api.delete(`/api/emi/installments/${deleteInstallmentId}`);
      await loadInstallments();
      await loadPlans();
      setMsg("Installment deleted successfully");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setDeleteInstallmentId("");
    }
  }

  return (
    <AppLayout>
      <div className={`hf-step3-page hf-step3-emi hf-v2-page hf-v2-emi hn-emi-view-${emiTab} ${hfMore ? "hf-step3-expanded" : ""}`}>
        <HFPageLead title="কিস্তি" description="কত টাকা দেওয়ার কথা এবং কোন কিস্তি পরিশোধ হয়েছে" month={month} onMonthChange={setMonth}
          metrics={[
 {label:'এই মাসে দেওয়ার কথা',value:monthlyCombinedTotal,primary:true},
 {label:'চলমান কিস্তির পরিকল্পনা',value:activePlansThisMonth.length,kind:'count'}
]}
          onAdd={openModal} addLabel="নতুন কিস্তি"
          addDisabled={false}
          onExtra={undefined} extraLabel=""
          onRefresh={undefined}
          more={hfMore} onToggleMore={() => setHfMore(v => !v)} />

      <nav className="hn-emi-tabs" aria-label="কিস্তি পেজের বিভাগ">
        {[['plans','চলমান পরিকল্পনা'],['bills','মাসের বিল ও পরিশোধ'],['archived','বিরতি ও বন্ধ পরিকল্পনা']].map(([value,label])=><button type="button" key={value} aria-current={emiTab===value?'page':undefined} className={emiTab===value?'active':''} onClick={()=>setEmiTab(value)}>{label}</button>)}
      </nav>
      <main className="emi-page min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 px-2 py-3 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="mx-auto w-full space-y-4 sm:space-y-5">
          <></>

          <></>

          {dueSummary?.excludedClosedPlans?.length > 0 && (
            <section className="hf-step3-advanced rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-100">
              <div className="text-xs font-black uppercase tracking-wide">বন্ধ কিস্তির পরিকল্পনা চলতি মাসে ধরা হয়নি</div>
              <div className="mt-1 text-sm font-semibold">
                ৳ {money(dueSummary.excludedClosedThisMonth)} বন্ধ পরিকল্পনার টাকা চলতি মাসের বকেয়ায় যোগ হয়নি।
              </div>
              <p className="mt-1 text-xs">
                Closing a plan does not erase historical paid installments. A closed plan with unrecorded payments or an outstanding balance still needs reconciliation; review EMI Record Integrity before trusting historical dues.
              </p>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer font-bold">বন্ধ পরিকল্পনা দেখুন</summary>
                <div className="mt-2 space-y-1">
                  {dueSummary.excludedClosedPlans.map((item) => (
                    <div key={item.planId} className="flex items-center justify-between gap-3">
                      <span>{item.productName}</span>
                      <b>৳ {money(item.scheduledThisMonth)} নির্ধারিত; ৳ {money(item.unverifiedUnpaidThrough)} টাকা দেওয়ার তথ্য নেই</b>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}

          {dueSummary && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide">এই মাস পর্যন্ত বাকি কিস্তি {monthLabel(month)}</div>
                  <div className="mt-1 text-xl font-black">বাকি: ৳ {money(dueSummary.unpaidThrough)}</div>
                  <div className="mt-1 text-xs font-medium">এর মধ্যে ৳ {money(dueSummary.overdue)} comes from earlier months. Includes bills not generated yet; pending payments are not cash expenses.</div>
                </div>
                <div className="text-right text-xs font-semibold">{dueSummary.unpaidCount} টি কিস্তি বাকি<div className="mt-1">এই মাসের কিস্তি: ৳ {money(dueSummary.dueThisMonth)}</div></div>
              </div>
              {dueSummary.entries?.length > 0 && (
                <details className="mt-3 rounded-xl border border-amber-200/70 bg-white/65 p-3 text-xs dark:border-white/10 dark:bg-slate-900/40">
                  <summary className="cursor-pointer font-black">কোন মাসের বিল বাকি দেখুন</summary>
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {dueSummary.entries.map((item) => (
                      <div key={`${item.planId}-${item.month}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/50 py-1 dark:border-white/10">
                        <span>{item.productName} · {item.month}{item.generated ? '' : ' · Bill not generated'}</span>
                        <b>৳ {money(item.amount)}</b>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}

          {integrityReport && (
            <section className={`hf-step3-advanced rounded-2xl border p-4 ${integrityReport.issueCount ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100" : "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide">কিস্তির আগের হিসাব যাচাই (শুধু দেখার জন্য)</div>
                  <p className="mt-1 text-xs">আগের রেকর্ড যাচাই: {integrityReport.checked?.plans || 0} টি পরিকল্পনা ও {integrityReport.checked?.installments || 0} টি বিল। কোনো তথ্য বদলাবে না।</p>
                </div>
                <span className="rounded-full border border-current/20 px-3 py-1 text-sm font-black">{integrityReport.issueCount} টি সমস্যা</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-2"><div className="text-xl font-black">{integrityReport.severitySummary?.critical || 0}</div><div className="text-[11px] font-bold">জরুরি যাচাই</div></div>
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-2"><div className="text-xl font-black">{integrityReport.severitySummary?.warning || 0}</div><div className="text-[11px] font-bold">যাচাই করুন</div></div>
                <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-2"><div className="text-xl font-black">{integrityReport.severitySummary?.info || 0}</div><div className="text-[11px] font-bold">শুধু অবস্থা</div></div>
              </div>
              <p className="mt-3 text-xs font-medium">Important: finding count is not a count of unpaid EMI payments. One installment may have several missing links. Closing a plan does not prove payment, and missing app history does not prove debt. Compare old bank/card statements before making any changes.</p>
              <details className="mt-3 rounded-xl border border-current/15 bg-white/40 p-3 dark:bg-slate-900/40" open>
                <summary className="cursor-pointer text-xs font-black">পরিকল্পনা অনুযায়ী পরিশোধের তথ্য ({integrityReport.planSummaries?.length || 0})</summary>
                <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {(integrityReport.planSummaries || []).map((plan) => (
                    <div key={plan.planId} className="rounded-xl border border-current/15 bg-white/70 p-3 dark:bg-slate-900/50">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0"><div className="text-sm font-black">{plan.productName}</div><div className="mt-0.5 text-[11px] font-semibold">{plan.status === "closed" ? "Closed/archived" : "Active"} · {plan.generatedCount} তৈরি · {plan.recordedPaidCount} পরিশোধ দেখানো</div></div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-black ${plan.critical ? "bg-rose-500/15 text-rose-600 dark:text-rose-300" : plan.warning ? "bg-amber-500/15 text-amber-700 dark:text-amber-200" : "bg-sky-500/15 text-sky-700 dark:text-sky-200"}`}>{plan.issueCount ? `${plan.issueCount} finding(s)` : "No findings"}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>মোট কিস্তির টাকা <b className="block">৳ {money(plan.scheduledTotal)}</b></div>
                        <div>পরিশোধিত কিস্তি <b className="block">৳ {money(plan.recordedPaidAmount)}</b></div>
                        <div>অ্যাপে পাওয়া প্রকৃত পরিশোধ <b className="block">৳ {money(plan.verifiedLinkedAmount)}</b></div>
                        <div>অ্যাপে পরিশোধ লেখা নেই <b className="block">৳ {money(plan.unresolvedScheduledBalance)}</b></div>
                      </div>
                      <p className="mt-2 text-[11px] opacity-80">“Not marked paid” and “linked cash verified” describe app records only—not an external bank/card statement.</p>
                      {plan.issueCount > 0 && (
                        <details className="mt-2 border-t border-current/10 pt-2 text-xs">
                          <summary className="cursor-pointer font-bold">সমস্যা ও করণীয় দেখুন</summary>
                          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                            {(integrityReport.issues || []).filter((issue) => issue.planId === plan.planId).map((issue, index) => (
                              <div key={`${issue.code}-${issue.ref}-${index}`} className="rounded-lg border border-current/10 p-2">
                                <div className="font-black">{issue.label} · {issue.severity}</div>
                                <div className="mt-1">{issue.detail}</div>
                                <div className="mt-1 font-semibold">এরপর: {issue.suggestedAction}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </details>
              <details className="mt-2 rounded-xl border border-current/15 bg-white/40 p-3 text-xs dark:bg-slate-900/40">
                <summary className="cursor-pointer font-black">সব সমস্যা, মেলেনি এমন লেনদেনসহ ({integrityReport.issueCount})</summary>
                <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                  {(integrityReport.issues || []).map((issue, index) => (
                    <div key={`${issue.code}-${issue.ref}-${index}`} className="rounded-lg border border-current/10 p-2">
                      <div className="font-bold">{issue.label} · {issue.severity}</div>
                      <p>{issue.detail}</p><p className="mt-1 font-semibold">{issue.suggestedAction}</p>
                    </div>
                  ))}
                  {integrityReport.truncated && <div>আরও সমস্যা থাকতে পারে; সংশোধনের আগে পূর্ণ রিপোর্ট দেখুন।</div>}
                </div>
              </details>
              <div className="mt-3 rounded-xl border border-sky-400/25 bg-sky-500/10 p-3 text-xs font-medium">
                <b>ক্রেডিট কার্ড সতর্কতা:</b> This project currently stores all payment accounts as cash, bank, wallet, savings or investment. Credit-card limits and card debt are not separate account types. Any account named “Credit Card” that is classified as bank may distort available cash. This scan flags EMI payments from such accounts but does not alter balances.
              </div>
            </section>
          )}
          {integrityUnavailable && (
            <p className="text-xs text-amber-600 dark:text-amber-300">EMI integrity check unavailable. Confirm the Phase 2B backend is running; older records have not been verified.</p>
          )}

          {msg && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 shadow-sm break-words dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
              {msg}
            </div>
          )}

          <LiabilitySection items={monthlyPersonTotals} total={monthlyCombinedTotal} />

          <section className="hn-emi-bills-section overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-sky-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:to-sky-400/10 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">এই মাসের কিস্তির বিল</div>
                <p className="mt-1 hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
                  চলমান কিস্তির বিল তৈরি করুন: {monthLabel(month)}. শুধু টাকা পরিশোধের পর ব্যাংক থেকে কাটা হবে।
                </p>
                <p className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  খরচের ধরন: <b>{emiExpenseCategoryId ? "EMI" : "নির্বাচিত নয়"}</b>
                </p>
              </div>

              <ActionButton onClick={generateMonth} variant="primary" className="w-full rounded-2xl sm:w-auto">
                <Icon name="refresh" className="h-4 w-4" />
                এই মাসের বিল তৈরি করুন
              </ActionButton>
            </div>

            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  তৈরি হওয়া বিল
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{installments.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:col-span-2 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  পরিশোধের অগ্রগতি
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{installmentStats.progress}%</div>
                  <div className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                    দেওয়া হয়েছে ৳ {money(installmentStats.paid)} / ৳ {money(installmentStats.total)}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    style={{ width: `${installmentStats.progress}%` }}
                  />
                </div>
              </div>
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40 sm:block sm:col-span-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  পরবর্তী বিল
                </div>
                <div className="mt-2 text-base font-black text-slate-950 break-words dark:text-white">
                  {nextDueInstallment?.planId?.productName || "কোনো বিল বাকি নেই"}
                </div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {nextDueInstallment ? safeDate(nextDueInstallment.dueDate) : "সব পরিশোধ হয়েছে"}
                </div>
              </div>
            </div>
          </section>

          <section className="hn-emi-plans-section overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-white via-indigo-50 to-sky-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:via-indigo-400/10 dark:to-sky-400/10 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div>
                <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">চলমান কিস্তি</div>
                <p className="mt-1 hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
                  পণ্য অনুযায়ী কিস্তি ও পরিশোধ দেখুন।
                </p>
              </div>
              <div className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                {plans.length} টি পরিকল্পনা
              </div>
            </div>

            {plans.length === 0 ? (
              <div className="p-4 sm:p-6">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40 sm:p-8">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon name="card" className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-base font-black text-slate-900 dark:text-white">এখনও কোনো কিস্তি যোগ হয়নি</div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    মাসিক কিস্তির হিসাবের জন্য প্রথম পরিকল্পনা যোগ করুন।
                  </p>
                  <ActionButton onClick={openModal} variant="primary" className="mt-4">
                    <Icon name="plus" className="h-4 w-4" />
                    নতুন কিস্তি
                  </ActionButton>
                </div>
              </div>
            ) : (
              <div className="hf-v2-emi-list">
                {plans.filter((p) => emiTab === 'archived' ? p.status !== 'active' || Number(p?.stats?.progress ?? 0)>=100 : p.status==='active' && Number(p?.stats?.progress??0)<100).map((p) => (
                  <PlanCard
                    key={p._id}
                    plan={p}
                    month={month}
                    members={members}
                    onGenerate={generateSinglePlan}
                    onStatus={setStatus}
                    onEdit={editPlan}
                    onDelete={setDeletePlan}
                    onResume={p=>{setResumePlan(p);setResumeMode('from-now');setResumeMonth(monthNow());}}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="hn-emi-installments-section overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-white to-amber-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:to-amber-400/10 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div>
                <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">কিস্তিগুলো ({monthLabel(month)})</div>
                <p className="mt-1 hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
                  কিস্তি পরিশোধ করলে নির্ধারিত অ্যাকাউন্ট থেকে টাকা কাটা হবে।
                </p>
              </div>
              <div className="w-fit rounded-full border border-amber-100 bg-white px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                মোট তৈরি: {installments.length}
              </div>
            </div>

            {installments.length === 0 ? (
              <div className="p-4 sm:p-6">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400 sm:p-8">
                  এই মাসের বিল তৈরি হয়নি। চাপুন: <b>এই মাসের বিল তৈরি করুন</b> আগে।
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {installments.map((i) => {
                  const paid = String(i.status || "").toLowerCase() === "paid";

                  return (
                    <div key={i._id} className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="break-words text-sm font-black text-slate-950 dark:text-white sm:text-base">
                          {i?.planId?.productName || "-"}
                        </div>
                        <div className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                          যার জন্য কিস্তি তৈরি হয়েছে {monthLabel(month)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:contents">
                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-slate-950/40 dark:ring-white/10 lg:bg-transparent lg:p-0 lg:ring-0">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">টাকা</div>
                          <div className="mt-1 text-base font-black text-slate-950 dark:text-white sm:text-lg">৳ {money(i.amount)}</div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-slate-950/40 dark:ring-white/10 lg:bg-transparent lg:p-0 lg:ring-0">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">নির্ধারিত তারিখ</div>
                          <div className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200 sm:text-base">{safeDate(i.dueDate)}</div>
                        </div>
                      </div>

                      <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(i.status)}`}>
                          {i.status || "-"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
                        {paid ? (
                          <ActionButton onClick={() => setInstallmentStatus(i._id, "pending")} variant="soft" className="w-full px-3">
                            বাকি
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => openPayModalForInstallment(i)} variant="success" className="w-full px-3">
                            পরিশোধ করুন
                          </ActionButton>
                        )}

                        {!paid && (
                          <ActionButton onClick={() => deleteInstallment(i._id)} variant="danger" className="w-full px-3">
                            মুছুন
                          </ActionButton>
                        )}
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
          title="কিস্তির বিল মুছবেন?"
          message="পরিশোধ হয়নি এমন বিলটি মুছবেন? পরিশোধিত বিল আগে কিস্তি অংশ থেকে বাতিল করতে হবে।"
          onCancel={() => {
            setConfirmOpen(false);
            setDeleteInstallmentId("");
          }}
          onConfirm={handleConfirmDeleteInstallment}
        />

        {payModalOpen && (
          <div className="hn-finance-modal-overlay fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="hn-finance-modal-panel max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white sm:max-w-xl sm:rounded-3xl">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
                <div className="text-xl font-black">কিস্তি পরিশোধ করুন</div>
                <p className="mt-1 text-sm text-emerald-50">
                  {selectedInstallment?.planId?.productName || "This installment"} টাকা দিলে নির্ধারিত অ্যাকাউন্ট থেকে কমবে।
                </p>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/5" role="group" aria-label="পরিশোধের ধরন">
                    <button type="button" aria-pressed={payForm.paymentMode === "single"}
                      onClick={() => setPayForm((p) => ({ ...p, paymentMode: "single" }))}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold ${payForm.paymentMode === "single" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-200"}`}>
                      একজন পরিশোধ করবেন
                    </button>
                    <button type="button" disabled={members.length < 2} aria-pressed={payForm.paymentMode === "split"}
                      onClick={() => setPayForm((p) => ({ ...p, paymentMode: "split" }))}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${payForm.paymentMode === "split" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-200"}`}>
                      দুজন মিলে পরিশোধ
                    </button>
                  </div>
                  {payForm.paymentMode === "single" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="টাকা দেবেন">
                        <select className={inputClass()} value={payForm.paidByUserId}
                          onChange={(e) => setPayForm((p) => ({ ...p, paidByUserId: e.target.value, fromAccountId: "" }))}>
                          <option value="">সদস্য বাছুন</option>
                          {members.map((m) => <option key={normalizeId(m.id || m._id)} value={normalizeId(m.id || m._id)}>{m.name}</option>)}
                        </select>
                      </Field>
                      <Field label="কোন অ্যাকাউন্ট থেকে">
                        <select className={inputClass()} value={payForm.fromAccountId}
                          onChange={(e) => setPayForm((p) => ({ ...p, fromAccountId: e.target.value }))}>
                          <option value="">অ্যাকাউন্ট বাছুন</option>
                          {payableAccounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                      </Field>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300">কে কোন অ্যাকাউন্ট থেকে কত টাকা দিচ্ছেন, লিখুন। এটি কিস্তির নির্ধারিত খরচের ভাগ পরিবর্তন করবে না।</p>
                      {(payForm.paymentParts || []).map((part, index) => {
                        const member = members.find((m) => normalizeId(m.id || m._id) === part.userId);
                        const options = eligibleAccountsFor(part.userId);
                        return <div key={part.userId || index} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                          <div className="mb-2 text-sm font-bold">{member?.name || `সদস্য ${index + 1}`}</div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="অ্যাকাউন্ট থেকে">
                              <select className={inputClass()} value={part.accountId}
                                onChange={(e) => updateEmiSplitPart(index, { accountId: e.target.value })}>
                                <option value="">অ্যাকাউন্ট বাছুন</option>
                                {options.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                              </select>
                            </Field>
                            <Field label="টাকা (৳)">
                              <input className={inputClass()} type="number" min="0.01" step="0.01"
                                value={part.amount} onChange={(e) => updateEmiSplitPart(index, { amount: e.target.value })} />
                            </Field>
                          </div>
                        </div>;
                      })}
                      <div className={`rounded-xl px-3 py-2 text-xs font-bold ${splitPaidCents === installmentCents ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : "bg-amber-500/10 text-amber-700 dark:text-amber-200"}`}>
                        মোট দিচ্ছেন ৳ {money(splitPaidCents / 100)} / ৳ {money(installmentCents / 100)}
                        {splitPaidCents !== installmentCents && " — মোট কিস্তির টাকার সঙ্গে মিলতে হবে"}
                      </div>
                    </div>
                  )}
                  <Field label="পরিশোধের তারিখ (আজকের তারিখ স্বয়ংক্রিয়ভাবে নির্বাচিত)">
                    <input type="date" className={inputClass()} value={payForm.paidDate}
                      onChange={(e) => setPayForm((p) => ({ ...p, paidDate: e.target.value }))} />
                  </Field>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-200">পরিশোধের টাকা</span>
                    <span className="text-2xl font-black text-emerald-800 dark:text-emerald-100">
                      ৳ {money(selectedInstallment?.amount || 0)}
                    </span>
                  </div>
                </div>

                {payError && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">{payError}</div>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <ActionButton onClick={closePayModal} variant="soft" disabled={paySubmitting}>
                    বাতিল
                  </ActionButton>
                  <ActionButton onClick={confirmMarkPaid} variant="success" disabled={paySubmitting || (payForm.paymentMode === "split" && splitPaidCents !== installmentCents)}>
                    {paySubmitting ? "সংরক্ষণ হচ্ছে…" : "পরিশোধ নিশ্চিত করুন"}
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {deletePlan && <div className="hn-modal-backdrop" role="presentation">
          <div className="hn-modal hn-danger-confirm" role="alertdialog" aria-modal="true" aria-labelledby="hn-delete-emi-title">
            <header><div><span className="hn-kicker">পরিকল্পনা মুছুন</span><h2 id="hn-delete-emi-title">{deletePlan.productName} মুছবেন?</h2></div><button type="button" aria-label="বন্ধ করুন" onClick={()=>setDeletePlan(null)}>×</button></header>
            <div className="hn-confirm-body"><p>এটি স্থায়ীভাবে মুছে যাবে। কোনো বিল বা পরিশোধের ইতিহাস থাকলে নিরাপত্তার জন্য মুছতে দেওয়া হবে না। প্রথমে সংশ্লিষ্ট বিলের অবস্থা যাচাই করুন।</p>
              <div className="hn-form-actions"><button type="button" onClick={()=>setDeletePlan(null)}>বাতিল</button><button type="button" className="hn-danger-button" onClick={confirmDeletePlan}>হ্যাঁ, মুছুন</button></div>
            </div>
          </div>
        </div>}
        {resumePlan && <div className="hn-modal-backdrop" role="presentation"><div className="hn-modal hn-emi-resume-dialog" role="dialog" aria-modal="true" aria-label="কিস্তি আবার চালু করুন">
          <header><div><span className="hn-kicker">কিস্তির সময়সূচি</span><h2>{resumePlan.productName} আবার চালু করুন</h2></div><button type="button" onClick={()=>setResumePlan(null)} aria-label="বন্ধ করুন">×</button></header>
          <div className="hn-resume-body"><label><input type="radio" name="resume-method" checked={resumeMode==='from-now'} onChange={()=>setResumeMode('from-now')}/> <span><b>এখন থেকে অবশিষ্ট কিস্তি</b><small>পুরোনো পরিশোধিত মাস আগের মতো থাকবে। বাকি মাসগুলো নির্বাচিত মাস থেকে পরপর বসবে।</small></span></label>
          <label><input type="radio" name="resume-method" checked={resumeMode==='include-missed'} onChange={()=>setResumeMode('include-missed')}/> <span><b>আগের বকেয়াসহ চালু করুন</b><small>আগের সময়সূচি থাকবে; না দেওয়া মাসগুলোর বকেয়াও দেখাবে।</small></span></label>
          <div className="hn-resume-month">চালু করার মাস <input type="month" min={monthNow()} value={resumeMonth} onChange={e=>setResumeMonth(e.target.value)} /></div>
          <p>কোনো পুরোনো পরিশোধ বা অ্যাকাউন্ট লেনদেন এখানে বদলানো হবে না।</p>
          <div className="hn-form-actions"><button type="button" onClick={()=>setResumePlan(null)}>বাতিল</button><button type="button" onClick={resumeExistingPlan}>নিশ্চিত করুন</button></div></div>
        </div></div>}

        {open && (
          <div className="hn-finance-modal-overlay fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="emi-modal hn-finance-modal-panel max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white sm:max-w-5xl sm:rounded-3xl">
              <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-800 p-5 text-white sm:p-6">
                <div className="text-xl font-black sm:text-2xl">{editingPlanId?'কিস্তি সম্পাদনা':'নতুন কিস্তি'}</div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-200 sm:text-sm">
                  পণ্যের নাম, মূল্য, মাস ও সদস্যদের ভাগ নির্বাচন করুন। পুরোনো পরিশোধ থাকলে আর্থিক তথ্য পরিবর্তন করা যাবে না।
                </p>
              </div>

              <div className="space-y-4 p-3 sm:p-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white">পণ্যের তথ্য</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">কেনাকাটার মৌলিক তথ্য</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                      ধাপ ১
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="পণ্যের নাম" className="sm:col-span-2">
                      <input
                        className={inputClass()}
                        value={form.productName}
                        onChange={(e) => setForm({ ...form, productName: e.target.value })}
                        placeholder="যেমন: মোবাইল ফোন"
                      />
                    </Field>

                    <Field label="ব্র্যান্ড">
                      <input
                        className={inputClass()}
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="Example: Samsung"
                      />
                    </Field>

                    <Field label="খরচের ধরন">
                      <select
                        className={inputClass()}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value="">ধরন বাছুন</option>
                        {productCategoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="কেনার তারিখ">
                      <input
                        type="date"
                        className={inputClass()}
                        value={form.purchaseDate}
                        onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                      />
                    </Field>

                    <Field label="কিস্তি শুরুর মাস">
                      <input
                        type="month"
                        className={inputClass()}
                        value={form.startMonth}
                        onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                      />
                    </Field>

                    <Field label="কত মাস">
                      <select
                        className={inputClass()}
                        value={form.months}
                        onChange={(e) => setForm({ ...form, months: e.target.value })}
                      >
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>
                            {m} month{m > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white">কিস্তির হিসাব</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">মোট কিস্তি নিজে থেকে হিসাব হবে</div>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20">
                      ধাপ ২
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Field label="মূল দাম">
                      <input
                        className={inputClass()}
                        value={form.originalPrice}
                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                        placeholder="Example: 60000"
                      />
                    </Field>

                    <Field label="কিস্তির অতিরিক্ত চার্জ (%)">
                      <input
                        className={inputClass()}
                        value={form.emiCharge}
                        onChange={(e) => setForm({ ...form, emiCharge: e.target.value })}
                        placeholder="Example: 0.9"
                      />
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Example: <b>0.9</b> অর্থ <b>0.9%</b> চার্জ।
                      </div>
                    </Field>

                    <Field label="মোট পরিশোধ">
                      <input
                        className={inputClass("bg-slate-50 font-black text-slate-950 dark:bg-slate-900 dark:text-white")}
                        value={form.totalPayable}
                        readOnly
                        title="মূল দামের সঙ্গে কিস্তির চার্জ যোগ হয়ে হিসাব হবে"
                      />
                    </Field>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10 md:col-span-3 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                            আনুমানিক মাসিক কিস্তি
                          </div>
                          <div className="mt-1 hidden text-sm text-emerald-700 dark:text-emerald-200 sm:block">
                            মোট টাকা ও মাসের সংখ্যা অনুযায়ী।
                          </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-800 dark:text-emerald-100 sm:text-3xl">
                          ৳ {money(Number(form.totalPayable || 0) / Number(form.months || 1))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white">কার কতটা দিতে হবে</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">এই কিস্তি কার ভাগে পড়বে</div>
                    </div>
                    <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20">
                      ধাপ ৩
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="খরচ ভাগ হবে" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.splitType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            splitType: nextType,
                            personalUserId:
                              nextType === "personal"
                                ? (prev.personalUserId || myId || members[0]?.id || "")
                                : prev.personalUserId,
                          }));
                        }}
                      >
                        <option value="equal">সমান</option>
                        <option value="personal">ব্যক্তিগত</option>
                        <option value="ratio">অনুপাত অনুযায়ী</option>
                        <option value="fixed">নির্দিষ্ট</option>
                      </select>
                    </Field>

                    {form.splitType === "personal" && (
                      <Field label="কার জন্য" className="sm:col-span-2">
                        <select
                          className={inputClass()}
                          value={form.personalUserId}
                          onChange={(e) => setForm({ ...form, personalUserId: e.target.value })}
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    {form.splitType === "ratio" && otherMember && (
                      <>
                        <Field label="আমার শতাংশ">
                          <input
                            className={inputClass()}
                            value={form.ratioMe}
                            onChange={(e) => setForm({ ...form, ratioMe: e.target.value })}
                          />
                        </Field>

                        <Field label={`${otherMember.name} %`}>
                          <input
                            className={inputClass()}
                            value={form.ratioOther}
                            onChange={(e) => setForm({ ...form, ratioOther: e.target.value })}
                          />
                        </Field>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:col-span-2 lg:col-span-4">
                          ভাগের মোট শতাংশ ১০০ হতে হবে।
                        </div>
                      </>
                    )}

                    {form.splitType === "fixed" && otherMember && (
                      <>
                        <Field label="আমার ভাগ">
                          <input
                            className={inputClass()}
                            value={form.fixedMe}
                            onChange={(e) => setForm({ ...form, fixedMe: e.target.value })}
                          />
                        </Field>

                        <Field label={`${otherMember.name} Amount`}>
                          <input
                            className={inputClass()}
                            value={form.fixedOther}
                            onChange={(e) => setForm({ ...form, fixedOther: e.target.value })}
                          />
                        </Field>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:col-span-2 lg:col-span-4">
                          Fixed amounts must total the regular monthly installment. The final installment is allocated proportionally if its amount differs.
                        </div>
                      </>
                    )}

                    <Field label="মন্তব্য" className="sm:col-span-2 lg:col-span-4">
                      <input
                        className={inputClass()}
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="নোট (ইচ্ছা হলে)"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <ActionButton onClick={closeModal} variant="soft">
                    বাতিল
                  </ActionButton>
                  <ActionButton onClick={createPlan} variant="primary">
                    {editingPlanId?'পরিবর্তন সংরক্ষণ':'পরিকল্পনা সংরক্ষণ'}
                  </ActionButton>
                </div>

                {msg && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 break-words dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                    {msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
          </div>
    </AppLayout>
  );
}
