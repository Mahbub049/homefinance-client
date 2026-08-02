import { useEffect, useMemo, useState } from "react";
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
  return `৳ ${amount.toLocaleString("en-BD", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function monthLabel(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month) return value || "Selected month";
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function dateLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-white shadow-2xl dark:bg-slate-900 sm:rounded-[28px] ${
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
    setForm((previous) => ({
      ...previous,
      payerUserId: previous.payerUserId || payerId,
      payerAccountId: previous.payerAccountId || activeAccounts[0]?._id || "",
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
    setForm({
      title: "",
      totalAmount: "",
      purchaseDate: localDate(),
      categoryId:
        categories.find((item) => /large purchase/i.test(item.name || ""))?._id ||
        categories[0]?._id ||
        "",
      payerUserId,
      payerAccountId: accounts[0]?._id || "",
      purchaseType: "shared",
      startMonth: month,
      months: 8,
      splitMode: "equal",
      shares: members.map((member) => ({ userId: member.id, shareAmount: "" })),
      note: "",
    });
  }

  function openCreate() {
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

    if (!form.title.trim()) return setMessage("Purchase title is required");
    if (total <= 0) return setMessage("Total amount must be greater than 0");
    if (!form.payerUserId || !form.payerAccountId) {
      return setMessage("Select the payer and payment account");
    }
    if (form.purchaseType === "shared" && calculatedShares.length < 2) {
      return setMessage("A shared purchase needs at least two members");
    }
    if (remaining !== 0) {
      return setMessage(`Member shares must match the total. Remaining: ${money(remaining)}`);
    }

    setSaving(true);
    try {
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
      });

      setCreateOpen(false);
      await loadPlans(month);
      setMessage("Purchase added. The full amount changed the account balance, while monthly allocations were scheduled separately.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not create purchase");
    } finally {
      setSaving(false);
    }
  }

  function openPayment(plan, installment) {
    setSelectedPlan(plan);
    setSelectedInstallment(installment);
    setPayForm({
      fromAccountId: installment?.fromAccountId?._id || "",
      toAccountId: idOf(plan?.payerAccountId) || "",
      paidDate: localDate(),
      note: "",
    });
    setMessage("");
    setPayOpen(true);
  }

  async function recordPayment(event) {
    event.preventDefault();
    if (!selectedPlan?._id || !selectedInstallment?._id) return;
    if (!payForm.fromAccountId || !payForm.toAccountId) {
      return setMessage("Select both payment accounts");
    }

    setSaving(true);
    try {
      await api.post(
        `/api/shared-purchases/${selectedPlan._id}/installments/${selectedInstallment._id}/pay`,
        payForm
      );
      setPayOpen(false);
      await loadPlans(month);
      setMessage("Reimbursement recorded as an account transfer, not as regular income.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Payment failed");
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
      <div className="min-h-full bg-slate-50 px-1 py-2 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-2 sm:py-3">
        <div className="mx-auto w-full space-y-5">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-800 p-5 text-white shadow-xl sm:p-7">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-100">
                  Account balance ≠ monthly budget
                </div>
                <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">
                  Shared & Large Purchases
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Deduct the real purchase once from the payer account, distribute each member’s responsibility across months, and track reimbursements without counting them as income.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-[minmax(180px,1fr)_auto] lg:w-auto">
                <label className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-indigo-100">
                    Viewing month
                  </span>
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    className="mt-1 w-full bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]"
                  />
                </label>
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-indigo-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  <Icon name="plus" /> Add Purchase
                </button>
              </div>
            </div>
          </section>

          {message ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              {message}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Outstanding"
              value={money(summary.totalOutstanding)}
              helper="Still owed to upfront payers"
              icon="users"
              tone="amber"
            />
            <StatCard
              label={`${monthLabel(month)} Allocation`}
              value={money(summary.monthAllocation)}
              helper="Budget impact only; no second account deduction"
              icon="calendar"
              tone="indigo"
            />
            <StatCard
              label="Due This Month"
              value={money(summary.monthDue)}
              helper="Reimbursements not recorded yet"
              icon="arrow"
              tone="sky"
            />
            <StatCard
              label="Received This Month"
              value={money(summary.monthReceived)}
              helper="Transfers received, excluded from income"
              icon="check"
              tone="emerald"
            />
          </section>

          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-10 dark:border-white/10 dark:bg-slate-900/70">
              <Loader />
            </div>
          ) : plans.length === 0 ? (
            <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-slate-900/60 sm:p-12">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
                <Icon name="card" className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-black">No large purchases yet</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add a personal or shared purchase. Its full amount will change the real account balance immediately, while the monthly budget receives only scheduled portions.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20"
              >
                <Icon name="plus" /> Add First Purchase
              </button>
            </section>
          ) : (
            <section className="space-y-4">
              {plans.map((plan) => {
                const payerName = nameOf(plan.payerUserId, "Payer");
                const stats = plan.stats || {};
                const rows = plan.monthInstallments || [];

                return (
                  <article
                    key={plan._id}
                    className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70"
                  >
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
                              {plan.status}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {plan.purchaseType === "personal" ? "Personal" : "Shared"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Paid upfront by <strong>{payerName}</strong> from {plan.payerAccountId?.name || "account"} on {dateLabel(plan.purchaseDate)}.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white dark:bg-white dark:text-slate-950">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">
                              Purchase total
                            </p>
                            <p className="mt-1 text-lg font-black">{money(plan.totalAmount)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePlan(plan)}
                            className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                            title="Delete purchase"
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Schedule</p>
                          <p className="mt-2 font-black">{plan.months} months</p>
                          <p className="mt-1 text-xs text-slate-500">{monthLabel(plan.startMonth)} → {monthLabel(plan.endMonth)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Receivable</p>
                          <p className="mt-2 font-black">{money(stats.receivableTotal)}</p>
                          <p className="mt-1 text-xs text-slate-500">Other members’ total responsibility</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Received</p>
                          <p className="mt-2 font-black text-emerald-600 dark:text-emerald-300">{money(stats.paidAmount)}</p>
                          <p className="mt-1 text-xs text-slate-500">{stats.paidCount || 0} of {stats.paymentCount || 0} repayments</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Outstanding</p>
                          <p className="mt-2 font-black text-amber-600 dark:text-amber-300">{money(stats.outstanding)}</p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                              style={{ width: `${Math.min(100, Number(stats.progress || 0))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Member responsibility
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
                              <span className="ml-2 text-xs text-slate-500">≈ {money(share.monthlyAmount)}/month</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/45 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black">{monthLabel(month)} schedule</h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            The upfront payer’s own allocation affects the monthly budget. Another member’s portion is added to debt/spend only after Record Payment is completed.
                          </p>
                        </div>
                      </div>

                      {rows.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                          This purchase has no allocation in the selected month.
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 xl:grid-cols-2">
                          {rows.map((installment) => {
                            const member = installment.userId || memberMap.get(idOf(installment.userId));
                            const paid = installment.status === "paid";
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
                                      {allocationOnly ? "Budget allocated" : paid ? "Reimbursed" : "Payment due"}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {money(installment.amount)} · due {dateLabel(installment.dueDate)}
                                  </p>
                                  {paid && installment.fromAccountId ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {installment.fromAccountId.name} → {installment.toAccountId?.name || plan.payerAccountId?.name}
                                    </p>
                                  ) : null}
                                </div>

                                {!allocationOnly && !paid ? (
                                  <button
                                    type="button"
                                    onClick={() => openPayment(plan, installment)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/15"
                                  >
                                    <Icon name="arrow" /> Record Payment
                                  </button>
                                ) : null}

                                {!allocationOnly && paid ? (
                                  <button
                                    type="button"
                                    onClick={() => undoPayment(plan, installment)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                  >
                                    <Icon name="undo" /> Undo
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>

      <Modal open={createOpen} title="Add Shared or Large Purchase" onClose={() => setCreateOpen(false)} wide>
        <form onSubmit={createPurchase} className="space-y-5 p-4 sm:p-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
            The full amount will be deducted once from the selected payer account. The payer’s own share is allocated monthly; other members’ portions affect monthly debt/spend only when their payments are recorded.
          </div>

          {message ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              {message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Purchase title">
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="Air Conditioner"
              />
            </Field>
            <Field label="Total amount">
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
            <Field label="Purchase date">
              <input
                className={inputClass}
                type="date"
                value={form.purchaseDate}
                onChange={(event) => setForm((previous) => ({ ...previous, purchaseDate: event.target.value }))}
              />
            </Field>
            <Field label="Monthly allocation starts">
              <input
                className={inputClass}
                type="month"
                value={form.startMonth}
                onChange={(event) => setForm((previous) => ({ ...previous, startMonth: event.target.value }))}
              />
            </Field>
            <Field label="Distribute over months">
              <input
                className={inputClass}
                type="number"
                min="1"
                max="120"
                value={form.months}
                onChange={(event) => setForm((previous) => ({ ...previous, months: event.target.value }))}
              />
            </Field>
            <Field label="Expense category">
              <select
                className={inputClass}
                value={form.categoryId}
                onChange={(event) => setForm((previous) => ({ ...previous, categoryId: event.target.value }))}
              >
                <option value="">Use/Create Large Purchase</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Paid in full by">
              <select
                className={inputClass}
                value={form.payerUserId}
                onChange={(event) => setForm((previous) => ({ ...previous, payerUserId: event.target.value }))}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deduct full amount from account">
              <select
                className={inputClass}
                value={form.payerAccountId}
                onChange={(event) => setForm((previous) => ({ ...previous, payerAccountId: event.target.value }))}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.name} · {account.owner}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <p className={labelClass}>Purchase responsibility</p>
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
                <strong className="block">Personal purchase</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  The payer bears the full amount, distributed across the selected months.
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
                <strong className="block">Shared purchase</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Split responsibility and collect non-payer shares through scheduled transfers.
                </span>
              </button>
            </div>
          </div>

          {form.purchaseType === "shared" ? (
            <div className="rounded-[24px] border border-slate-200 p-4 dark:border-white/10 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black">Member split</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    The payer must remain included because part of the purchase belongs to them.
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
                    Equal
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, splitMode: "custom" }))}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      form.splitMode === "custom" ? "bg-white shadow dark:bg-slate-800" : "text-slate-500"
                    }`}
                  >
                    Custom
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
                        Approx. {money(Number(calculated?.shareAmount || 0) / Number(form.months || 1))} per month
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white dark:bg-white dark:text-slate-950">
                <span className="font-bold">Allocated {money(allocated)} of {money(total)}</span>
                <span className={`font-black ${remaining === 0 ? "text-emerald-300 dark:text-emerald-700" : "text-amber-300 dark:text-amber-700"}`}>
                  {remaining === 0 ? "Balanced" : `Remaining ${money(remaining)}`}
                </span>
              </div>
            </div>
          ) : null}

          <Field label="Note (optional)">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.note}
              onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))}
              placeholder="Warranty, model, agreement, or repayment note"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 dark:border-white/10 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create Purchase Schedule"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={payOpen} title="Record Member Reimbursement" onClose={() => setPayOpen(false)}>
        <form onSubmit={recordPayment} className="space-y-4 p-4 sm:p-6">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Payment</p>
            <p className="mt-2 text-lg font-black">{selectedPlan?.title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {nameOf(selectedInstallment?.userId)} pays {money(selectedInstallment?.amount)} to {nameOf(selectedPlan?.payerUserId, "payer")}.
            </p>
          </div>

          {message ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              {message}
            </div>
          ) : null}

          <Field label="Pay from account">
            <select
              className={inputClass}
              value={payForm.fromAccountId}
              onChange={(event) => setPayForm((previous) => ({ ...previous, fromAccountId: event.target.value }))}
            >
              <option value="">Select member account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} · {account.owner}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Receive into payer account">
            <select
              className={inputClass}
              value={payForm.toAccountId}
              onChange={(event) => setPayForm((previous) => ({ ...previous, toAccountId: event.target.value }))}
            >
              <option value="">Select receiving account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} · {account.owner}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Payment date">
            <input
              className={inputClass}
              type="date"
              value={payForm.paidDate}
              onChange={(event) => setPayForm((previous) => ({ ...previous, paidDate: event.target.value }))}
            />
          </Field>

          <Field label="Note (optional)">
            <input
              className={inputClass}
              value={payForm.note}
              onChange={(event) => setPayForm((previous) => ({ ...previous, note: event.target.value }))}
              placeholder="Cash, bank transfer, partial agreement…"
            />
          </Field>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            This creates an account-to-account transfer. It increases the payer’s account balance but is not counted as salary or regular income.
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPayOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "Recording…" : "Record Reimbursement"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
