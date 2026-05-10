import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function getId(value) {
  return String(value?._id || value?.id || value || "");
}

function toDateInput(value) {
  if (!value) return todayDate();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayDate();
  return d.toISOString().slice(0, 10);
}

function findByUserId(rows = [], userId, key, fallback = "") {
  const target = getId(userId);
  const row = rows.find((r) => getId(r.userId) === target);
  return row?.[key] ?? fallback;
}

function blankTemplateForm(defaultMemberId = "") {
  return {
    name: "",
    categoryId: "",
    isVariable: false,
    defaultAmount: "",
    defaultSplitType: "equal",
    personalUserId: defaultMemberId,
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
  };
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

  const [tab, setTab] = useState("templates");
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
  const [deleteKind, setDeleteKind] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const [q, setQ] = useState("");
  const [filterVar, setFilterVar] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState("create");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState(() => blankTemplateForm());

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paidByUserId: "",
    fromAccountId: "",
    paymentDate: todayDate(),
    amount: "",
    note: "",
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

  function openTemplateModal() {
    setMsg("");
    setTemplateMode("create");
    setEditingTemplateId(null);
    setTemplateForm(blankTemplateForm(members?.[0]?.id || ""));
    setTemplateOpen(true);
  }

  function openEditTemplateModal(template) {
    setMsg("");
    setTemplateMode("edit");
    setEditingTemplateId(template._id);

    setTemplateForm({
      name: template?.name || "",
      categoryId: getId(template?.categoryId),
      isVariable: !!template?.isVariable,
      defaultAmount: template?.isVariable ? "" : String(template?.defaultAmount || ""),
      defaultSplitType: template?.defaultSplitType || "equal",
      personalUserId: getId(template?.personalUserId) || members?.[0]?.id || "",
      ratioMe: findByUserId(template?.ratios || [], me?.id, "ratio", 50),
      ratioOther: otherMember
        ? findByUserId(template?.ratios || [], otherMember.id, "ratio", 50)
        : 50,
      fixedMe: findByUserId(template?.fixed || [], me?.id, "amount", ""),
      fixedOther: otherMember
        ? findByUserId(template?.fixed || [], otherMember.id, "amount", "")
        : "",
    });

    setTemplateOpen(true);
  }

  function closeTemplateModal() {
    setTemplateOpen(false);
    setTemplateMode("create");
    setEditingTemplateId(null);
  }

  function buildTemplatePayload() {
    if (!templateForm.name.trim()) {
      setMsg("Name required");
      return null;
    }

    if (!templateForm.categoryId) {
      setMsg("Select category");
      return null;
    }

    const amt = templateForm.defaultAmount === "" ? null : Number(templateForm.defaultAmount);

    if (!templateForm.isVariable && (!amt || amt <= 0)) {
      setMsg("Amount must be > 0 (or mark Variable)");
      return null;
    }

    const payload = {
      name: templateForm.name.trim(),
      categoryId: templateForm.categoryId,
      isVariable: !!templateForm.isVariable,
      defaultAmount: templateForm.isVariable ? null : amt,
      defaultSplitType: templateForm.defaultSplitType,
      personalUserId: null,
      ratios: [],
      fixed: [],
    };

    if (templateForm.defaultSplitType === "personal") {
      if (!templateForm.personalUserId) {
        setMsg("Select personal member");
        return null;
      }
      payload.personalUserId = templateForm.personalUserId;
    }

    if (templateForm.defaultSplitType === "ratio") {
      if (!otherMember) {
        setMsg("Need 2 members for ratio");
        return null;
      }

      payload.ratios = [
        { userId: me.id, ratio: Number(templateForm.ratioMe || 0) },
        { userId: otherMember.id, ratio: Number(templateForm.ratioOther || 0) },
      ];
    }

    if (templateForm.defaultSplitType === "fixed") {
      if (!otherMember) {
        setMsg("Need 2 members for fixed");
        return null;
      }

      payload.fixed = [
        { userId: me.id, amount: Number(templateForm.fixedMe || 0) },
        { userId: otherMember.id, amount: Number(templateForm.fixedOther || 0) },
      ];
    }

    return payload;
  }

  async function saveTemplate() {
    setMsg("");

    try {
      const payload = buildTemplatePayload();
      if (!payload) return;

      if (templateMode === "edit" && editingTemplateId) {
        await api.put(`/api/fixed/templates/${editingTemplateId}`, payload);
      } else {
        await api.post("/api/fixed/templates", payload);
      }

      closeTemplateModal();
      await loadTemplates();
    } catch (e) {
      setMsg(e?.response?.data?.message || (templateMode === "edit" ? "Update template failed" : "Create template failed"));
    }
  }

  function openPaymentModalForTemplate(template) {
    setMsg("");
    setPaymentMode("template");
    setSelectedTemplate(template);
    setSelectedInstance(null);

    setPaymentForm({
      paidByUserId: members?.[0]?.id || "",
      fromAccountId: accounts?.[0]?._id || "",
      paymentDate: todayDate(),
      amount: template?.isVariable ? "" : String(template?.defaultAmount || ""),
      note: "",
    });

    setPaymentOpen(true);
  }

  function openPaymentModalForInstance(instance) {
    setMsg("");
    setPaymentMode("instance");
    setSelectedTemplate(instance.templateId || null);
    setSelectedInstance(instance);

    setPaymentForm({
      paidByUserId: members?.[0]?.id || "",
      fromAccountId: accounts?.[0]?._id || "",
      paymentDate: todayDate(),
      amount:
        instance?.templateId?.isVariable
          ? String(instance?.amount || "")
          : String(instance?.templateId?.defaultAmount || ""),
      note: instance?.note || "",
    });

    setPaymentOpen(true);
  }

  function openEditPaymentModal(instance) {
    setMsg("");
    setPaymentMode("edit");
    setSelectedTemplate(instance.templateId || null);
    setSelectedInstance(instance);

    setPaymentForm({
      paidByUserId: getId(instance?.paidByUserId) || members?.[0]?.id || "",
      fromAccountId: getId(instance?.fromAccountId) || accounts?.[0]?._id || "",
      paymentDate: toDateInput(instance?.date),
      amount: String(instance?.amount || instance?.templateId?.defaultAmount || ""),
      note: instance?.note || "",
    });

    setPaymentOpen(true);
  }

  function closePaymentModal() {
    setPaymentOpen(false);
    setPaymentMode("template");
    setSelectedTemplate(null);
    setSelectedInstance(null);
  }

  async function submitPaymentModal() {
    setMsg("");

    try {
      if (!paymentForm.paidByUserId) return setMsg("Select who is paying");
      if (!paymentForm.fromAccountId) return setMsg("Select account");
      if (!paymentForm.paymentDate) return setMsg("Select payment date");

      const isVariable = !!selectedTemplate?.isVariable;
      const amountCanBeEdited = isVariable || paymentMode === "edit";
      if (amountCanBeEdited) {
        const amt = Number(paymentForm.amount);
        if (!amt || amt <= 0) return setMsg("Amount must be > 0");
      }

      if (paymentMode === "template" && selectedTemplate?._id) {
        await api.post(`/api/fixed/templates/${selectedTemplate._id}/add`, {
          month,
          paidByUserId: paymentForm.paidByUserId,
          fromAccountId: paymentForm.fromAccountId,
          paymentDate: paymentForm.paymentDate,
          amount: isVariable ? Number(paymentForm.amount) : undefined,
          note: paymentForm.note,
        });
      }

      if (paymentMode === "instance" && selectedInstance?._id) {
        await api.post(`/api/fixed/instances/${selectedInstance._id}/post`, {
          paidByUserId: paymentForm.paidByUserId,
          fromAccountId: paymentForm.fromAccountId,
          paymentDate: paymentForm.paymentDate,
          amount: isVariable ? Number(paymentForm.amount) : undefined,
          note: paymentForm.note,
        });
      }

      if (paymentMode === "edit" && selectedInstance?._id) {
        await api.put(`/api/fixed/instances/${selectedInstance._id}`, {
          month,
          paidByUserId: paymentForm.paidByUserId,
          fromAccountId: paymentForm.fromAccountId,
          paymentDate: paymentForm.paymentDate,
          amount: Number(paymentForm.amount),
          note: paymentForm.note,
        });
      }

      closePaymentModal();
      setTab("instances");
      await loadInstances();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Action failed");
    }
  }

  function deleteTemplate(id) {
    setDeleteKind("template");
    setDeleteId(id);
    setConfirmTitle("Delete Template");
    setConfirmMessage("Are you sure you want to delete this template?");
    setConfirmOpen(true);
  }

  function deleteInstance(id) {
    setDeleteKind("instance");
    setDeleteId(id);
    setConfirmTitle("Delete Month Item");
    setConfirmMessage("Are you sure you want to delete this month item?");
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
      setMsg(`Generated: ${res.data.createdCount} pending items for ${month}`);
      setTab("instances");
      await loadInstances();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Generate failed");
    }
  }

  const filteredTemplates = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return templates
      .filter((t) => {
        if (!qq) return true;
        const a = t.name?.toLowerCase() || "";
        const b = t.categoryId?.name?.toLowerCase() || "";
        return a.includes(qq) || b.includes(qq);
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
        const paidBy = i.paidByUserId?.name?.toLowerCase() || "";
        const account = i.fromAccountId?.name?.toLowerCase() || "";
        return (
          name.includes(qq) ||
          note.includes(qq) ||
          paidBy.includes(qq) ||
          account.includes(qq)
        );
      })
      .filter((i) => {
        if (filterStatus === "all") return true;
        return filterStatus === i.status;
      });
  }, [instances, q, filterStatus]);

  return (
    <AppLayout>
      <div className="mx-auto">
        <div className="sticky top-0 z-10 bg-[#f6f7f9] pt-2">
          <div className="bg-white border rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Fixed Expenses</h2>
              <p className="text-sm text-gray-600">
                Templates store only rules. Payment details are selected when adding to a month.
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
                <button
                  onClick={openTemplateModal}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  + Add Template
                </button>
              ) : (
                <button
                  onClick={generateMonth}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  Generate Month
                </button>
              )}
            </div>
          </div>

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
          <Loader
            className="mt-4"
            text="Loading fixed expenses"
            subtext="Fetching templates and current month data"
          />
        ) : tab === "templates" ? (
          <div className="mt-4">
            {filteredTemplates.length === 0 ? (
              <div className="bg-white border rounded-xl p-6 text-sm text-gray-600">
                <div className="font-medium mb-1">No templates found.</div>
                <div>Create your first template like Rent, Internet, Electricity Bill, etc.</div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map((t) => (
                  <div key={t._id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {t.categoryId?.name || "—"}
                        </div>
                      </div>
                      <Pill tone={t.isVariable ? "yellow" : "green"}>
                        {t.isVariable ? "Variable" : "Fixed"}
                      </Pill>
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

                    <div className="mt-4 flex justify-end gap-2 flex-wrap">
                      <IconButton onClick={() => openPaymentModalForTemplate(t)}>
                        Add to this month
                      </IconButton>

                      <IconButton onClick={() => openEditTemplateModal(t)}>
                        Edit
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
                  You can generate pending month items or directly add from template.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInstances.map((i) => (
                  <div
                    key={i._id}
                    className="bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold truncate">{i.templateId?.name || "—"}</div>
                        <Pill tone={i.status === "pending" ? "yellow" : "green"}>{i.status}</Pill>
                        {i.templateId?.isVariable ? <Pill tone="yellow">Variable</Pill> : <Pill tone="green">Fixed</Pill>}
                      </div>

                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <div>Amount: {i.status === "posted" ? i.amount : "—"}</div>
                        <div>Paid By: {i.paidByUserId?.name || "—"}</div>
                        <div>Account: {i.fromAccountId?.name || "—"}</div>
                        <div>Date: {i.date ? new Date(i.date).toLocaleDateString() : "—"}</div>
                        {i.note ? <div>Note: {i.note}</div> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {i.status === "pending" ? (
                        <button
                          className="bg-black text-white rounded-md px-3 py-2 text-sm"
                          onClick={() => openPaymentModalForInstance(i)}
                        >
                          Post Now
                        </button>
                      ) : (
                        <IconButton onClick={() => openEditPaymentModal(i)}>
                          Edit
                        </IconButton>
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

        {templateOpen && (
          <div className="app-modal-overlay--center">
            <div className="app-modal-panel max-w-xl rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{templateMode === "edit" ? "Edit Template" : "Add Template"}</h3>
                  <p className="text-sm text-gray-500">
                    Template stores only recurring rule. Payment details will be selected later.
                  </p>
                </div>
                <button
                  onClick={closeTemplateModal}
                  className="text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Field label="Name" hint="Example: House Rent / Electricity Bill">
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="e.g., Electricity Bill"
                    />
                  </Field>
                </div>

                <Field label="Category">
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={templateForm.categoryId}
                    onChange={(e) => setTemplateForm({ ...templateForm, categoryId: e.target.value })}
                  >
                    <option value="">Select</option>
                    {expenseCats.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="md:col-span-2">
                  <Switch
                    checked={templateForm.isVariable}
                    onChange={(v) => setTemplateForm({ ...templateForm, isVariable: v, defaultAmount: "" })}
                    label="Variable amount"
                    desc="For bills like electricity/gas/water where amount changes monthly."
                  />
                </div>

                <Field label="Default Amount" hint={templateForm.isVariable ? "Disabled for variable templates" : ""}>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={templateForm.defaultAmount}
                    onChange={(e) => setTemplateForm({ ...templateForm, defaultAmount: e.target.value })}
                    placeholder="e.g., 20000"
                    disabled={templateForm.isVariable}
                  />
                </Field>

                <Field label="Split Type" hint="How to split between members">
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={templateForm.defaultSplitType}
                    onChange={(e) => setTemplateForm({ ...templateForm, defaultSplitType: e.target.value })}
                  >
                    <option value="equal">Equal</option>
                    <option value="personal">Personal</option>
                    <option value="ratio">Ratio</option>
                    <option value="fixed">Fixed Amounts</option>
                  </select>
                </Field>

                {templateForm.defaultSplitType === "personal" && (
                  <div className="md:col-span-2">
                    <Field label="Personal For">
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={templateForm.personalUserId}
                        onChange={(e) => setTemplateForm({ ...templateForm, personalUserId: e.target.value })}
                      >
                        <option value="">Select member</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {templateForm.defaultSplitType === "ratio" && otherMember && (
                  <>
                    <Field label="My %">
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={templateForm.ratioMe}
                        onChange={(e) => setTemplateForm({ ...templateForm, ratioMe: e.target.value })}
                      />
                    </Field>
                    <Field label={`${otherMember.name} %`}>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={templateForm.ratioOther}
                        onChange={(e) => setTemplateForm({ ...templateForm, ratioOther: e.target.value })}
                      />
                    </Field>
                  </>
                )}

                {templateForm.defaultSplitType === "fixed" && otherMember && (
                  <>
                    <Field label="My Amount">
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={templateForm.fixedMe}
                        onChange={(e) => setTemplateForm({ ...templateForm, fixedMe: e.target.value })}
                        placeholder="e.g., 10000"
                      />
                    </Field>
                    <Field label={`${otherMember.name} Amount`}>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        value={templateForm.fixedOther}
                        onChange={(e) => setTemplateForm({ ...templateForm, fixedOther: e.target.value })}
                        placeholder="e.g., 6000"
                      />
                    </Field>
                  </>
                )}
              </div>

              {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={closeTemplateModal}
                  className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  {templateMode === "edit" ? "Update Template" : "Save Template"}
                </button>
              </div>
            </div>
          </div>
        )}

        {paymentOpen && (
          <div className="app-modal-overlay--center">
            <div className="app-modal-panel max-w-lg rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {paymentMode === "template"
                      ? "Add to This Month"
                      : paymentMode === "edit"
                        ? "Edit Month Item"
                        : "Post Month Item"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedTemplate?.name || "Fixed Expense"}
                  </p>
                </div>
                <button
                  onClick={closePaymentModal}
                  className="text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <Field label="Who is paying">
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.paidByUserId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidByUserId: e.target.value })}
                  >
                    <option value="">Select member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="From which account">
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.fromAccountId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, fromAccountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Payment Date">
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  />
                </Field>

                {(selectedTemplate?.isVariable || paymentMode === "edit") && (
                  <Field label="Amount">
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded-md px-3 py-2"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="Enter amount"
                    />
                  </Field>
                )}

                {!selectedTemplate?.isVariable && paymentMode !== "edit" && (
                  <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                    Fixed Amount: <span className="font-semibold">{selectedTemplate?.defaultAmount || 0}</span>
                  </div>
                )}

                <Field label="Note (optional)">
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    placeholder="Optional note"
                  />
                </Field>
              </div>

              {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={closePaymentModal}
                  className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPaymentModal}
                  className="bg-black text-white rounded-md px-4 py-2 text-sm"
                >
                  {paymentMode === "edit" ? "Update" : "Confirm"}
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