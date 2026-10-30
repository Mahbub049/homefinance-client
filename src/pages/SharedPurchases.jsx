import HFPageLead from "../components/design/HFPageLead";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Loader from "../components/ui/Loader";
import api from "../services/api";
import { getUser } from "../services/authStorage";

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function currentMonth() {
  return localDate().slice(0, 7);
}

function money(value) {
  const amount = Number(value || 0);
  return `৳ ${amount.toLocaleString("bn-BD", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

// A new key belongs to each deliberate save operation. Reuse it if the network
// response is lost so the backend can return the first result safely.
function newRequestKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `hf-share-${crypto.randomUUID()}`;
  }
  return `hf-share-${Date.now()}-${Math.random().toString(36).slice(2).padEnd(16, "0")}`;
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function monthLabel(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month) return value || "Selected month";
  return new Date(year, month - 1, 1).toLocaleDateString("bn-BD", {
    month: "long",
    year: "numeric",
  });
}

function dateLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("bn-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function idOf(value) {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
}

function nameOf(value, fallback = "Member") {
  return typeof value === "object" ? value.name || fallback : fallback;
}

function accountMatchesMember(account, userId, members = []) {
  const owner = String(account?.owner || "").trim().toLowerCase();
  if (!owner || ["joint", "shared", "family"].includes(owner)) return true;

  const member = members.find((row) => idOf(row?.id) === idOf(userId));
  const memberName = String(member?.name || "").trim().toLowerCase();
  if (!memberName) return false;

  const memberParts = memberName.split(/\s+/).filter(Boolean);
  return (
    memberName.includes(owner) ||
    owner.includes(memberName) ||
    memberParts.some((part) => owner.includes(part) || part.includes(owner))
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-indigo-400";
const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    card: (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    ),
    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect x="3" y="4" width="18" height="18" rx="4" />
      </svg>
    ),
    arrow: (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="m20 6-11 11-5-5" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),
    trash: (
      <svg {...common}>
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </svg>
    ),
    undo: (
      <svg {...common}>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  };

  return icons[name] || icons.card;
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, helper, icon, tone }) {
  const tones = {
    indigo:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200",
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200",
  };

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon name={icon} />
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;

  return (
    <div className="hn-finance-modal-overlay fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`hn-finance-modal-panel max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-white shadow-2xl dark:bg-slate-900 sm:rounded-[28px] ${
          wide ? "sm:max-w-4xl" : "sm:max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 sm:px-6">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SharedPurchases() {
  const [hfMore, setHfMore] = useState(false);
  const storedUser = getUser();
  const myId = idOf(storedUser?._id || storedUser?.id);

  const [month, setMonth] = useState(currentMonth());
  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState({});
  const [members, setMembers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const createRequestKey = useRef(null);
  const paymentRequestKey = useRef(null);
  const [message, setMessage] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const [form, setForm] = useState({
    title: "",
    totalAmount: "",
    purchaseDate: localDate(),
    categoryId: "",
    payerUserId: "",
    payerAccountId: "",
    purchaseType: "shared",
    startMonth: currentMonth(),
    months: 8,
    splitMode: "equal",
    shares: [],
    note: "",
  });

  const [payForm, setPayForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    paidDate: localDate(),
    note: "",
  });

  async function loadBasics() {
    const [memberRes, accountRes, categoryRes] = await Promise.all([
      api.get("/api/family/members"),
      api.get("/api/accounts"),
      api.get("/api/categories", { params: { kind: "expense" } }),
    ]);

    const memberItems = memberRes.data.members || [];
    const activeAccounts = (accountRes.data.items || []).filter((item) => item.isActive !== false);
    const categoryItems = (categoryRes.data.items || []).filter((item) => item.isActive !== false);

    setMembers(memberItems);
    setAccounts(activeAccounts);
    setCategories(categoryItems);

    const payerId = myId || memberItems[0]?.id || "";
    const defaultPayerAccount = activeAccounts.find((account) =>
      accountMatchesMember(account, payerId, memberItems)
    );
    setForm((previous) => ({
      ...previous,
      payerUserId: previous.payerUserId || payerId,
      payerAccountId:
        previous.payerAccountId || defaultPayerAccount?._id || "",
      categoryId:
        previous.categoryId ||
        categoryItems.find((item) => /large purchase/i.test(item.name || ""))?._id ||
        categoryItems[0]?._id ||
        "",
      shares:
        previous.shares.length > 0
          ? previous.shares
          : memberItems.map((member) => ({ userId: member.id, shareAmount: "" })),
    }));
  }

  async function loadPlans(selectedMonth = month) {
    const res = await api.get("/api/shared-purchases", { params: { month: selectedMonth } });
    setPlans(res.data.plans || []);
    setSummary(res.data.summary || {});
  }

  async function loadAll(selectedMonth = month) {
    setLoading(true);
    setMessage("");
    try {
      await Promise.all([loadBasics(), loadPlans(selectedMonth)]);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to load shared purchases");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPlans(month).catch((error) => {
      setMessage(error?.response?.data?.message || "Failed to change month");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const total = Number(form.totalAmount || 0);
  const payerId = idOf(form.payerUserId);

  const payerAccounts = useMemo(
    () => accounts.filter((account) => accountMatchesMember(account, payerId, members)),
    [accounts, members, payerId]
  );

  const reimbursementFromAccounts = useMemo(() => {
    const userId = idOf(selectedInstallment?.userId);
    return accounts.filter((account) => accountMatchesMember(account, userId, members));
  }, [accounts, members, selectedInstallment]);

  const reimbursementToAccounts = useMemo(() => {
    const userId = idOf(selectedPlan?.payerUserId);
    return accounts.filter((account) => accountMatchesMember(account, userId, members));
  }, [accounts, members, selectedPlan]);

  const calculatedShares = useMemo(() => {
    if (form.purchaseType === "personal") {
      return [{ userId: payerId, shareAmount: round2(total) }];
    }

    const rows = form.shares.filter((row) => row.userId);
    if (form.splitMode === "custom") {
      return rows.map((row) => ({
        userId: row.userId,
        shareAmount: round2(row.shareAmount),
      }));
    }

    if (!rows.length || total <= 0) return rows.map((row) => ({ ...row, shareAmount: 0 }));
    const regular = round2(total / rows.length);
    let used = 0;
    return rows.map((row, index) => {
      const shareAmount = index === rows.length - 1 ? round2(total - used) : regular;
      used = round2(used + shareAmount);
      return { userId: row.userId, shareAmount };
    });
  }, [form.purchaseType, form.splitMode, form.shares, payerId, total]);

  const allocated = round2(
    calculatedShares.reduce((sum, row) => sum + Number(row.shareAmount || 0), 0)
  );
  const remaining = round2(total - allocated);

  function resetForm() {
    const payerUserId = myId || members[0]?.id || "";
    const defaultPayerAccount = accounts.find((account) =>
      accountMatchesMember(account, payerUserId, members)
    );
    setForm({
      title: "",
      totalAmount: "",
      purchaseDate: localDate(),
      categoryId:
        categories.find((item) => /large purchase/i.test(item.name || ""))?._id ||
        categories[0]?._id ||
        "",
      payerUserId,
      payerAccountId: defaultPayerAccount?._id || "",
      purchaseType: "shared",
      startMonth: month,
      months: 8,
      splitMode: "equal",
      shares: members.map((member) => ({ userId: member.id, shareAmount: "" })),
      note: "",
    });
  }

  function openCreate() {
    createRequestKey.current = newRequestKey();
    resetForm();
    setMessage("");
    setCreateOpen(true);
  }

  function updateShare(userId, value) {
    setForm((previous) => ({
      ...previous,
      shares: previous.shares.map((row) =>
        idOf(row.userId) === idOf(userId) ? { ...row, shareAmount: value } : row
      ),
    }));
  }

  async function createPurchase(event) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim()) return setMessage("কেনাকাটার নাম লিখুন");
    if (total <= 0) return setMessage("মোট দাম শূন্যের বেশি হতে হবে");
    if (!form.payerUserId || !form.payerAccountId) {
      return setMessage("কে পুরো টাকা দিয়েছেন এবং কোন অ্যাকাউন্ট থেকে দিয়েছেন তা বাছুন");
    }
    if (form.purchaseType === "shared" && calculatedShares.length < 2) {
      return setMessage("যৌথ কেনাকাটায় অন্তত দুজন সদস্য প্রয়োজন");
    }
    if (remaining !== 0) {
      return setMessage(`সবার ভাগ যোগ করলে মোট দামের সঙ্গে মিলতে হবে। পার্থক্য: ${money(remaining)}`);
    }

    setSaving(true);
    try {
      if (!createRequestKey.current) createRequestKey.current = newRequestKey();
      await api.post("/api/shared-purchases", {
        title: form.title.trim(),
        totalAmount: total,
        purchaseDate: form.purchaseDate,
        categoryId: form.categoryId || null,
        payerUserId: form.payerUserId,
        payerAccountId: form.payerAccountId,
        purchaseType: form.purchaseType,
        startMonth: form.startMonth,
        months: Number(form.months),
        shares: calculatedShares,
        note: form.note.trim(),
      }, { headers: { 'Idempotency-Key': createRequestKey.current } });

      createRequestKey.current = null;
      setCreateOpen(false);
      await loadPlans(month);
      setMessage("কেনাকাটা সংরক্ষিত হয়েছে। পুরো টাকা একবারই অ্যাকাউন্ট থেকে বের হয়েছে; মাসিক ভাগ আলাদাভাবে দেখানো হবে।");
    } catch (error) {
      setMessage(error?.response?.data?.message || "কেনাকাটা সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  function openPayment(plan, installment) {
    paymentRequestKey.current = newRequestKey();
    const installmentUserId = idOf(installment?.userId);
    const payerUserId = idOf(plan?.payerUserId);
    const allowedFromAccounts = accounts.filter((account) =>
      accountMatchesMember(account, installmentUserId, members)
    );
    const allowedToAccounts = accounts.filter((account) =>
      accountMatchesMember(account, payerUserId, members)
    );

    const previousFromId = idOf(installment?.fromAccountId);
    const planPayerAccountId = idOf(plan?.payerAccountId);
    const defaultFromId = allowedFromAccounts.some(
      (account) => idOf(account._id) === previousFromId
    )
      ? previousFromId
      : idOf(allowedFromAccounts[0]?._id);
    const defaultToId = allowedToAccounts.some(
      (account) => idOf(account._id) === planPayerAccountId
    )
      ? planPayerAccountId
      : idOf(allowedToAccounts[0]?._id);

    setSelectedPlan(plan);
    setSelectedInstallment(installment);
    setPayForm({
      fromAccountId: defaultFromId,
      toAccountId: defaultToId,
      paidDate: localDate(),
      note: "",
    });
    setMessage("");
    setPayOpen(true);
  }

  async function recordPayment(event) {
    event.preventDefault();
    if (!selectedPlan?._id || !selectedInstallment?._id || saving) return;
    if (!payForm.fromAccountId || !payForm.toAccountId) {
      return setMessage("টাকা দেওয়ার ও টাকা পাওয়ার অ্যাকাউন্ট বাছুন");
    }

    setSaving(true);
    try {
      if (!paymentRequestKey.current) paymentRequestKey.current = newRequestKey();
      await api.post(
        `/api/shared-purchases/${selectedPlan._id}/installments/${selectedInstallment._id}/pay`,
        {
          ...payForm,
          // Required by server-side payment integrity validation.
          purchaseId: idOf(selectedPlan._id),
          installmentId: idOf(selectedInstallment._id),
        },
        { headers: { 'Idempotency-Key': paymentRequestKey.current } }
      );
      paymentRequestKey.current = null;
      setPayOpen(false);
      await loadPlans(month);
      setMessage("টাকা ফেরত দেওয়ার তথ্য সংরক্ষিত হয়েছে। এটি নতুন আয় বা খরচ নয়।");
    } catch (error) {
      setMessage(error?.response?.data?.message || "টাকা ফেরত দেওয়ার তথ্য সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  async function undoPayment(plan, installment) {
    const confirmed = window.confirm("Undo this reimbursement and reverse the account transfer?");
    if (!confirmed) return;

    try {
      await api.delete(
        `/api/shared-purchases/${plan._id}/installments/${installment._id}/payment`
      );
      await loadPlans(month);
      setMessage("Payment was moved back to pending and its transfer was removed.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not undo payment");
    }
  }

  async function removePlan(plan) {
    const confirmed = window.confirm(
      `Delete “${plan.title}”? This will reverse its upfront account deduction, reimbursements, and all monthly allocations.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/shared-purchases/${plan._id}`);
      await loadPlans(month);
      setMessage("Purchase and all linked records were removed.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Delete failed");
    }
  }

  const memberMap = useMemo(
    () => new Map(members.map((member) => [idOf(member.id), member])),
    [members]
  );

  return (
    <AppLayout>
      <div className={`hf-step3-page hf-step3-sharedpurchases hf-v2-page hf-v2-sharedpurchases ${hfMore ? "hf-step3-expanded" : ""}`}>
        <HFPageLead title="ভাগ করে কেনাকাটা" description="বড় কেনাকাটার মাসিক ভাগ ও টাকা ফেরতের হিসাব" month={month} onMonthChange={setMonth}
          metrics={[
 {label:'এই মাসে ফেরত দিতে হবে',value:summary.monthDue,primary:true},
 {label:'এই মাসে ফেরত পেয়েছেন',value:summary.monthReceived}
]}
          onAdd={openCreate} addLabel="নতুন কেনাকাটা"
          addDisabled={false}
          onExtra={undefined} extraLabel=""
          onRefresh={undefined}
          more={undefined} onToggleMore={undefined} />

      <div className="min-h-full bg-slate-50 px-1 py-2 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-2 sm:py-3">
        <div className="mx-auto w-full space-y-5">
          <></>

          {message ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              {message}
            </div>
          ) : null}

          <></>

          <></>
          {Number(summary.invalidPaymentRecords || 0) > 0 ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
              {summary.invalidPaymentRecords} টি পরিশোধের সঙ্গে আসল টাকা পাঠানোর রেকর্ড মেলেনি। দেনা-পাওনার হিসাব ব্যবহারের আগে যাচাই করুন।
            </div>
          ) : null}
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            মাসিক ভাগ ও আসল ব্যাংক লেনদেন আলাদা করে হিসাব করা হয়।
          </p>

          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-10 dark:border-white/10 dark:bg-slate-900/70">
              <Loader />
            </div>
          ) : plans.length === 0 ? (
            <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-slate-900/60 sm:p-12">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
                <Icon name="card" className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-black">এখনও বড় কেনাকাটা নেই</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                কেনাকাটার পুরো টাকা যিনি দিয়েছেন, তাঁর অ্যাকাউন্ট থেকে একবারই কাটা হবে। মাসের হিসাবের জন্য নির্ধারিত ভাগ আলাদা দেখাবে।
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20"
              >
                <Icon name="plus" /> প্রথম কেনাকাটা যোগ করুন
              </button>
            </section>
          ) : (
            <section className="space-y-4">
              {plans.map((plan) => {
                const payerName = nameOf(plan.payerUserId, "টাকা দিয়েছেন");
                const stats = plan.stats || {};
                const rows = plan.monthInstallments || [];
                const overdueRows = plan.overdueInstallments || [];

                return (
                  <article key={plan._id} className="hf-hishab-purchase-row">
                    <div className="hf-hishab-purchase-row-main">
                      <div><h2>{plan.title}</h2><p>পুরো টাকা দিয়েছেন {payerName} · {plan.months} মাসে ভাগ · {plan.purchaseType === 'personal' ? 'ব্যক্তিগত' : 'যৌথ'}</p></div>
                      <div className="hf-hishab-purchase-number"><span>মোট দাম</span><strong>{money(plan.totalAmount)}</strong></div>
                      <div className="hf-hishab-purchase-number"><span>ফেরত পাওয়া</span><strong>{money(stats.paidAmount)}</strong></div>
                      <div className="hf-hishab-purchase-number"><span>ফেরত বাকি</span><strong>{money(stats.outstanding)}</strong></div>
                      <div className="hf-hishab-plan-context">
                        <span>নির্ধারিত মেয়াদ: {plan.months} মাস ({monthLabel(plan.startMonth)} – {monthLabel(plan.endMonth)})</span>
                        <strong>আগের মাসগুলোর ভাগ: {money(plan.allocationHistory?.previousAmount)} ({plan.allocationHistory?.previousMonths?.length || 0} মাস)</strong>
                        <small>এটি মাসিক হিসাবের ভাগ, নতুন ব্যাংক কর্তন নয়।</small>
                      </div>
                      {rows.some(item => item.paymentRequired && item.status !== 'paid') && (
                        <button type="button" className="hf-v2-btn hf-v2-btn--main hf-hishab-purchase-pay"
                          onClick={() => openPayment(plan, rows.find(item => item.paymentRequired && item.status !== 'paid'))}>
                          টাকা দিয়েছেন
                        </button>
                      )}
                    </div>
                    <details className="hf-hishab-purchase-more" >
                      <summary>এই মাসের ভাগ, আগের মাস ও পরিশোধের বিস্তারিত</summary>
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                              {plan.title}
                            </h2>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                                plan.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"
                              }`}
                            >
                              {plan.status === 'completed' ? 'শেষ হয়েছে' : 'চলছে'}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {plan.purchaseType === "personal" ? "ব্যক্তিগত" : "যৌথ"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            পুরো টাকা দিয়েছেন <strong>{payerName}</strong> যে অ্যাকাউন্ট থেকে {plan.payerAccountId?.name || "account"} তারিখ {dateLabel(plan.purchaseDate)}.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white dark:bg-white dark:text-slate-950">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">
                              মোট দাম
                            </p>
                            <p className="mt-1 text-lg font-black">{money(plan.totalAmount)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePlan(plan)}
                            className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                            title="কেনাকাটা মুছুন"
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </div>

                      <div className="hf-v2-shared-facts">
  <div><span>কত মাস ধরে</span><strong>{plan.months} মাস</strong><small>{monthLabel(plan.startMonth)} — {monthLabel(plan.endMonth)}</small></div>
  <div><span>টাকা ফেরত পেয়েছেন</span><strong>{money(stats.paidAmount)}</strong></div>
  <div><span>এখনও পাওনা (ভবিষ্যতের ভাগসহ)</span><strong>{money(stats.outstanding)}</strong></div>
</div>

                      <div className="mt-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          কার কত ভাগ
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(plan.shares || []).map((share) => (
                            <div
                              key={idOf(share.userId)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]"
                            >
                              <strong>{nameOf(share.userId)}</strong>
                              <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                              {money(share.shareAmount)}
                              <span className="ml-2 text-xs text-slate-500">≈ {money(share.monthlyAmount)}/মাস</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/45 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black">{monthLabel(month)} হিসাব</h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            প্রত্যেকের মাসিক ভাগ নির্ধারিত থাকবে। টাকা ফেরতের লেনদেন নতুন খরচ তৈরি করে না।
                          </p>
                        </div>
                      </div>

                      {rows.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                          এই মাসে কোনো ভাগ নেই।
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 xl:grid-cols-2">
                          {rows.map((installment) => {
                            const member = installment.userId || memberMap.get(idOf(installment.userId));
                            const paid = installment.status === "paid" && installment.paymentVerified;
                            const recordNeedsReview = installment.status === "paid" && !installment.paymentVerified;
                            const allocationOnly = !installment.paymentRequired;

                            return (
                              <div
                                key={installment._id}
                                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-black">{nameOf(member)}</p>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                        allocationOnly
                                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200"
                                          : paid
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"
                                            : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"
                                      }`}
                                    >
                                      {allocationOnly ? "নির্ধারিত ভাগ" : recordNeedsReview ? "যাচাই প্রয়োজন" : paid ? (installment.paidAsOfMonth ? "ফেরত দিয়েছেন" : "পরে ফেরত দিয়েছেন") : "দেওয়া বাকি"}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {money(installment.amount)} · বাকি {dateLabel(installment.dueDate)}
                                  </p>
                                  {paid && installment.fromAccountId ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {installment.fromAccountId.name} → {installment.toAccountId?.name || plan.payerAccountId?.name}
                                    </p>
                                  ) : null}
                                </div>

                                {!allocationOnly && installment.status !== "paid" ? (
                                  <button
                                    type="button"
                                    onClick={() => openPayment(plan, installment)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/15"
                                  >
                                    <Icon name="arrow" /> টাকা দিয়েছেন
                                  </button>
                                ) : null}

                                {!allocationOnly && installment.status === "paid" ? (
                                  <button
                                    type="button"
                                    onClick={() => undoPayment(plan, installment)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                  >
                                    <Icon name="undo" /> বাতিল করুন
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {overdueRows.length > 0 ? (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                          <p className="text-sm font-black text-amber-800 dark:text-amber-200">আগের মাসের বকেয়া</p>
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">পুরোনো বকেয়া এই মাসের নতুন খরচ নয়।</p>
                          <div className="mt-3 space-y-2">
                            {overdueRows.map((installment) => (
                              <div key={installment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/90 p-3 dark:bg-slate-950/50">
                                <div>
                                  <p className="text-sm font-black">{nameOf(installment.userId)} · {monthLabel(installment.month)}</p>
                                  <p className="text-xs text-slate-500">{money(installment.amount)} · {installment.paymentVerified ? "পরে পরিশোধ" : installment.needsPaymentReview ? "পরিশোধ যাচাই প্রয়োজন" : "বাকি"}</p>
                                </div>
                                {installment.status !== "paid" ? (
                                  <button type="button" onClick={() => openPayment(plan, installment)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">টাকা দিয়েছেন</button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    </details>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>

      <Modal open={createOpen} title="নতুন বড় কেনাকাটা" onClose={() => setCreateOpen(false)} wide>
        <form onSubmit={createPurchase} className="space-y-5 p-4 sm:p-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
            পুরো দাম প্রথমে যিনি দিয়েছেন তাঁর অ্যাকাউন্ট থেকে একবারই কাটা হবে। এরপর নির্ধারিত মাস অনুযায়ী দুজনের ভাগ দেখানো হবে। টাকা ফেরত দিলে সেটি সদস্যদের অ্যাকাউন্টের মধ্যে স্থানান্তর হবে।
          </div>

          {message ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              {message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="কেনাকাটার নাম">
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="Air Conditioner"
              />
            </Field>
            <Field label="মোট দাম">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={(event) => setForm((previous) => ({ ...previous, totalAmount: event.target.value }))}
                placeholder="74000"
              />
            </Field>
            <Field label="কেনার তারিখ">
              <input
                className={inputClass}
                type="date"
                value={form.purchaseDate}
                onChange={(event) => setForm((previous) => ({ ...previous, purchaseDate: event.target.value }))}
              />
            </Field>
            <Field label="মাসিক হিসাব শুরু">
              <input
                className={inputClass}
                type="month"
                value={form.startMonth}
                onChange={(event) => setForm((previous) => ({ ...previous, startMonth: event.target.value }))}
              />
            </Field>
            <Field label="কত মাসে ভাগ করবেন">
              <input
                className={inputClass}
                type="number"
                min="1"
                max="120"
                value={form.months}
                onChange={(event) => setForm((previous) => ({ ...previous, months: event.target.value }))}
              />
            </Field>
            <Field label="খরচের ধরন">
              <select
                className={inputClass}
                value={form.categoryId}
                onChange={(event) => setForm((previous) => ({ ...previous, categoryId: event.target.value }))}
              >
                <option value="">বড় কেনাকাটার তথ্য</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="পুরো টাকা দিয়েছেন">
              <select
                className={inputClass}
                value={form.payerUserId}
                onChange={(event) => {
                  const nextPayerId = event.target.value;
                  const nextAccounts = accounts.filter((account) =>
                    accountMatchesMember(account, nextPayerId, members)
                  );
                  setForm((previous) => ({
                    ...previous,
                    payerUserId: nextPayerId,
                    payerAccountId: nextAccounts.some(
                      (account) => idOf(account._id) === idOf(previous.payerAccountId)
                    )
                      ? previous.payerAccountId
                      : idOf(nextAccounts[0]?._id),
                  }));
                }}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="কোন অ্যাকাউন্ট থেকে পুরো টাকা গেছে">
              <select
                className={inputClass}
                value={form.payerAccountId}
                onChange={(event) => setForm((previous) => ({ ...previous, payerAccountId: event.target.value }))}
              >
                <option value="">অ্যাকাউন্ট বাছুন</option>
                {payerAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.name} · {account.owner}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <p className={labelClass}>কেনাকাটার দায়</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((previous) => ({ ...previous, purchaseType: "personal" }))}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.purchaseType === "personal"
                    ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10 dark:bg-indigo-400/10"
                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
                }`}
              >
                <strong className="block">ব্যক্তিগত কেনাকাটা</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  যিনি কিনেছেন, পুরো খরচ তাঁর; মাসে ভাগ করে দেখানো হবে।
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForm((previous) => ({ ...previous, purchaseType: "shared" }))}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.purchaseType === "shared"
                    ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10 dark:bg-indigo-400/10"
                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
                }`}
              >
                <strong className="block">যৌথ কেনাকাটা</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  দুজনের ভাগ ঠিক করে নির্ধারিত মাসে টাকা ফেরত দিন।
                </span>
              </button>
            </div>
          </div>

          {form.purchaseType === "shared" ? (
            <div className="rounded-[24px] border border-slate-200 p-4 dark:border-white/10 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black">সদস্যভিত্তিক ভাগ</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    যিনি টাকা দিয়েছেন, তাঁর ভাগও রাখতে হবে।
                  </p>
                </div>
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-white/10">
                  <button
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, splitMode: "equal" }))}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      form.splitMode === "equal" ? "bg-white shadow dark:bg-slate-800" : "text-slate-500"
                    }`}
                  >
                    সমান
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, splitMode: "custom" }))}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      form.splitMode === "custom" ? "bg-white shadow dark:bg-slate-800" : "text-slate-500"
                    }`}
                  >
                    নিজের মতো
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {members.map((member) => {
                  const calculated = calculatedShares.find(
                    (row) => idOf(row.userId) === idOf(member.id)
                  );
                  return (
                    <div key={member.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.05]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black">{member.name}</p>
                          <p className="text-xs text-slate-500">
                            {idOf(member.id) === payerId ? "Upfront payer" : "Will reimburse payer"}
                          </p>
                        </div>
                        {form.splitMode === "custom" ? (
                          <input
                            className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950"
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              form.shares.find((row) => idOf(row.userId) === idOf(member.id))
                                ?.shareAmount || ""
                            }
                            onChange={(event) => updateShare(member.id, event.target.value)}
                            placeholder="0"
                          />
                        ) : (
                          <p className="font-black text-indigo-700 dark:text-indigo-300">
                            {money(calculated?.shareAmount)}
                          </p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        প্রায় {money(Number(calculated?.shareAmount || 0) / Number(form.months || 1))} প্রতি মাসে
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white dark:bg-white dark:text-slate-950">
                <span className="font-bold">ভাগ করা হয়েছে {money(allocated)} এর মধ্যে {money(total)}</span>
                <span className={`font-black ${remaining === 0 ? "text-emerald-300 dark:text-emerald-700" : "text-amber-300 dark:text-amber-700"}`}>
                  {remaining === 0 ? "ভাগ মিলেছে" : `অবশিষ্ট ${money(remaining)}`}
                </span>
              </div>
            </div>
          ) : null}

          <Field label="নোট (ইচ্ছা হলে)">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.note}
              onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))}
              placeholder="ওয়ারেন্টি, মডেল বা টাকা ফেরতের শর্ত"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 dark:border-white/10 dark:text-slate-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
            >
              {saving ? "সংরক্ষণ হচ্ছে…" : "কেনাকাটা সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={payOpen} title="ফেরত দেওয়া টাকা যোগ করুন" onClose={() => setPayOpen(false)}>
        <form onSubmit={recordPayment} className="space-y-4 p-4 sm:p-6">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">পরিশোধ</p>
            <p className="mt-2 text-lg font-black">{selectedPlan?.title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {nameOf(selectedInstallment?.userId)} → {nameOf(selectedPlan?.payerUserId, "যিনি পুরো টাকা দিয়েছেন")} : {money(selectedInstallment?.amount)} ফেরত দেবেন।
            </p>
          </div>

          {message ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              {message}
            </div>
          ) : null}

          <Field label="যে অ্যাকাউন্ট থেকে দেবেন">
            <select
              className={inputClass}
              value={payForm.fromAccountId}
              onChange={(event) => setPayForm((previous) => ({ ...previous, fromAccountId: event.target.value }))}
            >
              <option value="">যে অ্যাকাউন্ট থেকে যাবে</option>
              {reimbursementFromAccounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} · {account.owner}
                </option>
              ))}
            </select>
          </Field>

          <Field label="যে অ্যাকাউন্টে টাকা যাবে">
            <select
              className={inputClass}
              value={payForm.toAccountId}
              onChange={(event) => setPayForm((previous) => ({ ...previous, toAccountId: event.target.value }))}
            >
              <option value="">টাকা যে অ্যাকাউন্টে আসবে</option>
              {reimbursementToAccounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} · {account.owner}
                </option>
              ))}
            </select>
          </Field>

          <Field label="পরিশোধের তারিখ">
            <input
              className={inputClass}
              type="date"
              value={payForm.paidDate}
              onChange={(event) => setPayForm((previous) => ({ ...previous, paidDate: event.target.value }))}
            />
          </Field>

          <Field label="নোট (ইচ্ছা হলে)">
            <input
              className={inputClass}
              value={payForm.note}
              onChange={(event) => setPayForm((previous) => ({ ...previous, note: event.target.value }))}
              placeholder="নগদ, ব্যাংক বা অন্যান্য তথ্য…"
            />
          </Field>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            এতে একটি অ্যাকাউন্ট থেকে অন্যটিতে টাকা যাবে। নতুন আয় বা খরচ যোগ হবে না।
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPayOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "সংরক্ষণ হচ্ছে…" : "টাকা ফেরত দেওয়া হয়েছে"}
            </button>
          </div>
        </form>
      </Modal>
          </div>
    </AppLayout>
  );
}
