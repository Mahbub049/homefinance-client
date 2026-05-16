import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Accounts from "./Accounts";

const hiddenScrollbarClass =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    settings: (
      <svg {...common}>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.06A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.06A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.06A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04A1.7 1.7 0 0 0 19.4 9c.37.26.6.62.6 1.06V10a2 2 0 1 1 0 4h-.06A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    ),
    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    edit: (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
      </svg>
    ),
    trash: (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),
    category: (
      <svg {...common}>
        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
      </svg>
    ),
    wallet: (
      <svg {...common}>
        <path d="M4 7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 1-2-2V7Z" />
        <path d="M16 12h3" />
      </svg>
    ),
    card: (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    ),
    shop: (
      <svg {...common}>
        <path d="M4 10h16l-1-5H5l-1 5Z" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
    account: (
      <svg {...common}>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v9h14v-9" />
        <path d="M9 19v-5h6v5" />
      </svg>
    ),
    empty: (
      <svg {...common}>
        <path d="M4 7h16v13H4z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M9 13h6" />
      </svg>
    ),
  };

  return icons[name] || icons.settings;
}

function IconBox({ name, tone = "emerald" }) {
  const tones = {
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    sky: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20",
    violet:
      "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
    slate:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10",
  };

  return (
    <div
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${tones[tone]}`}
    >
      <Icon name={name} className="h-5 w-5" />
    </div>
  );
}

function TabPill({ active, children, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition duration-200",
        active
          ? "border-emerald-300 bg-emerald-600 text-white shadow-[0_14px_30px_rgba(16,185,129,0.24)] dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-100"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-emerald-400/25 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200",
      ].join(" ")}
    >
      <Icon name={icon} className="h-4 w-4" />
      {children}
    </button>
  );
}

function ActionButton({ children, onClick, title, tone = "slate", icon }) {
  const tones = {
    slate:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
    rose: "border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition duration-200 ${tones[tone]}`}
    >
      {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <ActionButton onClick={onEdit} title="Edit" icon="edit">
        Edit
      </ActionButton>
      <ActionButton onClick={onDelete} title="Delete" tone="rose" icon="trash">
        Delete
      </ActionButton>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/10" />
          <div className="mt-2 h-3 w-28 rounded bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function Settings() {
  const tabs = useMemo(
    () => [
      {
        key: "incomeCats",
        label: "Income Categories",
        hint: "Manage income sources such as salary, bonus, or other earnings.",
        icon: "category",
        tone: "emerald",
      },
      {
        key: "expenseCats",
        label: "Expense Categories",
        hint: "Manage expense groups used in transaction and grocery records.",
        icon: "category",
        tone: "sky",
      },
      {
        key: "methods",
        label: "Payment Methods",
        hint: "Manage payment options such as cash, card, cheque, bKash, or Nagad.",
        icon: "wallet",
        tone: "violet",
      },
      {
        key: "cards",
        label: "Card Labels",
        hint: "Manage debit or credit card labels for bank-based payments.",
        icon: "card",
        tone: "amber",
      },
      {
        key: "shops",
        label: "Grocery Shops",
        hint: "Save grocery shop names with default locations for quick entry.",
        icon: "shop",
        tone: "emerald",
      },
      {
        key: "accounts",
        label: "Accounts",
        hint: "Manage account records from the dedicated accounts section.",
        icon: "account",
        tone: "slate",
      },
    ],
    []
  );

  const [active, setActive] = useState("incomeCats");

  const [incomeCats, setIncomeCats] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [methods, setMethods] = useState([]);
  const [cards, setCards] = useState([]);
  const [shops, setShops] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    type: "",
    data: null,
  });

  const [form, setForm] = useState({
    name: "",
    label: "",
    last4: "",
    location: "",
  });

  async function loadAll() {
    setLoading(true);
    setMsg("");

    try {
      const [inc, exp, pm, cl, shopRes] = await Promise.all([
        api.get("/api/categories", { params: { kind: "income" } }),
        api.get("/api/categories", { params: { kind: "expense" } }),
        api.get("/api/payment-methods"),
        api.get("/api/card-labels"),
        api.get("/api/grocery-shops"),
      ]);

      setIncomeCats(inc.data.items || []);
      setExpenseCats(exp.data.items || []);
      setMethods(pm.data.items || []);
      setCards(cl.data.items || []);
      setShops(shopRes.data.items || []);
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
    setQ("");
  }, [active]);

  const isAccountsTab = active === "accounts";
  const activeTab = tabs.find((t) => t.key === active) || tabs[0];
  const activeLabel = activeTab.label;
  const activeHint = activeTab.hint;

  const currentList =
    active === "incomeCats"
      ? incomeCats
      : active === "expenseCats"
        ? expenseCats
        : active === "methods"
          ? methods
          : active === "shops"
            ? shops
            : cards;

  const filteredList = useMemo(() => {
    if (isAccountsTab) return [];

    const s = q.trim().toLowerCase();
    if (!s) return currentList || [];

    return (currentList || []).filter((item) => {
      const text =
        active === "cards"
          ? `${item.label || ""} ${item.last4 || ""}`
          : active === "shops"
            ? `${item.name || ""} ${item.location || ""}`
            : `${item.name || ""}`;

      return text.toLowerCase().includes(s);
    });
  }, [q, currentList, isAccountsTab, active]);

  const stats = useMemo(
    () => ({
      income: incomeCats.length,
      expense: expenseCats.length,
      methods: methods.length,
      cards: cards.length,
      shops: shops.length,
    }),
    [incomeCats, expenseCats, methods, cards, shops]
  );

  function openAdd(type) {
    setModal({ open: true, mode: "add", type, data: null });
    setForm({ name: "", label: "", last4: "", location: "" });
    setMsg("");
  }

  function openEdit(type, item) {
    setModal({ open: true, mode: "edit", type, data: item });

    if (type === "cards") {
      setForm({
        name: "",
        label: item.label || "",
        last4: item.last4 || "",
        location: "",
      });
    } else if (type === "shops") {
      setForm({
        name: item.name || "",
        label: "",
        last4: "",
        location: item.location || "",
      });
    } else {
      setForm({
        name: item.name || "",
        label: "",
        last4: "",
        location: "",
      });
    }

    setMsg("");
  }

  function closeModal() {
    setModal({ open: false, mode: "add", type: "", data: null });
    setForm({ name: "", label: "", last4: "", location: "" });
  }

  async function saveModal() {
    try {
      const { mode, type, data } = modal;

      if (type === "incomeCats" || type === "expenseCats") {
        const kind = type === "incomeCats" ? "income" : "expense";

        if (mode === "add") {
          await api.post("/api/categories", { kind, name: form.name });
        } else {
          await api.put(`/api/categories/${data._id}`, { name: form.name });
        }
      }

      if (type === "methods") {
        if (mode === "add") {
          await api.post("/api/payment-methods", { name: form.name });
        } else {
          await api.put(`/api/payment-methods/${data._id}`, {
            name: form.name,
          });
        }
      }

      if (type === "cards") {
        const payload = {
          label: form.label,
          last4: form.last4,
        };

        if (mode === "add") {
          await api.post("/api/card-labels", payload);
        } else {
          await api.put(`/api/card-labels/${data._id}`, payload);
        }
      }

      if (type === "shops") {
        const payload = {
          name: form.name,
          location: form.location,
        };

        if (mode === "add") {
          await api.post("/api/grocery-shops", payload);
        } else {
          await api.put(`/api/grocery-shops/${data._id}`, payload);
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

      if (type === "shops") {
        await api.delete(`/api/grocery-shops/${id}`);
      }

      await loadAll();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  function getDisplayName(item) {
    if (active === "cards") return item.label || "-";
    return item.name || "-";
  }

  function getSubText(item) {
    if (active === "cards") return item.last4 ? `Last 4 digits: ${item.last4}` : "Card label";
    if (active === "shops") return item.location || "No saved location";
    if (active === "methods") return "Payment method";
    if (active === "incomeCats") return "Income category";
    if (active === "expenseCats") return "Expense category";
    return "";
  }

  const addDisabled = isAccountsTab;

  return (
    <AppLayout>
      <div
        className={`settings-page min-h-screen w-full max-w-full overflow-x-hidden bg-white px-0 pb-8 text-[13px] text-slate-900 dark:bg-[#020617] dark:text-slate-100 sm:text-sm ${hiddenScrollbarClass}`}
      >
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[radial-gradient(circle_at_top_left,#059669_0%,#065f46_38%,#0f172a_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-6 lg:p-7">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_45%,rgba(255,255,255,0.06))]" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-50 ring-1 ring-white/20 backdrop-blur">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
                    <Icon name="settings" className="h-3.5 w-3.5" />
                  </span>
                  System settings
                </div>

                <h2 className="text-[1.65rem] font-black tracking-tight sm:text-3xl lg:text-4xl">
                  Settings
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Manage categories, payment methods, card labels, grocery shops,
                  and accounts from one clean control panel.
                </p>
              </div>

              <div className="hidden gap-3 md:grid md:grid-cols-3 xl:w-[560px]">
                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                    Categories
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {stats.income + stats.expense}
                  </div>
                  <div className="mt-1 text-xs text-emerald-50/80">
                    Income + Expense
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                    Payments
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {stats.methods}
                  </div>
                  <div className="mt-1 text-xs text-emerald-50/80">
                    Method records
                  </div>
                </div>

                <div className="col-span-2 rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl sm:col-span-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                    Shops
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {stats.shops}
                  </div>
                  <div className="mt-1 text-xs text-emerald-50/80">
                    Grocery presets
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  Control Center
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  Select a setting type, search existing records, or add a new setup item.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAdd(active)}
                disabled={addDisabled}
                title={addDisabled ? "Use the Accounts tab to manage accounts" : ""}
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition duration-200 sm:w-auto",
                  addDisabled
                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                    : "bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(255,255,255,0.08)] dark:hover:bg-slate-100",
                ].join(" ")}
              >
                <Icon name="plus" className="h-4 w-4" />
                Add {addDisabled ? "" : activeLabel}
              </button>
            </div>

            <div
              className={`mt-5 flex gap-2 overflow-x-auto pb-1 ${hiddenScrollbarClass}`}
            >
              {tabs.map((t) => (
                <TabPill
                  key={t.key}
                  active={active === t.key}
                  onClick={() => setActive(t.key)}
                  icon={t.icon}
                >
                  {t.label}
                </TabPill>
              ))}
            </div>
          </section>

          {msg && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {msg}
            </div>
          )}

          <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/70">
            <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <IconBox name={activeTab.icon} tone={activeTab.tone} />
                  <div>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white">
                      {activeLabel}
                    </h3>
                    {!isAccountsTab && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {activeHint}
                      </p>
                    )}
                  </div>
                </div>

                {!isAccountsTab && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <div className="relative w-full sm:w-80">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <Icon name="search" className="h-4 w-4" />
                      </span>
                      <input
                        className={`${fieldClass} pl-10`}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={`Search ${activeLabel.toLowerCase()}...`}
                      />
                    </div>

                    <div className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300">
                      {filteredList.length} item(s)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isAccountsTab ? (
              <div className="p-4 sm:p-5">
                <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
                  <Accounts />
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-3 p-4 sm:p-5">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center sm:p-10">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                  <Icon name="empty" className="h-7 w-7" />
                </div>
                <h4 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  No items found
                </h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {q.trim()
                    ? "Try a different search keyword."
                    : "Click Add to create your first setup item."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                      <tr className="text-left">
                        <th className="p-4 font-black">Name</th>
                        {active === "cards" && (
                          <th className="p-4 font-black">Last 4</th>
                        )}
                        {active === "shops" && (
                          <th className="p-4 font-black">Location</th>
                        )}
                        <th className="p-4 text-right font-black">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {filteredList.map((item) => (
                        <tr
                          key={item._id}
                          className="transition duration-200 hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <IconBox
                                name={activeTab.icon}
                                tone={activeTab.tone}
                              />
                              <div>
                                <div className="font-black text-slate-950 dark:text-white">
                                  {getDisplayName(item)}
                                </div>
                                <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                  {getSubText(item)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {active === "cards" && (
                            <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                              {item.last4 || "-"}
                            </td>
                          )}

                          {active === "shops" && (
                            <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                              {item.location || "-"}
                            </td>
                          )}

                          <td className="p-4">
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

                <div className="space-y-3 p-4 md:hidden">
                  {filteredList.map((item) => (
                    <article
                      key={item._id}
                      className="rounded-[24px] border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40"
                    >
                      <div className="flex items-start gap-3">
                        <IconBox name={activeTab.icon} tone={activeTab.tone} />

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-base font-black text-slate-950 dark:text-white">
                            {getDisplayName(item)}
                          </h4>
                          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                            {getSubText(item)}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <ActionButton
                              onClick={() => openEdit(active, item)}
                              icon="edit"
                            >
                              Edit
                            </ActionButton>
                            <ActionButton
                              onClick={() => deleteItem(active, item._id)}
                              tone="rose"
                              icon="trash"
                            >
                              Delete
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {modal.open && !isAccountsTab && (
          <div className="app-modal-overlay--center">
            <div
              className={`app-modal-panel max-h-[92vh] max-w-md overflow-y-auto rounded-[30px] border border-white/70 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950 ${hiddenScrollbarClass}`}
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="flex items-start gap-3">
                    <IconBox name={activeTab.icon} tone={activeTab.tone} />
                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                        {modal.mode === "add" ? "New setup" : "Update setup"}
                      </div>

                      <h3 className="text-xl font-black text-slate-950 dark:text-white">
                        {modal.mode === "add" ? "Add" : "Edit"}{" "}
                        {tabs.find((t) => t.key === modal.type)?.label}
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        Keep names short, readable, and consistent.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {(modal.type === "incomeCats" ||
                  modal.type === "expenseCats" ||
                  modal.type === "methods" ||
                  modal.type === "shops") && (
                  <>
                    <Field label="Name">
                      <input
                        className={fieldClass}
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder={
                          modal.type === "shops"
                            ? "e.g., Charmin Traders"
                            : "e.g., Salary / Utilities / Cash"
                        }
                      />
                    </Field>

                    {modal.type === "shops" && (
                      <Field label="Location">
                        <input
                          className={fieldClass}
                          value={form.location}
                          onChange={(e) =>
                            setForm({ ...form, location: e.target.value })
                          }
                          placeholder="e.g., Rupnagar"
                        />
                      </Field>
                    )}
                  </>
                )}

                {modal.type === "cards" && (
                  <>
                    <Field label="Card Label">
                      <input
                        className={fieldClass}
                        value={form.label}
                        onChange={(e) =>
                          setForm({ ...form, label: e.target.value })
                        }
                        placeholder="e.g., EBL Debit Card"
                      />
                    </Field>

                    <Field label="Last 4 Digits">
                      <input
                        className={fieldClass}
                        value={form.last4}
                        onChange={(e) =>
                          setForm({ ...form, last4: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </Field>
                  </>
                )}

                {msg && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                    {msg}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveModal}
                    disabled={
                      modal.type === "cards"
                        ? !form.label.trim()
                        : !form.name.trim()
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"
                  >
                    <Icon name="settings" className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}