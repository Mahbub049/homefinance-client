import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Accounts from "./Accounts";

function moneyCount(n) {
  return Number(n || 0);
}

function TabPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
        "border",
        active
          ? "bg-black text-white border-black shadow-sm"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 justify-end">
      <IconButton onClick={onEdit} title="Edit">
        Edit
      </IconButton>
      <IconButton onClick={onDelete} title="Delete">
        Delete
      </IconButton>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center justify-between gap-3 py-3">
      <div className="h-4 w-44 rounded bg-gray-200" />
      <div className="h-8 w-32 rounded bg-gray-200" />
    </div>
  );
}

export default function Settings() {
  const tabs = useMemo(
    () => [
      { key: "incomeCats", label: "Income Categories", hint: "e.g., Salary" },
      { key: "expenseCats", label: "Expense Categories", hint: "e.g., Grocery" },
      { key: "methods", label: "Payment Methods", hint: "e.g., Cash / Bank" },
      { key: "cards", label: "Card Labels", hint: "e.g., EBL Card • 1234" },

      // ✅ NEW TAB
      { key: "accounts", label: "Accounts", hint: "" },
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

  // ui
  const [q, setQ] = useState("");

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

  useEffect(() => {
    // Reset search when changing tabs for a cleaner UX
    setQ("");
  }, [active]);

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

  const isAccountsTab = active === "accounts";
  const activeLabel = tabs.find((t) => t.key === active)?.label || "Settings";
  const activeHint = tabs.find((t) => t.key === active)?.hint || "";

  const currentList =
    active === "incomeCats"
      ? incomeCats
      : active === "expenseCats"
        ? expenseCats
        : active === "methods"
          ? methods
          : cards;

  const filteredList = useMemo(() => {
    if (isAccountsTab) return [];
    const s = q.trim().toLowerCase();
    if (!s) return currentList;

    return (currentList || []).filter((item) => {
      const text =
        active === "cards"
          ? `${item.label || ""} ${item.last4 || ""}`
          : `${item.name || ""}`;
      return text.toLowerCase().includes(s);
    });
  }, [q, currentList, isAccountsTab, active]);

  const addDisabled = isAccountsTab;

  return (
    <AppLayout>
      <div className="mx-auto">
        {/* Header card */}
        <div className="mb-5 rounded-xl border bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage categories and payment options used in Income/Expenses.
              </p>
            </div>

            <button
              onClick={() => openAdd(active)}
              className={[
                "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition",
                addDisabled
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                  : "bg-black text-white hover:opacity-90",
              ].join(" ")}
              disabled={addDisabled}
              title={addDisabled ? "Use Accounts page to manage accounts" : ""}
            >
              + Add {addDisabled ? "" : activeLabel}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <TabPill
                key={t.key}
                active={active === t.key}
                onClick={() => setActive(t.key)}
              >
                {t.label}
              </TabPill>
            ))}
          </div>
        </div>

        {msg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {msg}
          </div>
        )}

        {/* Content */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">{activeLabel}</div>
              {!isAccountsTab && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {activeHint || "Keep names short and clear."}
                </div>
              )}
            </div>

            {!isAccountsTab && (
              <div className="flex w-full gap-2 sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <input
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={`Search ${activeLabel.toLowerCase()}...`}
                  />
                </div>
                <div className="hidden sm:flex items-center rounded-lg border border-gray-200 px-3 text-sm text-gray-600">
                  {moneyCount(filteredList.length)} item(s)
                </div>
              </div>
            )}
          </div>

          {/* Accounts tab renders its own page */}
          {isAccountsTab ? (
            <div className="p-4">
              <Accounts />
            </div>
          ) : loading ? (
            <div className="p-4">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100" />
              <div className="text-sm font-medium text-gray-900">
                No items found
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {q.trim()
                  ? "Try a different search keyword."
                  : "Click “Add” to create your first item."}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr className="text-left">
                      <th className="p-3 font-medium">Name</th>
                      {active === "cards" && (
                        <th className="p-3 font-medium">Last 4</th>
                      )}
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => (
                      <tr key={item._id} className="border-t hover:bg-gray-50/60">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {active === "cards" ? item.label : item.name}
                          </div>
                          {active === "cards" && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Card label
                            </div>
                          )}
                        </td>

                        {active === "cards" && (
                          <td className="p-3 text-gray-700">
                            {item.last4 || "-"}
                          </td>
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
              </div>

              {/* Mobile list */}
              <div className="sm:hidden divide-y">
                {filteredList.map((item) => (
                  <div key={item._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {active === "cards" ? item.label : item.name}
                        </div>
                        {active === "cards" && (
                          <div className="text-sm text-gray-600 mt-1">
                            Last 4:{" "}
                            <span className="font-medium">
                              {item.last4 || "-"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <IconButton onClick={() => openEdit(active, item)}>
                          Edit
                        </IconButton>
                        <IconButton
                          onClick={() => deleteItem(active, item._id)}
                        >
                          Delete
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal (not used for Accounts) */}
        {modal.open && !isAccountsTab && (
          <div className="app-modal-overlay--center">
            <div className="app-modal-panel max-w-md overflow-hidden rounded-xl">
              <div className="border-b p-4">
                <div className="text-lg font-semibold">
                  {modal.mode === "add" ? "Add" : "Edit"}{" "}
                  {tabs.find((t) => t.key === modal.type)?.label}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Keep names short and consistent.
                </div>
              </div>

              <div className="p-4">
                {(modal.type === "incomeCats" ||
                  modal.type === "expenseCats" ||
                  modal.type === "methods") && (
                    <>
                      <label className="text-sm font-medium text-gray-800">
                        Name
                      </label>
                      <input
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                    <label className="text-sm font-medium text-gray-800">
                      Card Label
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                      value={form.label}
                      onChange={(e) =>
                        setForm({ ...form, label: e.target.value })
                      }
                      placeholder="e.g., EBL Credit Card"
                    />

                    <label className="mt-4 block text-sm font-medium text-gray-800">
                      Last 4 digits (optional)
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                      value={form.last4}
                      onChange={(e) =>
                        setForm({ ...form, last4: e.target.value })
                      }
                      placeholder="e.g., 1234"
                    />
                  </>
                )}

                {msg && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {msg}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t p-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModal}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  disabled={
                    modal.type === "cards"
                      ? !form.label.trim()
                      : !form.name.trim()
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