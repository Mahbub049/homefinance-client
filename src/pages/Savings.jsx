import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import Loader from "../components/ui/Loader";

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
    <div className="bg-white border rounded-xl p-4 sm:p-5">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg sm:text-xl font-semibold mt-1 break-words">{value}</div>
      {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
    </div>
  );
}

export default function Savings() {
  const [month, setMonth] = useState(monthNow());
  const [allAccounts, setAllAccounts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    note: "",
  });

  const savingsAccounts = useMemo(
    () =>
      allAccounts.filter(
        (a) => ["savings", "investment"].includes(a.type) && a.isActive
      ),
    [allAccounts]
  );

  const spendAccounts = useMemo(
    () =>
      allAccounts.filter(
        (a) => !["savings", "investment"].includes(a.type) && a.isActive
      ),
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
    const from = spendAccounts?.[0]?._id || "";
    const to = savingsAccounts?.[0]?._id || "";
    setForm({
      date: todayISO(),
      fromAccountId: from,
      toAccountId: to,
      amount: "",
      note: "",
    });
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

  const totals = overview?.totals || {
    deposited: 0,
    withdrawn: 0,
    net: 0,
    totalBalance: 0,
  };
  const list = overview?.accounts || [];

  return (
    <AppLayout>
      <div className="mx-auto w-full px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-5 sm:mb-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Savings</h2>
            <p className="text-sm text-gray-600 mt-1 leading-6">
              Savings is tracked as <b>Transfer</b> (e.g., Bank → DPS). It reduces
              available salary, but it’s not an expense.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full sm:w-auto"
            />

            <button
              onClick={openDeposit}
              className="bg-black text-white px-4 py-2 rounded-lg w-full sm:w-auto disabled:opacity-60"
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
          <Loader text="Loading savings" subtext="Preparing your savings overview" />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
              <StatCard
                title="Total Savings Balance"
                value={money(totals.totalBalance)}
              />
              <StatCard
                title={`Deposited in ${month}`}
                value={money(totals.deposited)}
              />
              <StatCard
                title={`Withdrawn in ${month}`}
                value={money(totals.withdrawn)}
              />
              <StatCard
                title={`Net in ${month}`}
                value={money(totals.net)}
                sub="Deposited − Withdrawn"
              />
            </div>

            {/* Desktop table / mobile cards */}
            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="p-3 sm:p-4 border-b text-sm font-medium">
                Savings Accounts
              </div>

              {list.length === 0 ? (
                <div className="p-4 text-gray-600 text-sm leading-6">
                  No savings accounts found. Create one from <b>Settings → Accounts</b>{" "}
                  and set type as <b>savings</b> or <b>investment</b>.
                </div>
              ) : (
                <>
                  {/* Mobile view */}
                  <div className="block md:hidden">
                    <div className="divide-y">
                      {list.map((a) => (
                        <div key={a._id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 break-words">
                                {a.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {a.type} • {a.owner}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs text-gray-500">Balance</div>
                              <div className="font-semibold">
                                {money(a.currentBalance)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 border rounded-lg p-3">
                              <div className="text-xs text-gray-500">
                                Deposited (month)
                              </div>
                              <div className="text-sm font-semibold mt-1 break-words">
                                {money(a.monthDeposited)}
                              </div>
                            </div>

                            <div className="bg-gray-50 border rounded-lg p-3">
                              <div className="text-xs text-gray-500">
                                Withdrawn (month)
                              </div>
                              <div className="text-sm font-semibold mt-1 break-words">
                                {money(a.monthWithdrawn)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
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
                            <td className="p-3 text-right">
                              {money(a.currentBalance)}
                            </td>
                            <td className="p-3 text-right">
                              {money(a.monthDeposited)}
                            </td>
                            <td className="p-3 text-right">
                              {money(a.monthWithdrawn)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Deposit modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl border p-4 sm:p-5 max-h-[92vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-1">Add Savings Transfer</h3>
              <p className="text-sm text-gray-500 mb-4">
                This will create a <b>Transfer</b> transaction.
              </p>

              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 mb-3"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />

              <label className="text-sm font-medium">From (Bank/Cash)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 mb-3"
                value={form.fromAccountId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fromAccountId: e.target.value }))
                }
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
                className="w-full border rounded-lg px-3 py-2 mb-3"
                value={form.toAccountId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, toAccountId: e.target.value }))
                }
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
                className="w-full border rounded-lg px-3 py-2 mb-3"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="e.g., 5000"
              />

              <label className="text-sm font-medium">Note (optional)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mb-4"
                value={form.note}
                onChange={(e) =>
                  setForm((p) => ({ ...p, note: e.target.value }))
                }
                placeholder="e.g., DPS deposit"
              />

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDeposit}
                  className="bg-black text-white rounded-lg px-4 py-2 text-sm w-full sm:w-auto disabled:opacity-60"
                  disabled={
                    !form.fromAccountId ||
                    !form.toAccountId ||
                    !String(form.amount).trim()
                  }
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