import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Accounts from "./Accounts";

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm border ${
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={onEdit}
        className="text-sm border rounded-md px-3 py-1 hover:bg-gray-50"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="text-sm border rounded-md px-3 py-1 hover:bg-gray-50"
      >
        Delete
      </button>
    </div>
  );
}

export default function Settings() {
  const tabs = useMemo(
    () => [
      { key: "incomeCats", label: "Income Categories" },
      { key: "expenseCats", label: "Expense Categories" },
      { key: "methods", label: "Payment Methods" },
      { key: "cards", label: "Card Labels" },

      // ✅ NEW TAB
      { key: "accounts", label: "Accounts" },
    ],
    []
  );

  const [active, setActive] = useState("incomeCats");

  // data
  const [incomeCats, setIncomeCats] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [methods, setMethods] = useState([]);
  const [cards, setCards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // modal state
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    type: "",
    data: null,
  });
  const [form, setForm] = useState({ name: "", label: "", last4: "" });

  async function loadAll() {
    setLoading(true);
    setMsg("");
    try {
      const [inc, exp, pm, cl] = await Promise.all([
        api.get("/api/categories", { params: { kind: "income" } }),
        api.get("/api/categories", { params: { kind: "expense" } }),
        api.get("/api/payment-methods"),
        api.get("/api/card-labels"),
      ]);
      setIncomeCats(inc.data.items || []);
      setExpenseCats(exp.data.items || []);
      setMethods(pm.data.items || []);
      setCards(cl.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openAdd(type) {
    setModal({ open: true, mode: "add", type, data: null });
    setForm({ name: "", label: "", last4: "" });
    setMsg("");
  }

  function openEdit(type, item) {
    setModal({ open: true, mode: "edit", type, data: item });
    if (type === "cards")
      setForm({ name: "", label: item.label || "", last4: item.last4 || "" });
    else setForm({ name: item.name || "", label: "", last4: "" });
    setMsg("");
  }

  function closeModal() {
    setModal({ open: false, mode: "add", type: "", data: null });
    setForm({ name: "", label: "", last4: "" });
  }

  async function saveModal() {
    try {
      const { mode, type, data } = modal;

      // categories
      if (type === "incomeCats" || type === "expenseCats") {
        const kind = type === "incomeCats" ? "income" : "expense";
        if (mode === "add") {
          await api.post("/api/categories", { kind, name: form.name });
        } else {
          await api.put(`/api/categories/${data._id}`, { name: form.name });
        }
      }

      // payment methods
      if (type === "methods") {
        if (mode === "add") {
          await api.post("/api/payment-methods", { name: form.name });
        } else {
          await api.put(`/api/payment-methods/${data._id}`, { name: form.name });
        }
      }

      // card labels
      if (type === "cards") {
        if (mode === "add") {
          await api.post("/api/card-labels", {
            label: form.label,
            last4: form.last4,
          });
        } else {
          await api.put(`/api/card-labels/${data._id}`, {
            label: form.label,
            last4: form.last4,
          });
        }
      }

      closeModal();
      await loadAll();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Save failed");
    }
  }

  async function deleteItem(type, id) {
    const ok = confirm("Delete this item?");
    if (!ok) return;

    try {
      if (type === "incomeCats" || type === "expenseCats") {
        await api.delete(`/api/categories/${id}`);
      }
      if (type === "methods") {
        await api.delete(`/api/payment-methods/${id}`);
      }
      if (type === "cards") {
        await api.delete(`/api/card-labels/${id}`);
      }
      await loadAll();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  const currentList =
    active === "incomeCats"
      ? incomeCats
      : active === "expenseCats"
      ? expenseCats
      : active === "methods"
      ? methods
      : cards;

  const activeLabel = tabs.find((t) => t.key === active)?.label;

  // ✅ If accounts tab, we don't use the shared modal/table
  const isAccountsTab = active === "accounts";

  return (
    <AppLayout>
      <div className="">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-gray-600 text-sm">
              Configure categories and payment options. These will be used in
              Income/Expenses later.
            </p>
          </div>

          {/* ✅ Disable Add for Accounts tab */}
          <button
            onClick={() => openAdd(active)}
            className={`rounded-md px-4 py-2 text-sm ${
              isAccountsTab
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-black text-white"
            }`}
            disabled={isAccountsTab}
            title={isAccountsTab ? "Use Accounts page to manage accounts" : ""}
          >
            + Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((t) => (
            <TabButton
              key={t.key}
              active={active === t.key}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </TabButton>
          ))}
        </div>

        {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

        {/* ✅ Accounts tab renders its own page */}
        {isAccountsTab ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-3 border-b text-sm font-medium">{activeLabel}</div>
            <div className="p-3">
              <Accounts />
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-3 border-b text-sm font-medium">{activeLabel}</div>

            {loading ? (
              <div className="p-4">Loading...</div>
            ) : currentList.length === 0 ? (
              <div className="p-4 text-gray-600 text-sm">
                No items yet. Click “Add”.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="p-3">Name</th>
                    {active === "cards" && (
                      <th className="p-3">Last 4 (optional)</th>
                    )}
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="p-3">
                        {active === "cards" ? item.label : item.name}
                      </td>
                      {active === "cards" && (
                        <td className="p-3">{item.last4 || "-"}</td>
                      )}
                      <td className="p-3">
                        <RowActions
                          onEdit={() => openEdit(active, item)}
                          onDelete={() => deleteItem(active, item._id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal (not used for Accounts) */}
        {modal.open && !isAccountsTab && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg border p-5">
              <h3 className="text-lg font-semibold mb-1">
                {modal.mode === "add" ? "Add" : "Edit"}{" "}
                {tabs.find((t) => t.key === modal.type)?.label}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Keep names short and clear.
              </p>

              {(modal.type === "incomeCats" ||
                modal.type === "expenseCats" ||
                modal.type === "methods") && (
                <>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 mb-4"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g., Salary / Utilities / Cash"
                  />
                </>
              )}

              {modal.type === "cards" && (
                <>
                  <label className="text-sm font-medium">Card Label</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 mb-3"
                    value={form.label}
                    onChange={(e) =>
                      setForm({ ...form, label: e.target.value })
                    }
                    placeholder="e.g., EBL Credit Card"
                  />

                  <label className="text-sm font-medium">
                    Last 4 digits (optional)
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2 mb-4"
                    value={form.last4}
                    onChange={(e) =>
                      setForm({ ...form, last4: e.target.value })
                    }
                    placeholder="e.g., 1234"
                  />
                </>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={closeModal}
                  className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModal}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm"
                  disabled={
                    modal.type === "cards"
                      ? !form.label.trim()
                      : !form.name.trim()
                  }
                >
                  Save
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