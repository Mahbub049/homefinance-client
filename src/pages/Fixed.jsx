import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={classNames("inline-flex items-center px-2 py-0.5 rounded-full text-xs border", tones[tone])}>
      {children}
    </span>
  );
}

function IconButton({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm",
        danger ? "border-red-200 text-red-700 hover:bg-red-50" : "hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

function Tab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-3 py-2 text-sm rounded-md border transition",
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium">{label}</label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Switch({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc ? <div className="text-xs text-gray-500 mt-0.5">{desc}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={classNames(
          "relative inline-flex h-6 w-11 items-center rounded-full transition border",
          checked ? "bg-black border-black" : "bg-gray-200 border-gray-300"
        )}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={classNames(
            "inline-block h-5 w-5 transform rounded-full bg-white transition",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

export default function Fixed() {
  const me = getUser();
  const [tab, setTab] = useState("templates"); // templates | instances
  const [month, setMonth] = useState(monthNow());
  const [msg, setMsg] = useState("");

  const [members, setMembers] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);

  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteKind, setDeleteKind] = useState(""); // "template" | "instance"
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  // UI helpers
  const [q, setQ] = useState("");
  const [filterVar, setFilterVar] = useState("all"); // all | variable | fixed
  const [filterStatus, setFilterStatus] = useState("all"); // all | pending | posted

  // modal for template
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    fromAccountId: "",
    isVariable: false,
    defaultAmount: "",
    defaultSplitType: "equal",
    personalUserId: "",
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
  });

  const otherMember = useMemo(() => {
    const other = members.find((m) => m.id !== me?.id);
    return other || null;
  }, [members, me]);

  async function loadBasics() {
    const [mRes, exp, acc] = await Promise.all([
      api.get("/api/family/members"),
      api.get("/api/categories", { params: { kind: "expense" } }),
      api.get("/api/accounts"),
    ]);
    setMembers(mRes.data.members || []);
    setExpenseCats(exp.data.items || []);
    setAccounts(acc.data.items || []);
  }

  async function loadTemplates() {
    const res = await api.get("/api/fixed/templates");
    setTemplates(res.data.items || []);
  }

  async function loadInstances() {
    const res = await api.get("/api/fixed/instances", { params: { month } });
    setInstances(res.data.items || []);
  }

  async function loadAll() {
    setLoading(true);
    setMsg("");
    try {
      await loadBasics();
      await Promise.all([loadTemplates(), loadInstances()]);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadInstances();
  }, [month]);

  // ✅ ONLY NEW FUNCTION YOU NEED
  async function addTemplateToMonth(templateId) {
    setMsg("");
    try {
      await api.post(`/api/fixed/templates/${templateId}/add`, { month });
      // switch to This Month and refresh
      setTab("instances");
      await loadInstances();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Add failed");
    }
  }

  function openModal() {
    setMsg("");
    const defaultUser = members?.[0]?.id || "";
    const defaultAcc = accounts?.[0]?._id || "";
    setForm((f) => ({
      ...f,
      personalUserId: f.personalUserId || defaultUser,
      fromAccountId: f.fromAccountId || defaultAcc,
    }));
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  async function createTemplate() {
    setMsg("");
    try {
      if (!form.name.trim()) return setMsg("Name required");
      if (!form.categoryId) return setMsg("Select category");
      if (!form.fromAccountId) return setMsg("Select pay-from account");
      const amt = form.defaultAmount === "" ? null : Number(form.defaultAmount);
      if (!form.isVariable && (!amt || amt <= 0)) return setMsg("Amount must be > 0 (or mark Variable)");

      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        fromAccountId: form.fromAccountId,
        isVariable: !!form.isVariable,
        defaultAmount: form.isVariable ? null : amt,
        defaultSplitType: form.defaultSplitType,
      };

      if (form.defaultSplitType === "personal") {
        payload.personalUserId = form.personalUserId;
      }

      if (form.defaultSplitType === "ratio") {
        if (!otherMember) return setMsg("Need 2 members for ratio");
        payload.ratios = [
          { userId: me.id, ratio: Number(form.ratioMe) },
          { userId: otherMember.id, ratio: Number(form.ratioOther) },
        ];
      }

      if (form.defaultSplitType === "fixed") {
        if (!otherMember) return setMsg("Need 2 members for fixed");
        payload.fixed = [
          { userId: me.id, amount: Number(form.fixedMe || 0) },
          { userId: otherMember.id, amount: Number(form.fixedOther || 0) },
        ];
      }

      await api.post("/api/fixed/templates", payload);
      closeModal();
      await loadTemplates();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Create template failed");
    }
  }

  async function postVariableInstance(instanceId, amount) {
    setMsg("");
    try {
      const amt = Number(amount);
      if (!amt || amt <= 0) return setMsg("Amount must be > 0");
      await api.post(`/api/fixed/instances/${instanceId}/post`, { amount: amt });
      await loadInstances();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Post failed");
    }
  }

  function deleteTemplate(id) {
    setDeleteKind("template");
    setDeleteId(id);
    setConfirmTitle("Delete Template");
    setConfirmMessage("Are you sure you want to delete this template?");
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);

    try {
      if (deleteKind === "template") {
        await api.delete(`/api/fixed/templates/${deleteId}`);
        await loadTemplates();
      }

      if (deleteKind === "instance") {
        await api.delete(`/api/fixed/instances/${deleteId}`);
        await loadInstances();
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setDeleteId(null);
      setDeleteKind("");
    }
  }

  async function generateMonth() {
    setMsg("");
    try {
      const res = await api.post("/api/fixed/generate", { month });
      setMsg(`Generated: ${res.data.createdCount} items for ${month}`);
      await loadInstances();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Generate failed");
    }
  }

  function deleteInstance(id) {
    setDeleteKind("instance");
    setDeleteId(id);
    setConfirmTitle("Delete Month Item");
    setConfirmMessage("Are you sure you want to delete this month item?");
    setConfirmOpen(true);
  }

  const filteredTemplates = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return templates
      .filter((t) => {
        if (!qq) return true;
        const a = t.name?.toLowerCase() || "";
        const b = t.categoryId?.name?.toLowerCase() || "";
        const c = t.fromAccountId?.name?.toLowerCase() || "";
        return a.includes(qq) || b.includes(qq) || c.includes(qq);
      })
      .filter((t) => {
        if (filterVar === "all") return true;
        return filterVar === "variable" ? !!t.isVariable : !t.isVariable;
      });
  }, [templates, q, filterVar]);

  const filteredInstances = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return instances
      .filter((i) => {
        if (!qq) return true;
        const name = i.templateId?.name?.toLowerCase() || "";
        const note = (i.note || "").toLowerCase();
        return name.includes(qq) || note.includes(qq);
      })
      .filter((i) => {
        if (filterStatus === "all") return true;
        return filterStatus === i.status;
      });
  }, [instances, q, filterStatus]);

  return (
    <AppLayout>
      <div className="mx-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[#f6f7f9] pt-2">
          <div className="bg-white border rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Fixed Expenses</h2>
              <p className="text-sm text-gray-600">
                Templates = recurring rules. This Month = generated items you can post.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                type="month"
                className="border rounded-md px-3 py-2 text-sm bg-white"
              />

              {tab === "templates" ? (
                <button onClick={openModal} className="bg-black text-white rounded-md px-4 py-2 text-sm">
                  + Add Template
                </button>
              ) : (
                <button onClick={generateMonth} className="bg-black text-white rounded-md px-4 py-2 text-sm">
                  Generate Month
                </button>
              )}
            </div>
          </div>

          {/* Tabs + search + filters */}
          <div className="mt-3 bg-white border rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex gap-2">
              <Tab active={tab === "templates"} onClick={() => setTab("templates")}>
                Templates
              </Tab>
              <Tab active={tab === "instances"} onClick={() => setTab("instances")}>
                This Month <span className="opacity-80">({month})</span>
              </Tab>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-end w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tab === "templates" ? "Search templates..." : "Search month items..."}
                  className="w-full border rounded-md pl-3 pr-3 py-2 text-sm bg-white"
                />
              </div>

              {tab === "templates" ? (
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={filterVar}
                  onChange={(e) => setFilterVar(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="variable">Variable Amount</option>
                </select>
              ) : (
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="posted">Posted</option>
                </select>
              )}
            </div>
          </div>

          {msg && <div className="mt-2 text-sm text-blue-700">{msg}</div>}
        </div>

        {loading ? (
          <div className="mt-4 bg-white border rounded-xl p-4">Loading...</div>
        ) : tab === "templates" ? (
          <div className="mt-4">
            {filteredTemplates.length === 0 ? (
              <div className="bg-white border rounded-xl p-6 text-sm text-gray-600">
                <div className="font-medium mb-1">No templates found.</div>
                <div>Create your first template (Rent, Internet, Electricity as Variable, etc.).</div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map((t) => (
                  <div key={t._id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {t.categoryId?.name || "—"} • Pay from: {t.fromAccountId?.name || "—"}
                        </div>
                      </div>
                      <Pill tone={t.isVariable ? "yellow" : "green"}>{t.isVariable ? "Variable" : "Fixed"}</Pill>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="text-xs text-gray-500">Default Amount</div>
                        <div className="font-medium">{t.isVariable ? "—" : t.defaultAmount}</div>
                      </div>
                      <div className="text-sm text-right">
                        <div className="text-xs text-gray-500">Split</div>
                        <div className="font-medium">
                          {t.defaultSplitType === "equal" && <Pill tone="gray">Equal</Pill>}
                          {t.defaultSplitType === "personal" && <Pill tone="blue">Personal</Pill>}
                          {t.defaultSplitType === "ratio" && <Pill tone="blue">Ratio</Pill>}
                          {t.defaultSplitType === "fixed" && <Pill tone="blue">Fixed</Pill>}
                        </div>
                      </div>
                    </div>

                    {/* ✅ ONLY UI CHANGE: Add button beside delete */}
                    <div className="mt-4 flex justify-end gap-2">
                      <IconButton onClick={() => addTemplateToMonth(t._id)}>
                        Add to this month
                      </IconButton>

                      <IconButton danger onClick={() => deleteTemplate(t._id)}>
                        Delete
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {filteredInstances.length === 0 ? (
              <div className="bg-white border rounded-xl p-6 text-sm text-gray-600">
                <div className="font-medium mb-1">No items for this month.</div>
                <div>
                  Click <b>Generate Month</b> to create month items from templates.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInstances.map((i) => (
                  <div key={i._id} className="bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold truncate">{i.templateId?.name || "—"}</div>
                        <Pill tone={i.status === "pending" ? "yellow" : "green"}>{i.status}</Pill>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {i.note ? `Note: ${i.note}` : "No note"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="font-medium">{i.status === "posted" ? i.amount : "—"}</div>
                      </div>

                      {i.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            className="w-28 border rounded-md px-2 py-2 text-sm"
                            placeholder="Amount"
                            value={i._draftAmount || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setInstances((prev) =>
                                prev.map((x) => (x._id === i._id ? { ...x, _draftAmount: v } : x))
                              );
                            }}
                          />
                          <button
                            className="bg-black text-white rounded-md px-3 py-2 text-sm"
                            onClick={() => postVariableInstance(i._id, i._draftAmount)}
                          >
                            Post
                          </button>
                        </div>
                      )}

                      <IconButton danger onClick={() => deleteInstance(i._id)}>
                        Delete
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-xl bg-white border rounded-2xl p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Add Template</h3>
                  <p className="text-sm text-gray-500">Fixed = auto amount. Variable = you enter amount monthly.</p>
                </div>
                <button onClick={closeModal} className="text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50">
                  Close
                </button>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Field label="Name" hint="Example: House Rent / Electricity Bill">
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Electricity Bill"
                    />
                  </Field>
                </div>

                <Field label="Category">
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
                </Field>

                <Field label="Pay From Account">
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.fromAccountId}
                    onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                  >
                    <option value="">Select</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="md:col-span-2">
                  <Switch
                    checked={form.isVariable}
                    onChange={(v) => setForm({ ...form, isVariable: v, defaultAmount: "" })}
                    label="Variable amount"
                    desc="For bills like Electricity/Gas. Generates as Pending each month and you enter amount when paying."
                  />
                </div>

                <Field label="Default Amount" hint={form.isVariable ? "Disabled for Variable templates" : ""}>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.defaultAmount}
                    onChange={(e) => setForm({ ...form, defaultAmount: e.target.value })}
                    placeholder="e.g., 20000"
                    disabled={form.isVariable}
                  />
                </Field>

                <Field label="Split Type" hint="How to split between members">
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.defaultSplitType}
                    onChange={(e) => setForm({ ...form, defaultSplitType: e.target.value })}
                  >
                    <option value="equal">Equal</option>
                    <option value="personal">Personal</option>
                    <option value="ratio">Ratio</option>
                    <option value="fixed">Fixed Amounts</option>
                  </select>
                </Field>

                {form.defaultSplitType === "personal" && (
                  <div className="md:col-span-2">
                    <Field label="Personal For">
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
                    </Field>
                  </div>
                )}

                {form.defaultSplitType === "ratio" && otherMember && (
                  <>
                    <Field label="My %">
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.ratioMe}
                        onChange={(e) => setForm({ ...form, ratioMe: e.target.value })}
                      />
                    </Field>
                    <Field label={`${otherMember.name} %`}>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.ratioOther}
                        onChange={(e) => setForm({ ...form, ratioOther: e.target.value })}
                      />
                    </Field>
                    <div className="md:col-span-2 text-xs text-gray-500">Tip: Make sure total is 100.</div>
                  </>
                )}

                {form.defaultSplitType === "fixed" && otherMember && (
                  <>
                    <Field label="My Amount">
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.fixedMe}
                        onChange={(e) => setForm({ ...form, fixedMe: e.target.value })}
                        placeholder="e.g., 10000"
                      />
                    </Field>
                    <Field label={`${otherMember.name} Amount`}>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={form.fixedOther}
                        onChange={(e) => setForm({ ...form, fixedOther: e.target.value })}
                        placeholder="e.g., 6000"
                      />
                    </Field>
                    <div className="md:col-span-2 text-xs text-gray-500">Tip: Total should match the final amount you expect.</div>
                  </>
                )}
              </div>

              {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

              <div className="flex justify-end gap-2 mt-5">
                <button onClick={closeModal} className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={createTemplate} className="bg-black text-white rounded-md px-4 py-2 text-sm">
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </AppLayout>
  );
}