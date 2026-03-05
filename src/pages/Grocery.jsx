import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";

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
  return `${y}-${m}-${day}`; // YYYY-MM-DD
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
  const [day, setDay] = useState(dayNow()); // auto selects current day

  const [members, setMembers] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [methods, setMethods] = useState([]);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]); // ✅ NEW

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
    fromAccountId: "", // ✅ NEW (required)
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
    const m = day.slice(0, 7); // YYYY-MM
    if (m !== month) setMonth(m);
  }, [day]); // (month is from your state)

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
      api.get("/api/accounts"), // ✅ NEW (must exist in your backend)
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
      fromAccountId: f.fromAccountId || defaultAccount, // ✅ auto default
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
      if (!form.fromAccountId) return setMsg("Select From Account"); // ✅ required now
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
        fromAccountId: form.fromAccountId, // ✅ NEW
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
      <div className="">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Grocery</h2>
            <p className="text-sm text-gray-600">One transaction → many items → split on total.</p>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="month"
              className="border rounded-md px-3 py-2 text-sm bg-white"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button onClick={openModal} className="bg-black text-white rounded-md px-4 py-2 text-sm">
              + Add Transaction
            </button>
          </div>
        </div>

        {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

        <ConfirmModal
          open={confirmOpen}
          title="Delete Grocery Transaction"
          message="Are you sure you want to delete this grocery transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex justify-between">
            <div className="p-5 border-b font-medium text-sm">Transactions ({month})</div>

            <div className="flex flex-wrap items-center gap-3 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Date</span>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setDay(dayNow())}
                className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
              >
                Today
              </button>

              <div className="text-sm text-gray-600">
                Showing {filteredTxns.length} transaction(s)
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-4">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No transactions.</div>
          ) : (
            <div className="divide-y">
              {filteredTxns.map((t) => (
                <div key={t._id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {t.shopName || "Grocery Transaction"} — {new Date(t.txnDate).toISOString().slice(0, 10)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Category: {t.categoryId?.name || "-"} | Paid by: {t.paidByUserId?.name || "-"} | From:{" "}
                        {t.fromAccountId?.name || "-"} | Total: {t.totalPayable}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTxn(t._id)}
                      className="border rounded-md px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-3 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left">
                          <th className="p-2">Item</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Discount</th>
                          <th className="p-2 hidden lg:table-cell">Start</th>
                          <th className="p-2 hidden lg:table-cell">End</th>
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
                            <td className="p-2 hidden lg:table-cell">
                              {it.productStartDate ? new Date(it.productStartDate).toISOString().slice(0, 10) : "-"}
                            </td>
                            <td className="p-2 hidden lg:table-cell">
                              {it.productEndDate ? new Date(it.productEndDate).toISOString().slice(0, 10) : "-"}
                            </td>
                            <td className="p-2">{it.lineTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Subtotal: {t.itemsSubtotal} | Discount: {t.discountTotal} | Delivery: {t.deliveryFee} | VAT:{" "}
                    {t.vatAmount} ({t.vatIncluded ? "included" : "added"})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full bg-white border rounded-lg p-5 overflow-auto max-h-[90vh]">
              <h3 className="text-lg font-semibold mb-1">Add Grocery Transaction</h3>
              <p className="text-sm text-gray-500 mb-4">Add items like a receipt. Split on total payable.</p>

              <div className="grid md:grid-cols-4 gap-3 mb-4">
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

                <div className="md:col-span-4">
                  <label className="text-sm font-medium">Note</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-2">Name</th>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Unit Price</th>
                      <th className="p-2">Discount</th>
                      <th className="p-2 hidden lg:table-cell">Start</th>
                      <th className="p-2 hidden lg:table-cell">End</th>
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
                        <td className="p-2 hidden lg:table-cell">
                          <input
                            type="date"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.productStartDate || ""}
                            onChange={(e) => updateItem(idx, "productStartDate", e.target.value)}
                          />
                        </td>
                        <td className="p-2 hidden lg:table-cell">
                          <input
                            type="date"
                            className="w-full border rounded-md px-2 py-1"
                            value={it.productEndDate || ""}
                            onChange={(e) => updateItem(idx, "productEndDate", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <button onClick={() => removeItemRow(idx)} className="border rounded-md px-2 py-1">
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Tip: Start/End dates are optional (shown on large screens). You can leave End empty.
              </div>

              <button onClick={addItemRow} className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50 mb-4">
                + Add Item
              </button>

              <div className="grid md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Items Subtotal</div>
                  <div className="text-lg font-bold">{itemsSubtotal}</div>
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

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.vatIncluded}
                    onChange={(e) => setForm({ ...form, vatIncluded: e.target.checked })}
                  />
                  <span className="text-sm">VAT already included in item prices</span>
                </div>

                <div className="bg-gray-50 border rounded-lg p-3 md:col-span-2">
                  <div className="text-xs text-gray-500">Total Payable</div>
                  <div className="text-lg font-bold">{totalPayable}</div>
                </div>
              </div>

              <div className="border rounded-lg p-4 mb-4">
                <div className="font-medium mb-2">Split</div>
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
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
                    <div className="md:col-span-2">
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
                      <div className="md:col-span-4 text-xs text-gray-500">Must sum to 100.</div>
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
                      <div className="md:col-span-4 text-xs text-gray-500">Must sum to total payable.</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={closeModal} className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveTxn} className="bg-black text-white rounded-md px-4 py-2 text-sm">
                  Save Transaction
                </button>
              </div>

              {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}