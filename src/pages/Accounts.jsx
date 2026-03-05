import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "wallet", label: "Wallet (bKash/Nagad)" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
];

const OWNERS = [
  { value: "Mahbub", label: "Mahbub" },
  { value: "Mirza", label: "Mirza" },
  { value: "Joint", label: "Joint" },
];

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "bank",
    owner: "Joint",
    openingBalance: 0,
    isActive: true,
  });

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/accounts");
      setItems(res.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(() => items.filter((a) => a.isActive !== false).length, [items]);

  function reset() {
    setEditing(null);
    setForm({ name: "", type: "bank", owner: "Joint", openingBalance: 0, isActive: true });
  }

  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (!form.name.trim()) return setMsg("Account name is required");
      const payload = {
        ...form,
        name: form.name.trim(),
        openingBalance: Number(form.openingBalance || 0),
      };

      if (editing?._id) {
        await api.put(`/api/accounts/${editing._id}`, payload);
      } else {
        await api.post("/api/accounts", payload);
      }

      reset();
      await load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Save failed");
    }
  }

  function startEdit(a) {
    setEditing(a);
    setForm({
      name: a.name || "",
      type: a.type || "bank",
      owner: a.owner || "Joint",
      openingBalance: a.openingBalance || 0,
      isActive: a.isActive !== false,
    });
  }

  async function remove(id) {
    const ok = confirm("Delete this account?");
    if (!ok) return;
    try {
      await api.delete(`/api/accounts/${id}`);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Accounts</h3>
          <p className="text-sm text-gray-600">
            Create Bank/Cash/bKash/DPS accounts. Savings deposits will be recorded as <b>Transfer</b> later.
          </p>
        </div>
        <div className="text-sm text-gray-600">Active: {activeCount}/{items.length}</div>
      </div>

      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">{editing ? "Edit Account" : "Add Account"}</h4>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Bank (Joint), Cash, bKash, DPS"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Owner</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                >
                  {OWNERS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Opening Balance</label>
                <input
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editing && (
                <button
                  type="button"
                  onClick={reset}
                  className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="bg-black text-white rounded-md px-4 py-2 text-sm">
                Save
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-3 border-b text-sm font-medium">All Accounts</div>
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-gray-600 text-sm">No accounts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3 text-right">Opening</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.isActive !== false ? "Active" : "Inactive"}</div>
                    </td>
                    <td className="p-3">{a.type}</td>
                    <td className="p-3">{a.owner}</td>
                    <td className="p-3 text-right">{Number(a.openingBalance || 0).toLocaleString("en-BD")}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => startEdit(a)}
                        className="text-sm border rounded-md px-3 py-1 hover:bg-gray-50 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(a._id)}
                        className="text-sm border rounded-md px-3 py-1 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
