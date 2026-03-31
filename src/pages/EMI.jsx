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

export default function EMI() {
  const me = getUser();
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
    paidByUserId: me?.id || "",
    fromAccountId: "",
    paidDate: new Date().toISOString().slice(0, 10),
  });

  const otherMember = useMemo(
    () => members.find((m) => m.id !== me?.id) || null,
    [members, me]
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

    setMembers(mRes.data.members || []);

    const memberItems = mRes.data.members || [];
    setMembers(memberItems);

    if (memberItems.length > 0) {
      const defaultPersonalId = me?.id || memberItems[0]?.id || "";
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
      personalUserId: me?.id || members[0]?.id || "",
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
          { userId: me.id, ratio: Number(form.ratioMe) },
          { userId: otherMember.id, ratio: Number(form.ratioOther) },
        ];
      }

      if (form.splitType === "fixed" && otherMember) {
        payload.fixed = [
          { userId: me.id, amount: Number(form.fixedMe || 0) },
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
      paidByUserId: me?.id || members[0]?.id || "",
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

  return (
    <AppLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">EMI</h2>
            <p className="text-sm text-gray-600">
              Create EMI plan → generate monthly payables into ledger.
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
              + Add EMI Plan
            </button>
          </div>
        </div>

        {msg && <div className="mb-3 text-sm text-blue-700 break-words">{msg}</div>}

        <div className="bg-white border rounded-lg p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium">Monthly EMI Bills — {month}</div>
              <div className="text-sm text-gray-600">
                This creates the <b>pending</b> EMI installment rows for all{" "}
                <b>active</b> plans in this month.
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Uses Expense category <b>EMI</b> automatically. If you don’t
                have it, go to Settings → Categories and create one.
              </div>
            </div>

            <button
              onClick={generateMonth}
              className="w-full lg:w-auto bg-black text-white rounded-md px-4 py-2 text-sm whitespace-nowrap"
            >
              Create EMI Bills
            </button>
          </div>

          <div className="mt-3">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border text-sm">
              <span className="text-gray-600">
                Bills already created for {month}:
              </span>
              <b>{installments.length}</b>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden mb-4">
          <div className="p-3 border-b font-medium text-sm">EMI Plans</div>

          {plans.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No EMI plans yet.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-3">Product</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Months</th>
                      <th className="p-3">Monthly</th>
                      <th className="p-3">Remaining</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Start-End</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {plans.map((p) => (
                      <tr key={p._id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{p.productName}</div>
                          <div className="text-xs text-gray-500">
                            {p.brand || "-"} {p.category ? `• ${p.category}` : ""}
                          </div>
                        </td>

                        <td className="p-3">{p.totalPayable}</td>
                        <td className="p-3">{p.months}</td>
                        <td className="p-3">{p.monthlyAmount}</td>

                        <td className="p-3">
                          <div className="font-medium">
                            {p?.stats?.remaining ?? "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p?.stats?.remainingMonths ?? "-"} mo left
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-black h-2"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, Number(p?.stats?.progress || 0))
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-600">
                              {p?.stats?.progress ?? 0}%
                            </div>
                          </div>

                          {Number(p?.stats?.behindBy || 0) > 0 && (
                            <div className="text-xs text-amber-700 mt-1">
                              Behind: {p.stats.behindBy}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {p.startMonth} → {p.endMonth}
                        </td>

                        <td className="p-3">{p.status}</td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {p.status === "active" &&
                              month >= p.startMonth &&
                              month <= p.endMonth && (
                                <button
                                  onClick={() =>
                                    generateSinglePlan(p._id, p.productName)
                                  }
                                  className="bg-black text-white rounded-md px-3 py-1 hover:opacity-90"
                                >
                                  Create Bill
                                </button>
                              )}

                            {p.status === "active" ? (
                              <button
                                onClick={() => setStatus(p._id, "closed")}
                                className="border rounded-md px-3 py-1 hover:bg-gray-50"
                              >
                                Close
                              </button>
                            ) : (
                              <button
                                onClick={() => setStatus(p._id, "active")}
                                className="border rounded-md px-3 py-1 hover:bg-gray-50"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y">
                {plans.map((p) => (
                  <div key={p._id} className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="font-semibold text-sm break-words">
                          {p.productName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 break-words">
                          {p.brand || "-"} {p.category ? `• ${p.category}` : ""}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="border rounded-lg p-2">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-medium">{p.totalPayable}</div>
                        </div>
                        <div className="border rounded-lg p-2">
                          <div className="text-xs text-gray-500">Months</div>
                          <div className="font-medium">{p.months}</div>
                        </div>
                        <div className="border rounded-lg p-2">
                          <div className="text-xs text-gray-500">Monthly</div>
                          <div className="font-medium">{p.monthlyAmount}</div>
                        </div>
                        <div className="border rounded-lg p-2">
                          <div className="text-xs text-gray-500">Remaining</div>
                          <div className="font-medium">
                            {p?.stats?.remaining ?? "-"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {p?.stats?.remainingMonths ?? "-"} mo left
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-black h-2"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, Number(p?.stats?.progress || 0))
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 whitespace-nowrap">
                            {p?.stats?.progress ?? 0}%
                          </div>
                        </div>
                        {Number(p?.stats?.behindBy || 0) > 0 && (
                          <div className="text-xs text-amber-700 mt-1">
                            Behind: {p.stats.behindBy}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Start-End</div>
                          <div className="font-medium break-words">
                            {p.startMonth} → {p.endMonth}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="font-medium">{p.status}</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {p.status === "active" &&
                          month >= p.startMonth &&
                          month <= p.endMonth && (
                            <button
                              onClick={() =>
                                generateSinglePlan(p._id, p.productName)
                              }
                              className="w-full sm:w-auto bg-black text-white rounded-md px-3 py-2 text-sm"
                            >
                              Create Bill
                            </button>
                          )}

                        {p.status === "active" ? (
                          <button
                            onClick={() => setStatus(p._id, "closed")}
                            className="w-full sm:w-auto border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatus(p._id, "active")}
                            className="w-full sm:w-auto border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-3 border-b font-medium text-sm">
            Installments ({month})
          </div>

          {installments.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">
              No installments generated for this month.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-3">Product</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {installments.map((i) => (
                      <tr key={i._id} className="border-t">
                        <td className="p-3">{i?.planId?.productName || "-"}</td>
                        <td className="p-3">{i.amount}</td>
                        <td className="p-3">
                          {i.dueDate
                            ? new Date(i.dueDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-3">{i.status}</td>
                        <td className="p-3 text-right">
                          {i.status === "paid" ? (
                            <button
                              onClick={() => setInstallmentStatus(i._id, "pending")}
                              className="border rounded-md px-3 py-1 hover:bg-gray-50 mr-2"
                            >
                              Mark Pending
                            </button>
                          ) : (
                            <button
                              onClick={() => openPayModalForInstallment(i)}
                              className="bg-black text-white rounded-md px-3 py-1 mr-2"
                            >
                              Mark Paid
                            </button>
                          )}

                          <button
                            onClick={() => deleteInstallment(i._id)}
                            className="border rounded-md px-3 py-1 hover:bg-gray-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {installments.map((i) => (
                  <div key={i._id} className="p-4">
                    <div className="font-semibold text-sm break-words">
                      {i?.planId?.productName || "-"}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="border rounded-lg p-2">
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="font-medium">{i.amount}</div>
                      </div>
                      <div className="border rounded-lg p-2">
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="font-medium">{i.status}</div>
                      </div>
                      <div className="border rounded-lg p-2 col-span-2">
                        <div className="text-xs text-gray-500">Due Date</div>
                        <div className="font-medium">
                          {i.dueDate
                            ? new Date(i.dueDate).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      {i.status === "paid" ? (
                        <button
                          onClick={() => setInstallmentStatus(i._id, "pending")}
                          className="w-full border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Mark Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => openPayModalForInstallment(i)}
                          className="w-full bg-black text-white rounded-md px-3 py-2 text-sm"
                        >
                          Mark Paid
                        </button>
                      )}

                      <button
                        onClick={() => deleteInstallment(i._id)}
                        className="w-full border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {payModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-lg bg-white border rounded-t-2xl sm:rounded-lg p-4 sm:p-5">
              <h3 className="text-lg font-semibold">Mark EMI as Paid</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedInstallment?.planId?.productName || "This installment"} will
                create an expense transaction and deduct the amount from the selected
                account.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Who is paying</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
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
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">From which account</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
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
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Payment Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={payForm.paidDate}
                    onChange={(e) =>
                      setPayForm((p) => ({ ...p, paidDate: e.target.value }))
                    }
                  />
                </div>

                <div className="sm:col-span-2 rounded-lg border bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">
                      {selectedInstallment?.amount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
                <button
                  onClick={closePayModal}
                  className="w-full sm:w-auto border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMarkPaid}
                  className="w-full sm:w-auto bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div className="app-modal-overlay">
            <div className="app-modal-panel max-w-3xl rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg font-semibold mb-1">Add EMI Plan</h3>
              <p className="text-sm text-gray-500 mb-4">
                Monthly amount will be auto calculated.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.productName}
                    onChange={(e) =>
                      setForm({ ...form, productName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category (text)</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Purchase Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={form.purchaseDate}
                    onChange={(e) =>
                      setForm({ ...form, purchaseDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Start Month</label>
                  <input
                    type="month"
                    className="w-full border rounded-md px-3 py-2"
                    value={form.startMonth}
                    onChange={(e) =>
                      setForm({ ...form, startMonth: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Original Price</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm({ ...form, originalPrice: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">EMI Charge (%)</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.emiCharge}
                    onChange={(e) =>
                      setForm({ ...form, emiCharge: e.target.value })
                    }
                    placeholder="e.g., 0.9"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Percentage. Example: <b>0.9</b> means <b>0.9%</b>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Total Payable</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.totalPayable}
                    readOnly
                    title="Auto calculated = Original Price + (Original Price × EMI Charge%)"
                    style={{ background: "#f9fafb" }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Months</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.months}
                    onChange={(e) => setForm({ ...form, months: e.target.value })}
                  >
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Common EMI terms: 1, 3, 6, 9, 12, 18, 24, 36
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <label className="text-sm font-medium">Split Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.splitType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        splitType: nextType,
                        personalUserId:
                          nextType === "personal"
                            ? (prev.personalUserId || me?.id || members[0]?.id || "")
                            : prev.personalUserId,
                      }));
                    }}
                  >
                    <option value="equal">Equal</option>
                    <option value="personal">Personal</option>
                    <option value="ratio">Ratio</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                {form.splitType === "personal" && (
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="text-sm font-medium">Personal For</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={form.personalUserId}
                      onChange={(e) =>
                        setForm({ ...form, personalUserId: e.target.value })
                      }
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
                        onChange={(e) =>
                          setForm({ ...form, ratioMe: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        {otherMember.name} %
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.ratioOther}
                        onChange={(e) =>
                          setForm({ ...form, ratioOther: e.target.value })
                        }
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3 text-xs text-gray-500">
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
                        onChange={(e) =>
                          setForm({ ...form, fixedMe: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        {otherMember.name} Amount
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.fixedOther}
                        onChange={(e) =>
                          setForm({ ...form, fixedOther: e.target.value })
                        }
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3 text-xs text-gray-500">
                      Must sum to monthly amount.
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-sm font-medium">Note</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5">
                <button
                  onClick={closeModal}
                  className="w-full sm:w-auto border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createPlan}
                  className="w-full sm:w-auto bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  Save Plan
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