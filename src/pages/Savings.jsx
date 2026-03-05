import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function money(n) {
  const v = Number(n || 0);
  return `৳ ${v.toLocaleString("en-BD")}`;
}

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
      {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
    </div>
  );
}

export default function Savings() {
  const [month, setMonth] = useState(monthNow());
  const [allAccounts, setAllAccounts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    note: "",
  });

  const savingsAccounts = useMemo(
    () => allAccounts.filter((a) => ["savings", "investment"].includes(a.type) && a.isActive),
    [allAccounts]
  );

  const spendAccounts = useMemo(
    () => allAccounts.filter((a) => !["savings", "investment"].includes(a.type) && a.isActive),
    [allAccounts]
  );

  async function loadAccounts() {
    const res = await api.get("/api/accounts");
    setAllAccounts(res.data.items || []);
  }

  async function loadOverview(m) {
    const res = await api.get("/api/savings/overview", { params: { month: m } });
    setOverview(res.data);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await loadAccounts();
      await loadOverview(month);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load savings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // when month changes, only reload overview
    (async () => {
      try {
        await loadOverview(month);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load overview");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function openDeposit() {
    // smart defaults: from = first spend account, to = first savings
    const from = spendAccounts?.[0]?._id || "";
    const to = savingsAccounts?.[0]?._id || "";
    setForm({ date: todayISO(), fromAccountId: from, toAccountId: to, amount: "", note: "" });
    setModalOpen(true);
  }

  async function saveDeposit() {
    try {
      if (!form.fromAccountId || !form.toAccountId) {
        toast.error("Select From and To accounts");
        return;
      }
      const amt = Number(form.amount);
      if (!amt || amt <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      await api.post("/api/savings/deposit", {
        date: form.date,
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: amt,
        note: form.note,
      });

      toast.success("Saved as Transfer ✅ (Savings is not expense)");
      setModalOpen(false);
      await loadOverview(month);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  }

  const totals = overview?.totals || { deposited: 0, withdrawn: 0, net: 0, totalBalance: 0 };
  const list = overview?.accounts || [];

  return (
    <AppLayout>
      <div className=" mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Savings</h2>
            <p className="text-sm text-gray-600">
              Savings is tracked as <b>Transfer</b> (e.g., Bank → DPS). It reduces available salary, but it’s not an expense.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
            <button
              onClick={openDeposit}
              className="bg-black text-white px-4 py-2 rounded-md"
              disabled={savingsAccounts.length === 0 || spendAccounts.length === 0}
              title={
                savingsAccounts.length === 0
                  ? "Create a Savings account first (Settings → Accounts)"
                  : spendAccounts.length === 0
                  ? "Create at least one Bank/Cash account first"
                  : ""
              }
            >
              + Add Deposit
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <StatCard title="Total Savings Balance" value={money(totals.totalBalance)} />
              <StatCard title={`Deposited in ${month}`} value={money(totals.deposited)} />
              <StatCard title={`Withdrawn in ${month}`} value={money(totals.withdrawn)} />
              <StatCard title={`Net in ${month}`} value={money(totals.net)} sub="Deposited − Withdrawn" />
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-3 border-b text-sm font-medium">Savings Accounts</div>
              {list.length === 0 ? (
                <div className="p-4 text-gray-600 text-sm">
                  No savings accounts found. Create one from <b>Settings → Accounts</b> and set type as <b>savings</b> or <b>investment</b>.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-3">Account</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-right">Deposited (month)</th>
                      <th className="p-3 text-right">Withdrawn (month)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => (
                      <tr key={a._id} className="border-t">
                        <td className="p-3 font-medium">{a.name}</td>
                        <td className="p-3">{a.type}</td>
                        <td className="p-3">{a.owner}</td>
                        <td className="p-3 text-right">{money(a.currentBalance)}</td>
                        <td className="p-3 text-right">{money(a.monthDeposited)}</td>
                        <td className="p-3 text-right">{money(a.monthWithdrawn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Deposit modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg border p-5">
              <h3 className="text-lg font-semibold mb-1">Add Savings Transfer</h3>
              <p className="text-sm text-gray-500 mb-4">
                This will create a <b>Transfer</b> transaction.
              </p>

              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mb-3"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />

              <label className="text-sm font-medium">From (Bank/Cash)</label>
              <select
                className="w-full border rounded-md px-3 py-2 mb-3"
                value={form.fromAccountId}
                onChange={(e) => setForm((p) => ({ ...p, fromAccountId: e.target.value }))}
              >
                <option value="">Select</option>
                {spendAccounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium">To (Savings)</label>
              <select
                className="w-full border rounded-md px-3 py-2 mb-3"
                value={form.toAccountId}
                onChange={(e) => setForm((p) => ({ ...p, toAccountId: e.target.value }))}
              >
                <option value="">Select</option>
                {savingsAccounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 mb-3"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="e.g., 5000"
              />

              <label className="text-sm font-medium">Note (optional)</label>
              <input
                className="w-full border rounded-md px-3 py-2 mb-4"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="e.g., DPS deposit"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDeposit}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm"
                  disabled={!form.fromAccountId || !form.toAccountId || !String(form.amount).trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
