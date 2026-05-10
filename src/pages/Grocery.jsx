import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function money(n) {
  const x = Number(n || 0);
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function bdt(n) {
  return `৳ ${money(n).toLocaleString("en-BD", {
    minimumFractionDigits: money(n) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function toLocalYMD(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function getName(value, fallback = "-") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.name || value.label || fallback;
}

function monthLabel(month) {
  if (!month) return "";
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function blankTxnItem(next = {}) {
  return {
    name: next.name || "",
    unit: next.unit || "pcs",
    qty: next.qty ?? 1,
    unitPrice: next.unitPrice ?? 0,
    note: next.note || "",
  };
}

const UNITS = ["pcs", "kg", "g", "lb", "liter", "ml", "pack", "bottle", "box", "dozen"];

const splitLabels = {
  equal: "Equal Split",
  personal: "Personal",
  ratio: "Ratio",
  fixed: "Fixed Amount",
};

const splitBadgeClass = {
  equal: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  personal: "bg-violet-50 text-violet-700 ring-violet-200",
  ratio: "bg-amber-50 text-amber-700 ring-amber-200",
  fixed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function Grocery() {
  const me = getUser();
  const currentUserId = String(me?.id || me?._id || "");

  const [month, setMonth] = useState(monthNow());
  const [day, setDay] = useState(dayNow());
  const [msg, setMsg] = useState("");

  const [members, setMembers] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [methods, setMethods] = useState([]);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paidByFilter, setPaidByFilter] = useState("");

  const [form, setForm] = useState({
    txnDate: new Date().toISOString().slice(0, 10),
    shopName: "",
    location: "",
    paymentMethodId: "",
    cardLabelId: "",
    categoryId: "",
    paidByUserId: "",
    fromAccountId: "",
    discountTotal: 0,
    deliveryFee: 0,
    vatAmount: 0,
    vatIncluded: true,
    note: "",

    splitType: "equal",
    personalUserId: "",
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
  });

  const [txnItems, setTxnItems] = useState([blankTxnItem()]);

  useEffect(() => {
    const selectedMonth = day.slice(0, 7);
    if (selectedMonth !== month) setMonth(selectedMonth);
  }, [day]);

  const otherMember = useMemo(
    () => members.find((m) => String(getId(m)) !== currentUserId) || null,
    [members, currentUserId]
  );

  const itemsSubtotal = useMemo(() => {
    let sum = 0;
    for (const it of txnItems) {
      sum += money(Number(it.qty || 0) * Number(it.unitPrice || 0));
    }
    return money(sum);
  }, [txnItems]);

  const totalPayable = useMemo(() => {
    let total =
      itemsSubtotal -
      Number(form.discountTotal || 0) +
      Number(form.deliveryFee || 0);

    if (!form.vatIncluded) {
      total += Number(form.vatAmount || 0);
    }

    return money(total);
  }, [
    itemsSubtotal,
    form.discountTotal,
    form.deliveryFee,
    form.vatAmount,
    form.vatIncluded,
  ]);

  const dayTxns = useMemo(() => {
    return (items || []).filter((t) => toLocalYMD(t.txnDate) === day);
  }, [items, day]);

  const filteredTxns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return dayTxns.filter((t) => {
      const categoryId = getId(t.categoryId);
      const paidById = getId(t.paidByUserId);

      if (categoryFilter && categoryId !== categoryFilter) return false;
      if (paidByFilter && paidById !== paidByFilter) return false;

      if (!q) return true;

      const itemText = (t.items || []).map((it) => it.name || "").join(" ");
      const searchable = [
        t.shopName,
        t.location,
        t.note,
        getName(t.categoryId, ""),
        getName(t.paidByUserId, ""),
        getName(t.fromAccountId, ""),
        itemText,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [dayTxns, search, categoryFilter, paidByFilter]);

  const monthlyStats = useMemo(() => {
    const monthTotal = (items || []).reduce(
      (sum, t) => sum + Number(t.totalPayable || 0),
      0
    );

    const dayTotal = dayTxns.reduce(
      (sum, t) => sum + Number(t.totalPayable || 0),
      0
    );

    const totalItemCount = (items || []).reduce(
      (sum, t) => sum + Number((t.items || []).length),
      0
    );

    const biggest = [...(items || [])].sort(
      (a, b) => Number(b.totalPayable || 0) - Number(a.totalPayable || 0)
    )[0];

    const avgTxn = items.length ? monthTotal / items.length : 0;

    return {
      monthTotal: money(monthTotal),
      dayTotal: money(dayTotal),
      totalItemCount,
      biggest,
      avgTxn: money(avgTxn),
      txnCount: items.length,
    };
  }, [items, dayTxns]);

  async function loadBasics() {
    setMsg("");
    try {
      const [mRes, exp, pm, cl, acc] = await Promise.all([
        api.get("/api/family/members"),
        api.get("/api/categories", { params: { kind: "expense" } }),
        api.get("/api/payment-methods"),
        api.get("/api/card-labels"),
        api.get("/api/accounts"),
      ]);

      setMembers(mRes.data.members || []);
      setExpenseCats(exp.data.items || []);
      setMethods(pm.data.items || []);
      setCards(cl.data.items || []);
      setAccounts(acc.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load setup data");
    }
  }

  async function loadMonth() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/grocery", { params: { month } });
      setItems(res.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load grocery data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBasics();
  }, []);

  useEffect(() => {
    loadMonth();
  }, [month]);

  function getDefaultForm(next = {}) {
    const defaultUser = getId(members?.[0]) || currentUserId || "";
    const defaultAccount = accounts?.[0]?._id || "";

    return {
      txnDate: next.txnDate || day || dayNow(),
      shopName: next.shopName || "",
      location: next.location || "",
      paymentMethodId: next.paymentMethodId || "",
      cardLabelId: next.cardLabelId || "",
      categoryId: next.categoryId || "",
      paidByUserId: next.paidByUserId || defaultUser,
      fromAccountId: next.fromAccountId || defaultAccount,
      discountTotal: next.discountTotal ?? 0,
      deliveryFee: next.deliveryFee ?? 0,
      vatAmount: next.vatAmount ?? 0,
      vatIncluded: next.vatIncluded ?? true,
      note: next.note || "",

      splitType: next.splitType || "equal",
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
    setTxnItems([blankTxnItem()]);
    setOpen(true);
  }

  function openEditModal(txn) {
    setMsg("");
    setIsEditing(true);
    setEditId(txn._id);

    setForm(
      getDefaultForm({
        txnDate: toLocalYMD(txn.txnDate),
        shopName: txn.shopName || "",
        location: txn.location || "",
        paymentMethodId: getId(txn.paymentMethodId),
        cardLabelId: getId(txn.cardLabelId),
        categoryId: getId(txn.categoryId),
        paidByUserId: getId(txn.paidByUserId),
        fromAccountId: getId(txn.fromAccountId),
        discountTotal: txn.discountTotal ?? 0,
        deliveryFee: txn.deliveryFee ?? 0,
        vatAmount: txn.vatAmount ?? 0,
        vatIncluded: txn.vatIncluded ?? true,
        note: txn.note || "",
        splitType: txn.split?.type || "equal",
        personalUserId: getId(txn.split?.personalUserId) || getId(txn.paidByUserId),
      })
    );

    setTxnItems(
      (txn.items || []).length
        ? (txn.items || []).map((it) =>
            blankTxnItem({
              name: it.name || "",
              unit: it.unit || "pcs",
              qty: it.qty ?? 1,
              unitPrice: it.unitPrice ?? 0,
              note: it.note || "",
            })
          )
        : [blankTxnItem()]
    );

    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setIsEditing(false);
    setEditId(null);
    setMsg("");
  }

  function addItemRow() {
    setTxnItems([...txnItems, blankTxnItem()]);
  }

  function removeItemRow(idx) {
    if (txnItems.length === 1) return;
    setTxnItems(txnItems.filter((_, i) => i !== idx));
  }

  function updateItem(idx, key, val) {
    const copy = [...txnItems];
    copy[idx] = { ...copy[idx], [key]: val };
    setTxnItems(copy);
  }

  async function saveTxn() {
    setMsg("");
    try {
      if (!form.categoryId) return setMsg("Select expense category");
      if (!form.paidByUserId) return setMsg("Select Paid By");
      if (!form.fromAccountId) return setMsg("Select From Account");
      if (txnItems.some((x) => !String(x.name || "").trim())) {
        return setMsg("Every item must have a name");
      }
      if (txnItems.some((x) => Number(x.qty || 0) <= 0)) {
        return setMsg("Every item quantity must be greater than 0");
      }
      if (txnItems.some((x) => Number(x.unitPrice || 0) < 0)) {
        return setMsg("Unit price cannot be negative");
      }
      if (totalPayable <= 0) return setMsg("Total payable must be greater than 0");

      let split = { type: form.splitType };

      if (form.splitType === "personal") {
        if (!form.personalUserId) return setMsg("Select Personal For");
        split.personalUserId = form.personalUserId;
      }

      if (form.splitType === "ratio") {
        if (!otherMember) return setMsg("Need 2 members for ratio split");

        const ratioMe = Number(form.ratioMe || 0);
        const ratioOther = Number(form.ratioOther || 0);

        if (money(ratioMe + ratioOther) !== 100) {
          return setMsg("Ratio split must sum to 100");
        }

        split.ratios = [
          { userId: currentUserId, ratio: ratioMe },
          { userId: getId(otherMember), ratio: ratioOther },
        ];
      }

      if (form.splitType === "fixed") {
        if (!otherMember) return setMsg("Need 2 members for fixed split");

        const fixedMe = Number(form.fixedMe || 0);
        const fixedOther = Number(form.fixedOther || 0);

        if (money(fixedMe + fixedOther) !== money(totalPayable)) {
          return setMsg("Fixed split must sum to total payable");
        }

        split.fixed = [
          { userId: currentUserId, amount: fixedMe },
          { userId: getId(otherMember), amount: fixedOther },
        ];
      }

      const payload = {
        txnDate: form.txnDate,
        shopName: form.shopName,
        location: form.location,
        paymentMethodId: form.paymentMethodId || null,
        cardLabelId: form.cardLabelId || null,
        categoryId: form.categoryId,
        paidByUserId: form.paidByUserId,
        fromAccountId: form.fromAccountId,
        discountTotal: Number(form.discountTotal || 0),
        deliveryFee: Number(form.deliveryFee || 0),
        vatAmount: Number(form.vatAmount || 0),
        vatIncluded: !!form.vatIncluded,
        note: form.note,
        items: txnItems.map((it) => ({
          name: String(it.name || "").trim(),
          unit: it.unit || "pcs",
          qty: Number(it.qty || 0),
          unitPrice: Number(it.unitPrice || 0),
          note: it.note || "",
        })),
        split,
      };

      if (isEditing && editId) {
        await api.put(`/api/grocery/${editId}`, payload);
      } else {
        await api.post("/api/grocery", payload);
      }

      const nextMonth = String(form.txnDate || "").slice(0, 7);
      const nextDay = form.txnDate || day;

      closeModal();
      setDay(nextDay);

      if (nextMonth && nextMonth !== month) {
        setMonth(nextMonth);
      } else {
        await loadMonth();
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || (isEditing ? "Update failed" : "Save failed"));
    }
  }

  function deleteTxn(id) {
    setDeleteId(id);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);
    try {
      await api.delete(`/api/grocery/${deleteId}`);
      await loadMonth();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setDeleteId(null);
    }
  }

  function lineTotal(it) {
    if (it?.lineTotal !== undefined && it?.lineTotal !== null) {
      return money(it.lineTotal);
    }
    return money(Number(it?.qty || 0) * Number(it?.unitPrice || 0));
  }

  return (
    <AppLayout>
      <div className="w-full max-w-full overflow-x-hidden bg-slate-50/60 px-0 pb-8">
        <ConfirmModal
          open={confirmOpen}
          title="Delete Grocery Transaction"
          message="Are you sure you want to delete this grocery transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        <div className="space-y-5">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[28px] border border-white/40 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white shadow-xl shadow-emerald-900/10 sm:p-6 lg:p-7">
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-20 left-16 h-56 w-56 rounded-full bg-lime-300/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
                  <span className="h-2 w-2 rounded-full bg-lime-300" />
                  Grocery tracker
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                  Grocery Transactions
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">
                  Add receipt-style grocery entries, calculate payable amount, and keep member-wise split records clean.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:w-[520px]">
                <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur">
                  <div className="text-xs text-emerald-50">Month Total</div>
                  <div className="mt-1 text-2xl font-black">{bdt(monthlyStats.monthTotal)}</div>
                  <div className="mt-1 text-xs text-emerald-50">{monthLabel(month)}</div>
                </div>

                <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur">
                  <div className="text-xs text-emerald-50">Selected Day</div>
                  <div className="mt-1 text-2xl font-black">{bdt(monthlyStats.dayTotal)}</div>
                  <div className="mt-1 text-xs text-emerald-50">
                    {filteredTxns.length} shown transaction(s)
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Top controls */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Control Center</h3>
                <p className="text-sm text-slate-500">
                  Choose a month and date, then add or review daily grocery transactions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[660px]">
                <input
                  type="month"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />

                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />

                <button
                  onClick={openModal}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  + Add Transaction
                </button>
              </div>
            </div>
          </section>

          {msg && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {msg}
            </div>
          )}

          {/* Stats */}
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                    Transactions
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-slate-950">
                    {monthlyStats.txnCount}
                  </h4>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl">
                  🧾
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Total grocery entries this month</p>
            </div>

            <div className="rounded-[24px] border border-cyan-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                    Total Items
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-slate-950">
                    {monthlyStats.totalItemCount}
                  </h4>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-xl">
                  🛒
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Item rows recorded in receipts</p>
            </div>

            <div className="rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                    Average
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-slate-950">
                    {bdt(monthlyStats.avgTxn)}
                  </h4>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl">
                  📊
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Average payable per transaction</p>
            </div>

            <div className="rounded-[24px] border border-amber-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                    Biggest Bill
                  </p>
                  <h4 className="mt-2 truncate text-xl font-black text-slate-950">
                    {monthlyStats.biggest ? bdt(monthlyStats.biggest.totalPayable) : "৳ 0"}
                  </h4>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-xl">
                  🔥
                </div>
              </div>
              <p className="mt-3 truncate text-xs text-slate-500">
                {monthlyStats.biggest?.shopName || "No transaction yet"}
              </p>
            </div>
          </section>

          {/* Filters */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search shop, item, account, note..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All categories</option>
                  {expenseCats.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Paid By
                </label>
                <select
                  value={paidByFilter}
                  onChange={(e) => setPaidByFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All members</option>
                  {members.map((m) => (
                    <option key={getId(m)} value={getId(m)}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setDay(dayNow());
                    setSearch("");
                    setCategoryFilter("");
                    setPaidByFilter("");
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Today + Reset
                </button>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Transactions on {day}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Showing {filteredTxns.length} of {dayTxns.length} transaction(s) for the selected day.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                  Daily total: {bdt(monthlyStats.dayTotal)}
                </div>
              </div>
            </div>

            {loading ? (
              <Loader text="Loading grocery data" subtext="Preparing your entries" />
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-3xl">
                  🛒
                </div>
                <h4 className="mt-4 text-lg font-black text-slate-950">No grocery data yet</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first grocery transaction to start tracking.
                </p>
                <button
                  onClick={openModal}
                  className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  + Add Transaction
                </button>
              </div>
            ) : filteredTxns.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-3xl">
                  🔎
                </div>
                <h4 className="mt-4 text-lg font-black text-slate-950">No matching transaction</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Change the date, search text, or filters to see more results.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTxns.map((t) => {
                  const splitType = t.split?.type || "equal";
                  return (
                    <article key={t._id} className="p-4 transition hover:bg-slate-50/70 sm:p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg text-white shadow-sm">
                              🛍️
                            </span>
                            <div className="min-w-0">
                              <h4 className="truncate text-base font-black text-slate-950 sm:text-lg">
                                {t.shopName || "Grocery Transaction"}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {toLocalYMD(t.txnDate)} • {t.location || "No location"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                              <span className="block text-slate-400">Category</span>
                              <strong className="text-slate-800">{getName(t.categoryId)}</strong>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                              <span className="block text-slate-400">Paid By</span>
                              <strong className="text-slate-800">{getName(t.paidByUserId)}</strong>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                              <span className="block text-slate-400">From Account</span>
                              <strong className="text-slate-800">{getName(t.fromAccountId)}</strong>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                              <span className="block text-slate-400">Split</span>
                              <strong
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${
                                  splitBadgeClass[splitType] || splitBadgeClass.equal
                                }`}
                              >
                                {splitLabels[splitType] || splitType}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:items-end">
                          <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-700 px-5 py-4 text-white shadow-lg shadow-slate-900/10">
                            <div className="text-xs text-slate-300">Total Payable</div>
                            <div className="text-2xl font-black">{bdt(t.totalPayable)}</div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
                            <button
                              onClick={() => openEditModal(t)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTxn(t._id)}
                              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop table */}
                      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-slate-100 md:block">
                        <table className="w-full min-w-[680px] text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr className="text-left">
                              <th className="p-3">Item</th>
                              <th className="p-3">Qty</th>
                              <th className="p-3">Unit</th>
                              <th className="p-3">Unit Price</th>
                              <th className="p-3 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(t.items || []).map((it, idx) => (
                              <tr key={it._id || idx}>
                                <td className="p-3 font-semibold text-slate-800">{it.name}</td>
                                <td className="p-3 text-slate-600">{it.qty}</td>
                                <td className="p-3 text-slate-600">{it.unit}</td>
                                <td className="p-3 text-slate-600">{bdt(it.unitPrice)}</td>
                                <td className="p-3 text-right font-black text-slate-950">
                                  {bdt(lineTotal(it))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="mt-5 space-y-2 md:hidden">
                        {(t.items || []).map((it, idx) => (
                          <div
                            key={it._id || idx}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900">{it.name}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {it.qty} {it.unit} × {bdt(it.unitPrice)}
                                </div>
                              </div>
                              <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 ring-1 ring-slate-200">
                                {bdt(lineTotal(it))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          Subtotal: <strong className="text-slate-800">{bdt(t.itemsSubtotal)}</strong>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          Txn Discount:{" "}
                          <strong className="text-slate-800">{bdt(t.discountTotal)}</strong>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          Delivery: <strong className="text-slate-800">{bdt(t.deliveryFee)}</strong>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          VAT: <strong className="text-slate-800">{bdt(t.vatAmount)}</strong>{" "}
                          ({t.vatIncluded ? "included" : "added"})
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {open && (
          <div className="app-modal-overlay">
            <div className="app-modal-panel max-h-[92vh] max-w-6xl overflow-y-auto rounded-[28px] border border-white/50 bg-white p-0 shadow-2xl">
              <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                      {isEditing ? "Update receipt" : "New receipt"}
                    </div>
                    <h3 className="text-xl font-black text-slate-950">
                      {isEditing ? "Edit Grocery Transaction" : "Add Grocery Transaction"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Add only essential item details: name, unit, quantity, and unit price.
                    </p>
                  </div>

                  <button
                    onClick={closeModal}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-5 rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.txnDate}
                        onChange={(e) => setForm({ ...form, txnDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Shop
                      </label>
                      <input
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.shopName}
                        onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                        placeholder="e.g., Agora, Local Shop"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Location
                      </label>
                      <input
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Expense Category
                      </label>
                      <select
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      >
                        <option value="">Select</option>
                        {expenseCats.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Paid By
                      </label>
                      <select
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.paidByUserId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            paidByUserId: e.target.value,
                            personalUserId:
                              form.splitType === "personal" ? e.target.value : form.personalUserId,
                          })
                        }
                      >
                        {members.map((m) => (
                          <option key={getId(m)} value={getId(m)}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        From Account
                      </label>
                      <select
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.fromAccountId}
                        onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                      >
                        <option value="">Select</option>
                        {accounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Payment Method
                      </label>
                      <select
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.paymentMethodId}
                        onChange={(e) => setForm({ ...form, paymentMethodId: e.target.value })}
                      >
                        <option value="">Optional</option>
                        {methods.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Card Label
                      </label>
                      <select
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.cardLabelId}
                        onChange={(e) => setForm({ ...form, cardLabelId: e.target.value })}
                      >
                        <option value="">Optional</option>
                        {cards.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.label}
                            {c.last4 ? ` (${c.last4})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 xl:col-span-4">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Note
                      </label>
                      <input
                        className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Optional note"
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-5 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-black text-slate-950">Receipt Items</h4>
                      <p className="text-sm text-slate-500">
                        Brand, item discount, start date, and end date are removed.
                      </p>
                    </div>

                    <button
                      onClick={addItemRow}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Desktop item table */}
                  <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 lg:block">
                    <table className="w-full min-w-[780px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr className="text-left">
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3">Qty</th>
                          <th className="p-3">Unit Price</th>
                          <th className="p-3">Line Total</th>
                          <th className="p-3 text-center">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {txnItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-3">
                              <input
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                value={it.name}
                                onChange={(e) => updateItem(idx, "name", e.target.value)}
                                placeholder="Rice, Oil, Milk..."
                              />
                            </td>

                            <td className="p-3">
                              <select
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                value={it.unit}
                                onChange={(e) => updateItem(idx, "unit", e.target.value)}
                              >
                                {UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                value={it.qty}
                                onChange={(e) => updateItem(idx, "qty", e.target.value)}
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                value={it.unitPrice}
                                onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                              />
                            </td>

                            <td className="p-3 font-black text-slate-950">
                              {bdt(Number(it.qty || 0) * Number(it.unitPrice || 0))}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() => removeItemRow(idx)}
                                className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={txnItems.length === 1}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / tablet item cards */}
                  <div className="space-y-3 lg:hidden">
                    {txnItems.map((it, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="font-black text-slate-950">Item {idx + 1}</div>
                          <button
                            onClick={() => removeItemRow(idx)}
                            disabled={txnItems.length === 1}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Item Name
                            </label>
                            <input
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              value={it.name}
                              onChange={(e) => updateItem(idx, "name", e.target.value)}
                              placeholder="Rice, Oil, Milk..."
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Unit
                            </label>
                            <select
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              value={it.unit}
                              onChange={(e) => updateItem(idx, "unit", e.target.value)}
                            >
                              {UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              value={it.qty}
                              onChange={(e) => updateItem(idx, "qty", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              value={it.unitPrice}
                              onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                            />
                          </div>

                          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Line Total
                            </div>
                            <div className="mt-1 text-lg font-black text-slate-950">
                              {bdt(Number(it.qty || 0) * Number(it.unitPrice || 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Items Subtotal
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-950">
                      {bdt(itemsSubtotal)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Transaction Discount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      value={form.discountTotal}
                      onChange={(e) => setForm({ ...form, discountTotal: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Delivery Fee
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      value={form.deliveryFee}
                      onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      VAT Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      value={form.vatAmount}
                      onChange={(e) => setForm({ ...form, vatAmount: e.target.value })}
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white p-4 lg:col-span-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.vatIncluded}
                      onChange={(e) => setForm({ ...form, vatIncluded: e.target.checked })}
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-800">
                        VAT already included in item prices
                      </span>
                      <span className="text-xs text-slate-500">
                        Uncheck this if VAT should be added with total payable.
                      </span>
                    </span>
                  </label>

                  <div className="rounded-[24px] bg-gradient-to-br from-slate-950 to-emerald-800 p-4 text-white lg:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-100">
                      Total Payable
                    </div>
                    <div className="mt-2 text-3xl font-black">{bdt(totalPayable)}</div>
                  </div>
                </div>

                {/* Split */}
                <div className="mb-5 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex flex-col gap-1">
                    <h4 className="text-base font-black text-slate-950">Split Details</h4>
                    <p className="text-sm text-slate-500">
                      This split will be reflected in the ledger summary automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Split Type
                      </label>
                      <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        value={form.splitType}
                        onChange={(e) => setForm({ ...form, splitType: e.target.value })}
                      >
                        <option value="equal">Equal</option>
                        <option value="personal">Personal</option>
                        <option value="ratio">Ratio</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    {form.splitType === "personal" && (
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Personal For
                        </label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                          value={form.personalUserId}
                          onChange={(e) =>
                            setForm({ ...form, personalUserId: e.target.value })
                          }
                        >
                          {members.map((m) => (
                            <option key={getId(m)} value={getId(m)}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.splitType === "ratio" && otherMember && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            My %
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            value={form.ratioMe}
                            onChange={(e) => setForm({ ...form, ratioMe: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            {otherMember.name} %
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            value={form.ratioOther}
                            onChange={(e) =>
                              setForm({ ...form, ratioOther: e.target.value })
                            }
                          />
                        </div>
                        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-100 sm:col-span-2 xl:col-span-4">
                          Ratio values must sum to 100.
                        </div>
                      </>
                    )}

                    {form.splitType === "fixed" && otherMember && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            My Amount
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            value={form.fixedMe}
                            onChange={(e) => setForm({ ...form, fixedMe: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            {otherMember.name} Amount
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            value={form.fixedOther}
                            onChange={(e) =>
                              setForm({ ...form, fixedOther: e.target.value })
                            }
                          />
                        </div>
                        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-100 sm:col-span-2 xl:col-span-4">
                          Fixed amounts must sum to the total payable.
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      onClick={closeModal}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTxn}
                      className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:w-auto"
                    >
                      {isEditing ? "Update Transaction" : "Save Transaction"}
                    </button>
                  </div>

                  {msg && (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {msg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}