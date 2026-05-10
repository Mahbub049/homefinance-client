import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v._id || v.id || "");
  return String(v);
}

function safeDate(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function percentage(value, total) {
  const v = Number(value || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.min(100, Math.max(0, Math.round((v / t) * 100)));
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (s === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (s === "active") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (s === "closed") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function splitLabel(value) {
  const v = String(value || "equal").toLowerCase();
  if (v === "personal") return "Personal";
  if (v === "ratio") return "Ratio";
  if (v === "fixed") return "Fixed";
  return "Equal";
}

function splitMonthlyAmount(plan, members) {
  const total = Number(plan?.monthlyAmount || 0);
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

    return validFixed.map((f, index) => {
      const person = members.find((m) => normalizeId(m.id || m._id) === f.userId);

      return {
        key: `${f.userId}-${index}`,
        userId: f.userId,
        name: person?.name || "Unknown",
        amount: Math.round(f.amount * 100) / 100,
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

function StatCard({ label, value, helper, accent = "from-sky-500 to-indigo-600" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-15`} />
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </div>
        <div className="mt-2 text-2xl font-black text-slate-950 break-words">{value}</div>
        {helper && <div className="mt-1 text-xs text-slate-500 break-words">{helper}</div>}
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 ${extra}`;
}

export default function EMI() {
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

  const monthOptions = [1, 3, 6, 9, 12, 18, 24, 36];

  const [form, setForm] = useState({
    productName: "",
    brand: "",
    category: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
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
    paidByUserId: myId || "",
    fromAccountId: "",
    paidDate: new Date().toISOString().slice(0, 10),
  });

  const otherMember = useMemo(
    () => members.find((m) => normalizeId(m.id || m._id) !== myId) || null,
    [members, myId]
  );

  const payableAccounts = useMemo(
    () => accounts.filter((a) => ["cash", "bank", "wallet"].includes(a.type)),
    [accounts]
  );

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
    const res = await api.get("/api/emi/installments", { params: { month } });
    setInstallments(res.data.items || []);
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
    setMsg("");
    setForm((f) => ({
      ...f,
      productName: "",
      brand: "",
      category: "",
      purchaseDate: new Date().toISOString().slice(0, 10),
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

      await api.post("/api/emi/plans", payload);
      closeModal();
      await loadPlans();
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
      const isActive = String(plan?.status || "") === "active";
      const inThisMonth = monthInRange(month, plan?.startMonth, plan?.endMonth);

      if (!isActive || !inThisMonth) return;

      const parts = splitMonthlyAmount(plan, members);

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
        (p) => String(p?.status || "") === "active" && monthInRange(month, p?.startMonth, p?.endMonth)
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
        `Created ${res.data.createdCount} EMI bill(s) for ${month}` +
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
          ? `Created EMI bill for ${productName} in ${month}` +
          (catName ? ` (Category: ${catName})` : "")
          : `EMI bill already exists for ${productName} in ${month}`
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
    } catch (e) {
      setMsg(e?.response?.data?.message || "Status update failed");
    }
  }

  function openPayModalForInstallment(item) {
    const defaultAccount = payableAccounts[0]?._id || "";
    setSelectedInstallment(item);
    setPayForm({
      paidByUserId: myId || members[0]?.id || "",
      fromAccountId: defaultAccount,
      paidDate: item?.dueDate
        ? new Date(item.dueDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
    setPayModalOpen(true);
  }

  function closePayModal() {
    setPayModalOpen(false);
    setSelectedInstallment(null);
  }

  async function confirmMarkPaid() {
    if (!selectedInstallment?._id) return;
    if (!payForm.paidByUserId) return setMsg("Select who is paying");
    if (!payForm.fromAccountId) return setMsg("Select which account is paying");

    try {
      await api.put(`/api/emi/installments/${selectedInstallment._id}/status`, {
        status: "paid",
        paidByUserId: payForm.paidByUserId,
        fromAccountId: payForm.fromAccountId,
        paidDate: payForm.paidDate,
      });
      closePayModal();
      await loadInstallments();
      await loadPlans();
      setMsg("EMI marked paid and deducted from selected account");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Update failed");
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

  async function deleteInstallment(id) {
    const ok = confirm("Delete this installment?");
    if (!ok) return;

    try {
      await api.delete(`/api/emi/installments/${id}`);
      await loadInstallments();
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  function renderMonthlySplit(plan) {
    const items = splitMonthlyAmount(plan, members);

    if (!items.length) {
      return <div className="text-xs text-slate-500">Split info missing</div>;
    }

    return (
      <div className="space-y-2">
        {items.map((item) => {
          const bar = percentage(item.amount, Number(plan?.monthlyAmount || 0));

          return (
            <div key={item.key} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                <span className="font-black text-slate-950">৳ {money(item.amount)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
                  style={{ width: `${bar}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-indigo-50/70 px-3 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-800 p-5 text-white shadow-xl sm:p-6 lg:p-7">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="absolute bottom-0 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 backdrop-blur">
                  EMI Planner
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Manage monthly installments clearly
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Create EMI plans, generate monthly bills, track who needs to pay, and mark payments from the selected account.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Selected Month
                  </label>
                  <input
                    type="month"
                    className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-white/20 xl:w-48"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>

                <button
                  onClick={openModal}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  + Add EMI Plan
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Combined EMI To Pay"
              value={`৳ ${money(monthlyCombinedTotal)}`}
              helper={`Total active EMI liability in ${month}`}
              accent="from-emerald-400 to-teal-600"
            />
            <StatCard
              label="Active Plans"
              value={activePlansThisMonth.length}
              helper="Plans active in selected month"
              accent="from-sky-400 to-blue-600"
            />
            <StatCard
              label="Pending Bills"
              value={`৳ ${money(installmentStats.pending)}`}
              helper={`${installmentStats.pendingCount} pending installment(s)`}
              accent="from-amber-400 to-orange-600"
            />
            <StatCard
              label="Paid This Month"
              value={`৳ ${money(installmentStats.paid)}`}
              helper={`${installmentStats.paidCount} paid installment(s)`}
              accent="from-violet-400 to-fuchsia-600"
            />
          </section>

          {msg && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 shadow-sm break-words">
              {msg}
            </div>
          )}

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-sky-50 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-black text-slate-950">Monthly EMI Bills</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Generate pending installment rows for all active plans in {month}.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Expense category used: <b>{emiExpenseCategoryId ? "EMI" : "Not selected"}</b>
                  </p>
                </div>

                <button
                  onClick={generateMonth}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Create EMI Bills
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Created Bills
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950">{installments.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Collection Progress
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-950">{installmentStats.progress}%</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                      style={{ width: `${installmentStats.progress}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Next Due
                  </div>
                  <div className="mt-2 text-base font-black text-slate-950 break-words">
                    {nextDueInstallment?.planId?.productName || "No pending due"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {nextDueInstallment ? safeDate(nextDueInstallment.dueDate) : "All clear"}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50 p-5">
                <div className="text-lg font-black text-slate-950">EMI Liability by Person</div>
                <p className="mt-1 text-sm text-slate-600">
                  Split-aware monthly payable amount for {month}.
                </p>
              </div>

              <div className="p-5">
                {monthlyPersonTotals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No active EMI liability for this month.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthlyPersonTotals.map((item) => {
                      const share = percentage(item.amount, monthlyCombinedTotal);

                      return (
                        <div key={item.userId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-black text-slate-950 break-words">{item.name}</div>
                              <div className="text-xs text-slate-500">{share}% of this month</div>
                            </div>
                            <div className="text-xl font-black text-emerald-700">৳ {money(item.amount)}</div>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
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
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-white via-indigo-50 to-sky-50 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-lg font-black text-slate-950">EMI Plans</div>
                <p className="mt-1 text-sm text-slate-600">
                  Product-wise installment plans, progress, split details, and monthly bill creation.
                </p>
              </div>
              <div className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                {plans.length} plan(s)
              </div>
            </div>

            {plans.length === 0 ? (
              <div className="p-6">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="text-3xl">🧾</div>
                  <div className="mt-2 text-base font-black text-slate-900">No EMI plans yet</div>
                  <p className="mt-1 text-sm text-slate-500">
                    Add your first EMI plan to calculate monthly payables automatically.
                  </p>
                  <button
                    onClick={openModal}
                    className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                  >
                    + Add EMI Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2 2xl:grid-cols-3">
                {plans.map((p) => {
                  const progress = Math.min(100, Math.max(0, Number(p?.stats?.progress || 0)));
                  const canCreateBill =
                    p.status === "active" && month >= p.startMonth && month <= p.endMonth;

                  return (
                    <div key={p._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="bg-gradient-to-br from-slate-950 via-indigo-900 to-sky-800 p-4 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-lg font-black break-words">{p.productName}</div>
                            <div className="mt-1 text-xs text-slate-200 break-words">
                              {p.brand || "No brand"} {p.category ? `• ${p.category}` : ""}
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(p.status)}`}>
                            {p.status || "-"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                            <div className="text-xs text-slate-300">Monthly</div>
                            <div className="mt-1 text-xl font-black">৳ {money(p.monthlyAmount)}</div>
                          </div>
                          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                            <div className="text-xs text-slate-300">Total</div>
                            <div className="mt-1 text-xl font-black">৳ {money(p.totalPayable)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Term</div>
                            <div className="mt-1 font-black text-slate-950">{p.months} months</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining</div>
                            <div className="mt-1 font-black text-slate-950">৳ {money(p?.stats?.remaining ?? 0)}</div>
                            <div className="text-[11px] text-slate-500">{p?.stats?.remainingMonths ?? "-"} mo left</div>
                          </div>
                          <div className="col-span-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</div>
                                <div className="mt-1 font-black text-slate-950">{p.startMonth} → {p.endMonth}</div>
                              </div>
                              <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                                {splitLabel(p?.splitType)} split
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wide text-slate-500">Payment Progress</span>
                            <span className="font-black text-slate-800">{progress}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {Number(p?.stats?.behindBy || 0) > 0 && (
                            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                              Behind: ৳ {money(p.stats.behindBy)}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Who Pays Monthly
                          </div>
                          {renderMonthlySplit(p)}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          {canCreateBill && (
                            <button
                              onClick={() => generateSinglePlan(p._id, p.productName)}
                              className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                            >
                              Create Bill
                            </button>
                          )}

                          {p.status === "active" ? (
                            <button
                              onClick={() => setStatus(p._id, "closed")}
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              Close Plan
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatus(p._id, "active")}
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              Reopen Plan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-white to-amber-50 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-lg font-black text-slate-950">Installments ({month})</div>
                <p className="mt-1 text-sm text-slate-600">
                  Mark monthly installments paid or pending. Paid installments deduct from selected account.
                </p>
              </div>
              <div className="rounded-full border border-amber-100 bg-white px-3 py-1 text-xs font-bold text-amber-700">
                Total generated: {installments.length}
              </div>
            </div>

            {installments.length === 0 ? (
              <div className="p-6">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No installments generated for this month. Use <b>Create EMI Bills</b> first.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {installments.map((i) => {
                  const paid = String(i.status || "").toLowerCase() === "paid";

                  return (
                    <div key={i._id} className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="font-black text-slate-950 break-words">
                          {i?.planId?.productName || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Generated EMI installment for {month}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 lg:bg-transparent lg:p-0 lg:ring-0">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount</div>
                        <div className="mt-1 text-lg font-black text-slate-950">৳ {money(i.amount)}</div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 lg:bg-transparent lg:p-0 lg:ring-0">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Due Date</div>
                        <div className="mt-1 font-bold text-slate-700">{safeDate(i.dueDate)}</div>
                      </div>

                      <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(i.status)}`}>
                          {i.status || "-"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                        {paid ? (
                          <button
                            onClick={() => setInstallmentStatus(i._id, "pending")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Mark Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => openPayModalForInstallment(i)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          onClick={() => deleteInstallment(i._id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {payModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
                <div className="text-xl font-black">Mark EMI as Paid</div>
                <p className="mt-1 text-sm text-emerald-50">
                  {selectedInstallment?.planId?.productName || "This installment"} will create an expense transaction and deduct the selected account.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Who is paying" className="sm:col-span-2">
                    <select
                      className={inputClass()}
                      value={payForm.paidByUserId}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, paidByUserId: e.target.value }))
                      }
                    >
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="From which account" className="sm:col-span-2">
                    <select
                      className={inputClass()}
                      value={payForm.fromAccountId}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, fromAccountId: e.target.value }))
                      }
                    >
                      <option value="">Select account</option>
                      {payableAccounts.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Payment Date" className="sm:col-span-2">
                    <input
                      type="date"
                      className={inputClass()}
                      value={payForm.paidDate}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, paidDate: e.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-emerald-700">Payment Amount</span>
                    <span className="text-2xl font-black text-emerald-800">
                      ৳ {money(selectedInstallment?.amount || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={closePayModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmMarkPaid}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">
              <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-800 p-5 text-white sm:p-6">
                <div className="text-2xl font-black">Add EMI Plan</div>
                <p className="mt-1 max-w-2xl text-sm text-slate-200">
                  Enter product, pricing, schedule, and split details. Monthly amount will be calculated automatically.
                </p>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950">Product Details</div>
                      <div className="text-xs text-slate-500">Basic purchase information</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      Step 1
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Product Name" className="sm:col-span-2">
                      <input
                        className={inputClass()}
                        value={form.productName}
                        onChange={(e) => setForm({ ...form, productName: e.target.value })}
                        placeholder="Example: Mobile phone"
                      />
                    </Field>

                    <Field label="Brand">
                      <input
                        className={inputClass()}
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="Example: Samsung"
                      />
                    </Field>

                    <Field label="Category">
                      <input
                        className={inputClass()}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        placeholder="Example: Electronics"
                      />
                    </Field>

                    <Field label="Purchase Date">
                      <input
                        type="date"
                        className={inputClass()}
                        value={form.purchaseDate}
                        onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                      />
                    </Field>

                    <Field label="Start Month">
                      <input
                        type="month"
                        className={inputClass()}
                        value={form.startMonth}
                        onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                      />
                    </Field>

                    <Field label="Months">
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

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950">EMI Calculation</div>
                      <div className="text-xs text-slate-500">Total payable is auto calculated</div>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                      Step 2
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Original Price">
                      <input
                        className={inputClass()}
                        value={form.originalPrice}
                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                        placeholder="Example: 60000"
                      />
                    </Field>

                    <Field label="EMI Charge (%)">
                      <input
                        className={inputClass()}
                        value={form.emiCharge}
                        onChange={(e) => setForm({ ...form, emiCharge: e.target.value })}
                        placeholder="Example: 0.9"
                      />
                      <div className="mt-1 text-xs text-slate-500">
                        Example: <b>0.9</b> means <b>0.9%</b> charge.
                      </div>
                    </Field>

                    <Field label="Total Payable">
                      <input
                        className={inputClass("bg-slate-50 font-black text-slate-950")}
                        value={form.totalPayable}
                        readOnly
                        title="Auto calculated = Original Price + (Original Price × EMI Charge%)"
                      />
                    </Field>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 md:col-span-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                            Estimated Monthly EMI
                          </div>
                          <div className="mt-1 text-sm text-emerald-700">
                            Based on total payable and selected months.
                          </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-800">
                          ৳ {money(Number(form.totalPayable || 0) / Number(form.months || 1))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950">Split Settings</div>
                      <div className="text-xs text-slate-500">Decide who will carry this EMI liability</div>
                    </div>
                    <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-100">
                      Step 3
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Split Type" className="sm:col-span-2">
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
                        <option value="equal">Equal</option>
                        <option value="personal">Personal</option>
                        <option value="ratio">Ratio</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </Field>

                    {form.splitType === "personal" && (
                      <Field label="Personal For" className="sm:col-span-2">
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
                        <Field label="My %">
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

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800 sm:col-span-2 lg:col-span-4">
                          Ratio split should normally sum to 100.
                        </div>
                      </>
                    )}

                    {form.splitType === "fixed" && otherMember && (
                      <>
                        <Field label="My Amount">
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

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800 sm:col-span-2 lg:col-span-4">
                          Fixed amounts should match the monthly amount.
                        </div>
                      </>
                    )}

                    <Field label="Note" className="sm:col-span-2 lg:col-span-4">
                      <input
                        className={inputClass()}
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Optional note"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPlan}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700"
                  >
                    Save Plan
                  </button>
                </div>

                {msg && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 break-words">{msg}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
