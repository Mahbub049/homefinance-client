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

function money(value) {
  const n = Number(value || 0);
  return `৳ ${n.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function monthLabel(value) {
  if (!value) return "";
  const d = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function prettyDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function useLocalTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("homefinance-fixed-theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("homefinance-fixed-theme", theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  return [theme, setTheme];
}

function Pill({ children, tone = "gray", dark = false, className = "" }) {
  const lightTones = {
    gray: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };

  const darkTones = {
    gray: "bg-white/10 text-slate-200 border-white/10",
    green: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20",
    yellow: "bg-amber-400/10 text-amber-200 border-amber-300/20",
    blue: "bg-sky-400/10 text-sky-200 border-sky-300/20",
    red: "bg-rose-400/10 text-rose-200 border-rose-300/20",
    purple: "bg-violet-400/10 text-violet-200 border-violet-300/20",
  };

  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        dark ? darkTones[tone] : lightTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

function SoftButton({ children, onClick, type = "button", dark = false, danger = false, primary = false, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={classNames(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition active:scale-[0.98]",
        primary && "bg-slate-950 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800",
        primary && dark && "bg-white text-slate-950 hover:bg-slate-200 shadow-white/10",
        !primary && !danger && !dark && "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        !primary && !danger && dark && "border border-white/10 bg-white/10 text-slate-100 hover:bg-white/15",
        danger && !dark && "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        danger && dark && "border border-rose-300/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20",
        className
      )}
    >
      {children}
    </button>
  );
}

function Tab({ active, children, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "relative rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
        active && !dark && "bg-slate-950 text-white shadow-lg shadow-slate-900/15",
        active && dark && "bg-white text-slate-950 shadow-lg shadow-white/10",
        !active && !dark && "text-slate-600 hover:bg-white hover:text-slate-950",
        !active && dark && "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children, dark = false }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className={classNames("text-sm font-semibold", dark ? "text-slate-200" : "text-slate-700")}>{label}</label>
        {hint ? <span className={classNames("text-xs", dark ? "text-slate-400" : "text-slate-500")}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Switch({ checked, onChange, label, desc, dark = false }) {
  return (
    <div
      className={classNames(
        "flex items-start justify-between gap-3 rounded-2xl border p-4",
        dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
      )}
    >
      <div>
        <div className={classNames("text-sm font-semibold", dark ? "text-slate-100" : "text-slate-800")}>{label}</div>
        {desc ? <div className={classNames("mt-1 text-xs", dark ? "text-slate-400" : "text-slate-500")}>{desc}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={classNames(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
          checked ? "border-emerald-400 bg-emerald-500" : dark ? "border-white/10 bg-slate-800" : "border-slate-300 bg-slate-200"
        )}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={classNames(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

function StatCard({ title, value, sub, icon, accent = "from-sky-500 to-cyan-400", dark = false }) {
  return (
    <div
      className={classNames(
        "relative overflow-hidden rounded-3xl border p-4 shadow-sm",
        dark ? "border-white/10 bg-white/[0.06]" : "border-white/80 bg-white/90"
      )}
    >
      <div className={classNames("absolute -right-7 -top-7 h-24 w-24 rounded-full bg-gradient-to-br opacity-20", accent)} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className={classNames("text-xs font-semibold uppercase tracking-[0.18em]", dark ? "text-slate-400" : "text-slate-500")}>{title}</p>
          <h3 className={classNames("mt-2 text-2xl font-black", dark ? "text-white" : "text-slate-950")}>{value}</h3>
          {sub ? <p className={classNames("mt-1 text-xs", dark ? "text-slate-400" : "text-slate-500")}>{sub}</p> : null}
        </div>
        <div className={classNames("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-lg text-white shadow-lg", accent)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc, action, dark = false }) {
  return (
    <div
      className={classNames(
        "rounded-3xl border p-10 text-center shadow-sm",
        dark ? "border-white/10 bg-white/[0.05]" : "border-white/80 bg-white/90"
      )}
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-3xl text-white shadow-lg">
        ✦
      </div>
      <h3 className={classNames("mt-5 text-lg font-black", dark ? "text-white" : "text-slate-950")}>{title}</h3>
      <p className={classNames("mx-auto mt-2 max-w-md text-sm", dark ? "text-slate-400" : "text-slate-500")}>{desc}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default function Fixed() {
  const me = getUser();
  const [theme, setTheme] = useLocalTheme();
  const dark = theme === "dark";

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

  const inputClass = classNames(
    "w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-4",
    dark
      ? "border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-cyan-300/10"
      : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-indigo-200/50"
  );

  const selectClass = classNames(inputClass, "cursor-pointer");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInstances().catch((e) => setMsg(e?.response?.data?.message || "Load month items failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      ratioOther: otherMember ? findByUserId(template?.ratios || [], otherMember.id, "ratio", 50) : 50,
      fixedMe: findByUserId(template?.fixed || [], me?.id, "amount", ""),
      fixedOther: otherMember ? findByUserId(template?.fixed || [], otherMember.id, "amount", "") : "",
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
      setMsg("Amount must be greater than 0, or mark it as variable.");
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
        setMsg("Need 2 members for ratio split");
        return null;
      }

      payload.ratios = [
        { userId: me.id, ratio: Number(templateForm.ratioMe || 0) },
        { userId: otherMember.id, ratio: Number(templateForm.ratioOther || 0) },
      ];
    }

    if (templateForm.defaultSplitType === "fixed") {
      if (!otherMember) {
        setMsg("Need 2 members for fixed split");
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
      amount: instance?.templateId?.isVariable ? String(instance?.amount || "") : String(instance?.templateId?.defaultAmount || ""),
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
        if (!amt || amt <= 0) return setMsg("Amount must be greater than 0");
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
    setConfirmMessage("Are you sure you want to delete this fixed expense template?");
    setConfirmOpen(true);
  }

  function deleteInstance(id) {
    setDeleteKind("instance");
    setDeleteId(id);
    setConfirmTitle("Delete Month Item");
    setConfirmMessage("Are you sure you want to delete this month item? If it is already posted, its ledger and transaction entry will also be removed.");
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
      setMsg(`Generated ${res.data.createdCount} pending item(s) for ${monthLabel(month)}.`);
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
        return name.includes(qq) || note.includes(qq) || paidBy.includes(qq) || account.includes(qq);
      })
      .filter((i) => {
        if (filterStatus === "all") return true;
        return filterStatus === i.status;
      });
  }, [instances, q, filterStatus]);

  const stats = useMemo(() => {
    const fixedTemplates = templates.filter((t) => !t.isVariable);
    const variableTemplates = templates.filter((t) => t.isVariable);
    const fixedTemplateTotal = fixedTemplates.reduce((sum, t) => sum + Number(t.defaultAmount || 0), 0);
    const posted = instances.filter((i) => i.status === "posted" || i.status === "active");
    const pending = instances.filter((i) => i.status === "pending");
    const paidTotal = posted.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const pendingEstimate = pending.reduce((sum, i) => sum + Number(i.templateId?.isVariable ? 0 : i.templateId?.defaultAmount || 0), 0);

    return {
      templateCount: templates.length,
      fixedTemplateTotal,
      variableCount: variableTemplates.length,
      postedCount: posted.length,
      pendingCount: pending.length,
      paidTotal,
      pendingEstimate,
    };
  }, [templates, instances]);

  const splitTone = (type) => {
    if (type === "equal") return "gray";
    if (type === "personal") return "blue";
    if (type === "ratio") return "purple";
    if (type === "fixed") return "green";
    return "gray";
  };

  const splitLabel = (type) => {
    if (type === "equal") return "Equal";
    if (type === "personal") return "Personal";
    if (type === "ratio") return "Ratio";
    if (type === "fixed") return "Fixed Amounts";
    return type || "—";
  };

  return (
    <AppLayout>
      <div
        className={classNames(
          "-m-4 min-h-[calc(100vh-64px)] p-4 transition-colors md:-m-6 md:p-6",
          dark
            ? "bg-[radial-gradient(circle_at_top_left,#1e1b4b_0,#020617_34%,#020617_100%)] text-slate-100"
            : "bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_38%,#fef3c7_100%)] text-slate-950"
        )}
      >
        <div className="mx-auto max-w-[1500px] space-y-5">
          <section
            className={classNames(
              "relative overflow-hidden rounded-[2rem] border p-5 shadow-xl md:p-7",
              dark ? "border-white/10 bg-slate-950/70 shadow-black/30" : "border-white/80 bg-white/80 shadow-slate-200/80 backdrop-blur"
            )}
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill dark={dark} tone="blue">Recurring Budget</Pill>
                  <Pill dark={dark} tone="purple">{monthLabel(month)}</Pill>
                  <Pill dark={dark} tone={tab === "templates" ? "green" : "yellow"}>
                    {tab === "templates" ? "Template View" : "Monthly View"}
                  </Pill>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  Fixed Expenses
                </h1>
                <p className={classNames("mt-2 max-w-2xl text-sm leading-6 md:text-base", dark ? "text-slate-300" : "text-slate-600")}>
                  Manage recurring bills like rent, internet, subscriptions and utility costs. Templates keep the rules; monthly items store payment account, payer, date and amount.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[480px]">
                <div className={classNames("rounded-3xl border p-3", dark ? "border-white/10 bg-white/[0.06]" : "border-slate-200 bg-white/75")}>
                  <label className={classNames("mb-1 block text-xs font-bold uppercase tracking-[0.16em]", dark ? "text-slate-400" : "text-slate-500")}>Budget Month</label>
                  <input value={month} onChange={(e) => setMonth(e.target.value)} type="month" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SoftButton
                    dark={dark}
                    primary
                    onClick={tab === "templates" ? openTemplateModal : generateMonth}
                    className="h-full min-h-[74px] rounded-3xl"
                  >
                    <span className="text-lg">{tab === "templates" ? "+" : "↻"}</span>
                    <span>{tab === "templates" ? "Add Template" : "Generate Month"}</span>
                  </SoftButton>

                  <SoftButton
                    dark={dark}
                    onClick={() => setTheme(dark ? "light" : "dark")}
                    className="h-full min-h-[74px] rounded-3xl"
                  >
                    <span className="text-lg">{dark ? "☀" : "☾"}</span>
                    <span>{dark ? "Light" : "Dark"}</span>
                  </SoftButton>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Templates" value={stats.templateCount} sub="Saved recurring rules" icon="📌" accent="from-indigo-500 to-blue-400" dark={dark} />
            <StatCard title="Fixed Base" value={money(stats.fixedTemplateTotal)} sub="Non-variable template total" icon="🏠" accent="from-emerald-500 to-teal-400" dark={dark} />
            <StatCard title="Variable" value={stats.variableCount} sub="Amount changes monthly" icon="⚡" accent="from-amber-500 to-orange-400" dark={dark} />
            <StatCard title="Paid This Month" value={money(stats.paidTotal)} sub={`${stats.postedCount} posted item(s)`} icon="✅" accent="from-cyan-500 to-sky-400" dark={dark} />
            <StatCard title="Pending" value={stats.pendingCount} sub={`Estimate: ${money(stats.pendingEstimate)}`} icon="⏳" accent="from-fuchsia-500 to-violet-400" dark={dark} />
          </section>

          <section
            className={classNames(
              "sticky top-0 z-10 rounded-[1.75rem] border p-3 shadow-lg backdrop-blur-xl",
              dark ? "border-white/10 bg-slate-950/80 shadow-black/20" : "border-white/80 bg-white/80 shadow-slate-200/70"
            )}
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className={classNames("flex w-full rounded-2xl p-1 xl:w-auto", dark ? "bg-white/5" : "bg-slate-100")}>
                <Tab active={tab === "templates"} onClick={() => setTab("templates")} dark={dark}>
                  Templates <span className="opacity-70">({templates.length})</span>
                </Tab>
                <Tab active={tab === "instances"} onClick={() => setTab("instances")} dark={dark}>
                  This Month <span className="opacity-70">({instances.length})</span>
                </Tab>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center xl:min-w-[650px] xl:justify-end">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tab === "templates" ? "Search by template or category..." : "Search by item, note, payer or account..."}
                  className={inputClass}
                />

                {tab === "templates" ? (
                  <select className={classNames(selectClass, "md:max-w-[190px]")} value={filterVar} onChange={(e) => setFilterVar(e.target.value)}>
                    <option value="all">All Templates</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="variable">Variable Amount</option>
                  </select>
                ) : (
                  <select className={classNames(selectClass, "md:max-w-[180px]")} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="posted">Posted</option>
                  </select>
                )}
              </div>
            </div>

            {msg && (
              <div
                className={classNames(
                  "mt-3 rounded-2xl border px-4 py-3 text-sm font-medium",
                  msg.toLowerCase().includes("failed") || msg.toLowerCase().includes("required") || msg.toLowerCase().includes("select") || msg.toLowerCase().includes("greater")
                    ? dark
                      ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                    : dark
                      ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200"
                      : "border-cyan-200 bg-cyan-50 text-cyan-700"
                )}
              >
                {msg}
              </div>
            )}
          </section>

          {loading ? (
            <div className={classNames("rounded-3xl border p-8", dark ? "border-white/10 bg-white/[0.05]" : "border-white/80 bg-white/85")}>
              <Loader text="Loading fixed expenses" subtext="Fetching templates and current month data" />
            </div>
          ) : tab === "templates" ? (
            <section>
              {filteredTemplates.length === 0 ? (
                <EmptyState
                  dark={dark}
                  title="No templates found"
                  desc="Create your first recurring template, such as House Rent, Internet Bill, Electricity Bill or ChatGPT Premium."
                  action={<SoftButton dark={dark} primary onClick={openTemplateModal}>+ Add Template</SoftButton>}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTemplates.map((t, index) => {
                    const accent = [
                      "from-indigo-500 to-cyan-400",
                      "from-emerald-500 to-teal-400",
                      "from-fuchsia-500 to-pink-400",
                      "from-amber-500 to-orange-400",
                      "from-blue-500 to-violet-400",
                    ][index % 5];

                    return (
                      <article
                        key={t._id}
                        className={classNames(
                          "group relative overflow-hidden rounded-[1.75rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl",
                          dark ? "border-white/10 bg-white/[0.06] hover:bg-white/[0.09]" : "border-white/90 bg-white/90 hover:bg-white"
                        )}
                      >
                        <div className={classNames("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", accent)} />
                        <div className={classNames("absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-10 transition group-hover:opacity-20", accent)} />

                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={classNames("grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg text-white shadow-md", accent)}>
                                {t.isVariable ? "⚡" : "▣"}
                              </div>
                              <div className="min-w-0">
                                <h3 className={classNames("truncate text-base font-black", dark ? "text-white" : "text-slate-950")}>{t.name}</h3>
                                <p className={classNames("truncate text-xs", dark ? "text-slate-400" : "text-slate-500")}>{t.categoryId?.name || "No category"}</p>
                              </div>
                            </div>
                          </div>
                          <Pill dark={dark} tone={t.isVariable ? "yellow" : "green"}>{t.isVariable ? "Variable" : "Fixed"}</Pill>
                        </div>

                        <div className="relative mt-5 grid grid-cols-2 gap-3">
                          <div className={classNames("rounded-2xl border p-3", dark ? "border-white/10 bg-slate-950/40" : "border-slate-100 bg-slate-50")}> 
                            <p className={classNames("text-xs font-semibold uppercase tracking-[0.14em]", dark ? "text-slate-500" : "text-slate-400")}>Default</p>
                            <p className={classNames("mt-1 text-lg font-black", dark ? "text-white" : "text-slate-950")}>
                              {t.isVariable ? "—" : money(t.defaultAmount)}
                            </p>
                          </div>

                          <div className={classNames("rounded-2xl border p-3", dark ? "border-white/10 bg-slate-950/40" : "border-slate-100 bg-slate-50")}> 
                            <p className={classNames("text-xs font-semibold uppercase tracking-[0.14em]", dark ? "text-slate-500" : "text-slate-400")}>Split</p>
                            <div className="mt-1">
                              <Pill dark={dark} tone={splitTone(t.defaultSplitType)}>{splitLabel(t.defaultSplitType)}</Pill>
                            </div>
                          </div>
                        </div>

                        <div className="relative mt-5 flex flex-wrap justify-end gap-2">
                          <SoftButton dark={dark} onClick={() => openPaymentModalForTemplate(t)}>
                            Add to month
                          </SoftButton>
                          <SoftButton dark={dark} onClick={() => openEditTemplateModal(t)}>
                            Edit
                          </SoftButton>
                          <SoftButton dark={dark} danger onClick={() => deleteTemplate(t._id)}>
                            Delete
                          </SoftButton>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section>
              {filteredInstances.length === 0 ? (
                <EmptyState
                  dark={dark}
                  title={`No month items for ${monthLabel(month)}`}
                  desc="Generate the month to create pending items from all templates, or add any template directly to this month."
                  action={<SoftButton dark={dark} primary onClick={generateMonth}>Generate Month</SoftButton>}
                />
              ) : (
                <div className="space-y-3">
                  {filteredInstances.map((i, index) => {
                    const posted = i.status === "posted" || i.status === "active";
                    const accent = posted ? "from-emerald-500 to-teal-400" : "from-amber-500 to-orange-400";
                    const amount = posted ? i.amount : i.templateId?.isVariable ? 0 : i.templateId?.defaultAmount || 0;

                    return (
                      <article
                        key={i._id}
                        className={classNames(
                          "relative overflow-hidden rounded-[1.75rem] border p-4 shadow-sm transition hover:shadow-xl",
                          dark ? "border-white/10 bg-white/[0.06]" : "border-white/90 bg-white/90"
                        )}
                      >
                        <div className={classNames("absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b", accent)} />
                        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_auto] xl:items-center">
                          <div className="min-w-0 pl-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={classNames("grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md", accent)}>
                                {index + 1}
                              </span>
                              <h3 className={classNames("text-base font-black", dark ? "text-white" : "text-slate-950")}>{i.templateId?.name || "Fixed Expense"}</h3>
                              <Pill dark={dark} tone={posted ? "green" : "yellow"}>{posted ? "Posted" : "Pending"}</Pill>
                              <Pill dark={dark} tone={i.templateId?.isVariable ? "yellow" : "green"}>{i.templateId?.isVariable ? "Variable" : "Fixed"}</Pill>
                              <Pill dark={dark} tone={splitTone(i.templateId?.defaultSplitType)}>{splitLabel(i.templateId?.defaultSplitType)}</Pill>
                            </div>

                            <p className={classNames("mt-2 text-sm", dark ? "text-slate-400" : "text-slate-500")}>
                              {i.templateId?.categoryId?.name || i.templateId?.categoryId?.toString?.() || "Category"}
                              {i.note ? <span> · {i.note}</span> : null}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-3">
                            <div className={classNames("rounded-2xl border px-3 py-2", dark ? "border-white/10 bg-slate-950/40" : "border-slate-100 bg-slate-50")}> 
                              <p className={classNames("text-[11px] font-bold uppercase tracking-[0.14em]", dark ? "text-slate-500" : "text-slate-400")}>Paid By</p>
                              <p className={classNames("mt-1 truncate text-sm font-bold", dark ? "text-slate-200" : "text-slate-700")}>{i.paidByUserId?.name || "—"}</p>
                            </div>
                            <div className={classNames("rounded-2xl border px-3 py-2", dark ? "border-white/10 bg-slate-950/40" : "border-slate-100 bg-slate-50")}> 
                              <p className={classNames("text-[11px] font-bold uppercase tracking-[0.14em]", dark ? "text-slate-500" : "text-slate-400")}>Account</p>
                              <p className={classNames("mt-1 truncate text-sm font-bold", dark ? "text-slate-200" : "text-slate-700")}>{i.fromAccountId?.name || "—"}</p>
                            </div>
                            <div className={classNames("rounded-2xl border px-3 py-2", dark ? "border-white/10 bg-slate-950/40" : "border-slate-100 bg-slate-50")}> 
                              <p className={classNames("text-[11px] font-bold uppercase tracking-[0.14em]", dark ? "text-slate-500" : "text-slate-400")}>Date</p>
                              <p className={classNames("mt-1 truncate text-sm font-bold", dark ? "text-slate-200" : "text-slate-700")}>{prettyDate(i.date)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 xl:items-end">
                            <div className="text-left xl:text-right">
                              <p className={classNames("text-xs font-bold uppercase tracking-[0.16em]", dark ? "text-slate-500" : "text-slate-400")}>{posted ? "Paid Amount" : "Expected"}</p>
                              <p className={classNames("mt-1 text-2xl font-black", posted ? "text-emerald-500" : "text-amber-500")}>
                                {i.templateId?.isVariable && !posted ? "Variable" : money(amount)}
                              </p>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                              {!posted ? (
                                <SoftButton dark={dark} primary onClick={() => openPaymentModalForInstance(i)}>
                                  Post Now
                                </SoftButton>
                              ) : (
                                <SoftButton dark={dark} onClick={() => openEditPaymentModal(i)}>
                                  Edit Payment
                                </SoftButton>
                              )}
                              <SoftButton dark={dark} danger onClick={() => deleteInstance(i._id)}>
                                Delete
                              </SoftButton>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
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
              <div
                className={classNames(
                  "app-modal-panel max-w-3xl rounded-[2rem] p-5",
                  dark ? "!border-white/10 !bg-slate-950 !text-slate-100" : "!border-white !bg-white !text-slate-950"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Pill dark={dark} tone={templateMode === "edit" ? "blue" : "green"}>{templateMode === "edit" ? "Update Rule" : "New Rule"}</Pill>
                    <h3 className="mt-3 text-2xl font-black">{templateMode === "edit" ? "Edit Template" : "Add Template"}</h3>
                    <p className={classNames("mt-1 text-sm", dark ? "text-slate-400" : "text-slate-500")}>
                      Template stores the recurring rule. Payment details are selected when you add it to a month.
                    </p>
                  </div>
                  <SoftButton dark={dark} onClick={closeTemplateModal}>Close</SoftButton>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field dark={dark} label="Template Name" hint="Example: House Rent / Electricity Bill">
                      <input
                        className={inputClass}
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        placeholder="e.g., Electricity Bill"
                      />
                    </Field>
                  </div>

                  <Field dark={dark} label="Category">
                    <select
                      className={selectClass}
                      value={templateForm.categoryId}
                      onChange={(e) => setTemplateForm({ ...templateForm, categoryId: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {expenseCats.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field dark={dark} label="Split Type" hint="How this cost is shared">
                    <select
                      className={selectClass}
                      value={templateForm.defaultSplitType}
                      onChange={(e) => setTemplateForm({ ...templateForm, defaultSplitType: e.target.value })}
                    >
                      <option value="equal">Equal</option>
                      <option value="personal">Personal</option>
                      <option value="ratio">Ratio</option>
                      <option value="fixed">Fixed Amounts</option>
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Switch
                      dark={dark}
                      checked={templateForm.isVariable}
                      onChange={(v) => setTemplateForm({ ...templateForm, isVariable: v, defaultAmount: "" })}
                      label="Variable amount"
                      desc="Turn this on for bills like electricity, gas or water where amount changes every month."
                    />
                  </div>

                  <Field dark={dark} label="Default Amount" hint={templateForm.isVariable ? "Disabled for variable templates" : "Required for fixed amount"}>
                    <input
                      className={classNames(inputClass, templateForm.isVariable && "cursor-not-allowed opacity-60")}
                      value={templateForm.defaultAmount}
                      onChange={(e) => setTemplateForm({ ...templateForm, defaultAmount: e.target.value })}
                      placeholder="e.g., 20000"
                      disabled={templateForm.isVariable}
                      type="number"
                      min="0"
                    />
                  </Field>

                  {templateForm.defaultSplitType === "personal" && (
                    <Field dark={dark} label="Personal For">
                      <select
                        className={selectClass}
                        value={templateForm.personalUserId}
                        onChange={(e) => setTemplateForm({ ...templateForm, personalUserId: e.target.value })}
                      >
                        <option value="">Select member</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {templateForm.defaultSplitType === "ratio" && otherMember && (
                    <>
                      <Field dark={dark} label={`${me?.name || "My"} %`}>
                        <input
                          className={inputClass}
                          type="number"
                          value={templateForm.ratioMe}
                          onChange={(e) => setTemplateForm({ ...templateForm, ratioMe: e.target.value })}
                        />
                      </Field>
                      <Field dark={dark} label={`${otherMember.name} %`}>
                        <input
                          className={inputClass}
                          type="number"
                          value={templateForm.ratioOther}
                          onChange={(e) => setTemplateForm({ ...templateForm, ratioOther: e.target.value })}
                        />
                      </Field>
                    </>
                  )}

                  {templateForm.defaultSplitType === "fixed" && otherMember && (
                    <>
                      <Field dark={dark} label={`${me?.name || "My"} Amount`}>
                        <input
                          className={inputClass}
                          type="number"
                          value={templateForm.fixedMe}
                          onChange={(e) => setTemplateForm({ ...templateForm, fixedMe: e.target.value })}
                          placeholder="e.g., 10000"
                        />
                      </Field>
                      <Field dark={dark} label={`${otherMember.name} Amount`}>
                        <input
                          className={inputClass}
                          type="number"
                          value={templateForm.fixedOther}
                          onChange={(e) => setTemplateForm({ ...templateForm, fixedOther: e.target.value })}
                          placeholder="e.g., 6000"
                        />
                      </Field>
                    </>
                  )}
                </div>

                {msg && <div className={classNames("mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold", dark ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700")}>{msg}</div>}

                <div className="mt-6 flex justify-end gap-2">
                  <SoftButton dark={dark} onClick={closeTemplateModal}>Cancel</SoftButton>
                  <SoftButton dark={dark} primary onClick={saveTemplate}>
                    {templateMode === "edit" ? "Update Template" : "Save Template"}
                  </SoftButton>
                </div>
              </div>
            </div>
          )}

          {paymentOpen && (
            <div className="app-modal-overlay--center">
              <div
                className={classNames(
                  "app-modal-panel max-w-2xl rounded-[2rem] p-5",
                  dark ? "!border-white/10 !bg-slate-950 !text-slate-100" : "!border-white !bg-white !text-slate-950"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Pill dark={dark} tone={paymentMode === "edit" ? "blue" : "green"}>
                      {paymentMode === "template" ? "Add to Month" : paymentMode === "edit" ? "Edit Payment" : "Post Payment"}
                    </Pill>
                    <h3 className="mt-3 text-2xl font-black">
                      {paymentMode === "template" ? "Add to This Month" : paymentMode === "edit" ? "Edit Month Item" : "Post Month Item"}
                    </h3>
                    <p className={classNames("mt-1 text-sm", dark ? "text-slate-400" : "text-slate-500")}>{selectedTemplate?.name || "Fixed Expense"}</p>
                  </div>
                  <SoftButton dark={dark} onClick={closePaymentModal}>Close</SoftButton>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field dark={dark} label="Who is paying">
                    <select
                      className={selectClass}
                      value={paymentForm.paidByUserId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paidByUserId: e.target.value })}
                    >
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field dark={dark} label="From which account">
                    <select
                      className={selectClass}
                      value={paymentForm.fromAccountId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, fromAccountId: e.target.value })}
                    >
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field dark={dark} label="Payment Date">
                    <input
                      type="date"
                      className={inputClass}
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    />
                  </Field>

                  {(selectedTemplate?.isVariable || paymentMode === "edit") ? (
                    <Field dark={dark} label="Amount">
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="Enter amount"
                      />
                    </Field>
                  ) : (
                    <div className={classNames("rounded-2xl border p-4", dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-slate-50")}>
                      <p className={classNames("text-xs font-bold uppercase tracking-[0.16em]", dark ? "text-slate-400" : "text-slate-500")}>Fixed Amount</p>
                      <p className="mt-1 text-2xl font-black text-emerald-500">{money(selectedTemplate?.defaultAmount || 0)}</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Field dark={dark} label="Note (optional)">
                      <input
                        className={inputClass}
                        value={paymentForm.note}
                        onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                        placeholder="Example: Paid through card / May month bill"
                      />
                    </Field>
                  </div>
                </div>

                {msg && <div className={classNames("mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold", dark ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700")}>{msg}</div>}

                <div className="mt-6 flex justify-end gap-2">
                  <SoftButton dark={dark} onClick={closePaymentModal}>Cancel</SoftButton>
                  <SoftButton dark={dark} primary onClick={submitPaymentModal}>
                    {paymentMode === "edit" ? "Update Payment" : "Confirm Payment"}
                  </SoftButton>
                </div>
              </div>
            </div>
          )}

          <div className="h-10" />
        </div>
      </div>
    </AppLayout>
  );
}
