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

function money(n) {
  const x = Number(n || 0);
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

const UNITS = ["pcs", "kg", "g", "lb", "liter", "ml", "pack", "bottle", "box", "dozen"];

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

export default function Grocery() {
  const me = getUser();
  const [month, setMonth] = useState(monthNow());
  const [msg, setMsg] = useState("");
  const [day, setDay] = useState(dayNow());

  const [members, setMembers] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [methods, setMethods] = useState([]);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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

  const [txnItems, setTxnItems] = useState([
    {
      name: "",
      brand: "",
      unit: "pcs",
      qty: 1,
      unitPrice: 0,
      itemDiscount: 0,
      productStartDate: "",
      productEndDate: "",
      note: "",
    },
  ]);

  useEffect(() => {
    const m = day.slice(0, 7);
    if (m !== month) setMonth(m);
  }, [day]);

  const otherMember = useMemo(() => members.find((m) => m.id !== me?.id) || null, [members, me]);

  const itemsSubtotal = useMemo(() => {
    let sum = 0;
    for (const it of txnItems) {
      const line = money(Number(it.qty || 0) * Number(it.unitPrice || 0) - Number(it.itemDiscount || 0));
      sum += line;
    }
    return money(sum);
  }, [txnItems]);

  const totalPayable = useMemo(() => {
    let t = itemsSubtotal - Number(form.discountTotal || 0) + Number(form.deliveryFee || 0);
    if (!form.vatIncluded) t += Number(form.vatAmount || 0);
    return money(t);
  }, [itemsSubtotal, form.discountTotal, form.deliveryFee, form.vatAmount, form.vatIncluded]);

  const filteredTxns = useMemo(() => {
    return (items || []).filter((t) => toLocalYMD(t.txnDate) === day);
  }, [items, day]);

  async function loadBasics() {
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
  }

  async function loadMonth() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/grocery", { params: { month } });
      setItems(res.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load");
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

  function openModal() {
    setMsg("");

    const defaultUser = members?.[0]?.id || "";
    const defaultAccount = accounts?.[0]?._id || "";

    setForm((f) => ({
      ...f,
      paidByUserId: f.paidByUserId || defaultUser,
      personalUserId: f.personalUserId || defaultUser,
      fromAccountId: f.fromAccountId || defaultAccount,
    }));

    setTxnItems([
      {
        name: "",
        brand: "",
        unit: "pcs",
        qty: 1,
        unitPrice: 0,
        itemDiscount: 0,
        productStartDate: "",
        productEndDate: "",
        note: "",
      },
    ]);

    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function addItemRow() {
    setTxnItems([
      ...txnItems,
      {
        name: "",
        brand: "",
        unit: "pcs",
        qty: 1,
        unitPrice: 0,
        itemDiscount: 0,
        productStartDate: "",
        productEndDate: "",
        note: "",
      },
    ]);
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
      if (!form.categoryId) return setMsg("Select expense category (e.g., Grocery)");
      if (!form.paidByUserId) return setMsg("Select Paid By");
      if (!form.fromAccountId) return setMsg("Select From Account");
      if (txnItems.some((x) => !x.name.trim())) return setMsg("Every item must have a name");
      if (totalPayable <= 0) return setMsg("Total payable must be > 0");

      let split = { type: form.splitType };

      if (form.splitType === "personal") {
        if (!form.personalUserId) return setMsg("Select Personal For");
        split.personalUserId = form.personalUserId;
      }

      if (form.splitType === "ratio") {
        if (!otherMember) return setMsg("Need 2 members for ratio");
        split.ratios = [
          { userId: me.id, ratio: Number(form.ratioMe) },
          { userId: otherMember.id, ratio: Number(form.ratioOther) },
        ];
      }

      if (form.splitType === "fixed") {
        if (!otherMember) return setMsg("Need 2 members for fixed");
        split.fixed = [
          { userId: me.id, amount: Number(form.fixedMe || 0) },
          { userId: otherMember.id, amount: Number(form.fixedOther || 0) },
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
          ...it,
          qty: Number(it.qty || 0),
          unitPrice: Number(it.unitPrice || 0),
          itemDiscount: Number(it.itemDiscount || 0),
        })),
        split,
      };

      await api.post("/api/grocery", payload);
      closeModal();
      await loadMonth();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Save failed");
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

  return (
    <AppLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">Grocery</h2>
            <p className="text-sm text-gray-600">
              One transaction → many items → split on total.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full lg:w-auto">
            <input
              type="month"
              className="w-full sm:w-auto border rounded-md px-3 py-2 text-sm bg-white"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button
              onClick={openModal}
              className="w-full sm:w-auto bg-black text-white rounded-md px-4 py-2 text-sm"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {msg && <div className="mb-3 text-sm text-red-600 break-words">{msg}</div>}

        <ConfirmModal
          open={confirmOpen}
          title="Delete Grocery Transaction"
          message="Are you sure you want to delete this grocery transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="border-b p-4">
            <div className="font-medium text-sm mb-3">Transactions ({month})</div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm text-gray-600">Date</span>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm w-full sm:w-auto"
                />
              </div>

              <button
                type="button"
                onClick={() => setDay(dayNow())}
                className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50 w-full sm:w-auto"
              >
                Today
              </button>

              <div className="text-sm text-gray-600">
                Showing {filteredTxns.length} transaction(s)
              </div>
            </div>
          </div>

          {loading ? (
            <Loader text="Loading grocery data" subtext="Preparing your entries" />
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No transactions.</div>
          ) : filteredTxns.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No transactions for selected day.</div>
          ) : (
            <div className="divide-y">
              {filteredTxns.map((t) => (
                <div key={t._id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base break-words">
                        {t.shopName || "Grocery Transaction"} —{" "}
                        {new Date(t.txnDate).toISOString().slice(0, 10)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 break-words">
                        Category: {t.categoryId?.name || "-"} | Paid by: {t.paidByUserId?.name || "-"} | From:{" "}
                        {t.fromAccountId?.name || "-"} | Total: {t.totalPayable}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTxn(t._id)}
                      className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50 w-full sm:w-auto"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Desktop table */}
                  <div className="mt-3 hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
                      <thead className="bg-gray-50">
                        <tr className="text-left">
                          <th className="p-2">Item</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Discount</th>
                          <th className="p-2">Start</th>
                          <th className="p-2">End</th>
                          <th className="p-2">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(t.items || []).map((it) => (
                          <tr key={it._id} className="border-t">
                            <td className="p-2">{it.name}</td>
                            <td className="p-2">{it.qty}</td>
                            <td className="p-2">{it.unit}</td>
                            <td className="p-2">{it.unitPrice}</td>
                            <td className="p-2">{it.itemDiscount}</td>
                            <td className="p-2">
                              {it.productStartDate
                                ? new Date(it.productStartDate).toISOString().slice(0, 10)
                                : "-"}
                            </td>
                            <td className="p-2">
                              {it.productEndDate
                                ? new Date(it.productEndDate).toISOString().slice(0, 10)
                                : "-"}
                            </td>
                            <td className="p-2">{it.lineTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="mt-3 md:hidden space-y-2">
                    {(t.items || []).map((it) => (
                      <div key={it._id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="font-medium text-sm break-words">{it.name}</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
                          <div>Qty: {it.qty}</div>
                          <div>Unit: {it.unit}</div>
                          <div>Price: {it.unitPrice}</div>
                          <div>Discount: {it.itemDiscount}</div>
                          <div>
                            Start:{" "}
                            {it.productStartDate
                              ? new Date(it.productStartDate).toISOString().slice(0, 10)
                              : "-"}
                          </div>
                          <div>
                            End:{" "}
                            {it.productEndDate
                              ? new Date(it.productEndDate).toISOString().slice(0, 10)
                              : "-"}
                          </div>
                          <div className="col-span-2 font-semibold text-gray-800">
                            Line Total: {it.lineTotal}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-gray-500 break-words">
                    Subtotal: {t.itemsSubtotal} | Discount: {t.discountTotal} | Delivery: {t.deliveryFee} | VAT:{" "}
                    {t.vatAmount} ({t.vatIncluded ? "included" : "added"})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {open && (
          <div className="app-modal-overlay">
            <div className="app-modal-panel max-w-6xl rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg font-semibold mb-1">Add Grocery Transaction</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add items like a receipt. Split on total payable.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={form.txnDate}
                    onChange={(e) => setForm({ ...form, txnDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Shop</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Expense Category</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
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
                  <label className="text-sm font-medium">Paid By</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.paidByUserId}
                    onChange={(e) => setForm({ ...form, paidByUserId: e.target.value })}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">From Account</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
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
                  <label className="text-sm font-medium">Payment Method</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.paymentMethodId}
                    onChange={(e) => setForm({ ...form, paymentMethodId: e.target.value })}
                  >
                    <option value="">(optional)</option>
                    {methods.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Card Label</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.cardLabelId}
                    onChange={(e) => setForm({ ...form, cardLabelId: e.target.value })}
                  >
                    <option value="">(optional)</option>
                    {cards.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.label}
                        {c.last4 ? ` (${c.last4})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 xl:col-span-4">
                  <label className="text-sm font-medium">Note</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>

              {/* Desktop item table */}
              <div className="hidden lg:block border rounded-lg overflow-x-auto mb-4">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-2">Name</th>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Unit Price</th>
                      <th className="p-2">Discount</th>
                      <th className="p-2">Start</th>
                      <th className="p-2">End</th>
                      <th className="p-2">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnItems.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">
                          <input
                            className="w-full border rounded-md px-2 py-1"
                            value={it.name}
                            onChange={(e) => updateItem(idx, "name", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full border rounded-md px-2 py-1"
                            value={it.brand}
                            onChange={(e) => updateItem(idx, "brand", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <select
                            className="w-full border rounded-md px-2 py-1"
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
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.qty}
                            onChange={(e) => updateItem(idx, "qty", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.itemDiscount}
                            onChange={(e) => updateItem(idx, "itemDiscount", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.productStartDate || ""}
                            onChange={(e) => updateItem(idx, "productStartDate", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.productEndDate || ""}
                            onChange={(e) => updateItem(idx, "productEndDate", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => removeItemRow(idx)}
                            className="border rounded-md px-2 py-1"
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
              <div className="lg:hidden space-y-3 mb-4">
                {txnItems.map((it, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-sm">Item {idx + 1}</div>
                      <button
                        onClick={() => removeItemRow(idx)}
                        className="border rounded-md px-3 py-1 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium">Name</label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={it.name}
                          onChange={(e) => updateItem(idx, "name", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Brand</label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={it.brand}
                          onChange={(e) => updateItem(idx, "brand", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Unit</label>
                        <select
                          className="w-full border rounded-md px-3 py-2"
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
                        <label className="text-sm font-medium">Qty</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-full border rounded-md px-3 py-2"
                          value={it.qty}
                          onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full border rounded-md px-3 py-2"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Discount</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full border rounded-md px-3 py-2"
                          value={it.itemDiscount}
                          onChange={(e) => updateItem(idx, "itemDiscount", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Start</label>
                        <input
                          type="date"
                          className="w-full border rounded-md px-3 py-2"
                          value={it.productStartDate || ""}
                          onChange={(e) => updateItem(idx, "productStartDate", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">End</label>
                        <input
                          type="date"
                          className="w-full border rounded-md px-3 py-2"
                          value={it.productEndDate || ""}
                          onChange={(e) => updateItem(idx, "productEndDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Tip: Start/End dates are optional. You can leave End empty.
              </div>

              <button
                onClick={addItemRow}
                className="w-full sm:w-auto border rounded-md px-3 py-2 text-sm hover:bg-gray-50 mb-4"
              >
                + Add Item
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Items Subtotal</div>
                  <div className="text-lg font-bold break-words">{itemsSubtotal}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Txn Discount</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.discountTotal}
                    onChange={(e) => setForm({ ...form, discountTotal: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Fee</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.deliveryFee}
                    onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VAT Amount</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.vatAmount}
                    onChange={(e) => setForm({ ...form, vatAmount: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 flex items-start gap-2 border rounded-lg p-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.vatIncluded}
                    onChange={(e) => setForm({ ...form, vatIncluded: e.target.checked })}
                  />
                  <span className="text-sm">VAT already included in item prices</span>
                </div>

                <div className="bg-gray-50 border rounded-lg p-3 sm:col-span-2">
                  <div className="text-xs text-gray-500">Total Payable</div>
                  <div className="text-lg font-bold break-words">{totalPayable}</div>
                </div>
              </div>

              <div className="border rounded-lg p-4 mb-4">
                <div className="font-medium mb-2">Split</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Split Type</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
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
                      <label className="text-sm font-medium">Personal For</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={form.personalUserId}
                        onChange={(e) => setForm({ ...form, personalUserId: e.target.value })}
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.splitType === "ratio" && otherMember && (
                    <>
                      <div>
                        <label className="text-sm font-medium">My %</label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={form.ratioMe}
                          onChange={(e) => setForm({ ...form, ratioMe: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{otherMember.name} %</label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={form.ratioOther}
                          onChange={(e) => setForm({ ...form, ratioOther: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2 xl:col-span-4 text-xs text-gray-500">
                        Must sum to 100.
                      </div>
                    </>
                  )}

                  {form.splitType === "fixed" && otherMember && (
                    <>
                      <div>
                        <label className="text-sm font-medium">My Amount</label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={form.fixedMe}
                          onChange={(e) => setForm({ ...form, fixedMe: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{otherMember.name} Amount</label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={form.fixedOther}
                          onChange={(e) => setForm({ ...form, fixedOther: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2 xl:col-span-4 text-xs text-gray-500">
                        Must sum to total payable.
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="w-full sm:w-auto border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTxn}
                  className="w-full sm:w-auto bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  Save Transaction
                </button>
              </div>

              {msg && <div className="mt-3 text-sm text-red-600 break-words">{msg}</div>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}