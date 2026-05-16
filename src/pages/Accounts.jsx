import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Loader from "../components/ui/Loader";

const TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "wallet", label: "Wallet" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
];

const OWNERS = [
  { value: "Mahbub", label: "Mahbub" },
  { value: "Mirza", label: "Mirza" },
  { value: "Joint", label: "Joint" },
];

const hiddenScrollbarClass =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

function bdt(n) {
  const value = Number(n || 0);
  return `৳ ${value.toLocaleString("en-BD", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function typeLabel(type) {
  return TYPES.find((t) => t.value === type)?.label || type || "-";
}

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
    account: (
      <svg {...common}>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v9h14v-9" />
        <path d="M9 19v-5h6v5" />
      </svg>
    ),
    wallet: (
      <svg {...common}>
        <path d="M4 7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 1-2-2V7Z" />
        <path d="M16 12h3" />
      </svg>
    ),
    bank: (
      <svg {...common}>
        <path d="M3 10 12 4l9 6" />
        <path d="M4 10h16" />
        <path d="M6 10v9" />
        <path d="M10 10v9" />
        <path d="M14 10v9" />
        <path d="M18 10v9" />
        <path d="M4 19h16" />
      </svg>
    ),
    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
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
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    filter: (
      <svg {...common}>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </svg>
    ),
    empty: (
      <svg {...common}>
        <path d="M4 7h16v13H4z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M9 13h6" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  };

  return icons[name] || icons.account;
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

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ title, value, sub, icon, tone }) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h4 className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white">
            {value}
          </h4>
          <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {sub}
          </p>
        </div>
        <IconBox name={icon} tone={tone} />
      </div>
    </div>
  );
}

function AccountTypeBadge({ type }) {
  const styles = {
    bank: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20",
    cash: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    wallet:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20",
    savings:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
    investment:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${styles[type] || styles.bank
        }`}
    >
      {typeLabel(type)}
    </span>
  );
}

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");

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

  const activeCount = useMemo(
    () => items.filter((a) => a.isActive !== false).length,
    [items]
  );

  const totalOpening = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.openingBalance || 0),
        0
      ),
    [items]
  );

  const bankCount = useMemo(
    () => items.filter((item) => item.type === "bank").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (ownerFilter && item.owner !== ownerFilter) return false;

      if (!q) return true;

      const text = `${item.name || ""} ${item.type || ""} ${item.owner || ""
        }`.toLowerCase();

      return text.includes(q);
    });
  }, [items, search, typeFilter, ownerFilter]);

  function reset() {
    setEditing(null);
    setForm({
      name: "",
      type: "bank",
      owner: "Joint",
      openingBalance: 0,
      isActive: true,
    });
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

  function startEdit(account) {
    setEditing(account);
    setForm({
      name: account.name || "",
      type: account.type || "bank",
      owner: account.owner || "Joint",
      openingBalance: account.openingBalance || 0,
      isActive: account.isActive !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className={`space-y-5 ${hiddenScrollbarClass}`}>
      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <StatCard
          title="Active Accounts"
          value={`${activeCount}/${items.length}`}
          sub="Currently usable accounts"
          icon="check"
          tone="emerald"
        />

        <StatCard
          title="Bank Accounts"
          value={bankCount}
          sub="Bank type accounts"
          icon="bank"
          tone="sky"
        />

        <StatCard
          title="Opening Total"
          value={bdt(totalOpening)}
          sub="Total initial balance"
          icon="wallet"
          tone="violet"
        />
      </div>

      {msg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.25fr]">
        <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <IconBox name="account" tone={editing ? "amber" : "emerald"} />
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                {editing ? "Edit Account" : "Add Account"}
              </h3>
              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                Create bank, cash, wallet, savings, or investment accounts for
                transaction tracking.
              </p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-4">
            <Field label="Account Name">
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., EBL Account, MoneyBag, bKash"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Type">
                <select
                  className={fieldClass}
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Owner">
                <select
                  className={fieldClass}
                  value={form.owner}
                  onChange={(e) =>
                    setForm({ ...form, owner: e.target.value })
                  }
                >
                  {OWNERS.map((owner) => (
                    <option key={owner.value} value={owner.value}>
                      {owner.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Opening Balance">
              <input
                type="number"
                step="0.01"
                className={fieldClass}
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
              />
            </Field>

            <label className="flex items-start gap-3 rounded-[22px] border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-950"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
              />
              <span>
                <span className="block text-sm font-black text-slate-800 dark:text-slate-100">
                  Active account
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Inactive accounts stay saved but can be hidden from regular
                  selection flows.
                </span>
              </span>
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {editing && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                >
                  <Icon name="close" className="h-4 w-4" />
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"
              >
                <Icon name={editing ? "edit" : "plus"} className="h-4 w-4" />
                {editing ? "Update Account" : "Save Account"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <IconBox name="wallet" tone="sky" />
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    All Accounts
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredItems.length} of {items.length} account(s).
                  </p>
                </div>
              </div>

              <div className="hidden w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 md:inline-flex">
                Active: {activeCount}/{items.length}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <Icon name="search" className="h-4 w-4" />
                </span>
                <input
                  className={`${fieldClass} pl-10`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search account, type, owner..."
                />
              </div>

              <select
                className={fieldClass}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                className={fieldClass}
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              >
                <option value="">All owners</option>
                {OWNERS.map((owner) => (
                  <option key={owner.value} value={owner.value}>
                    {owner.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <Loader text="Loading accounts" subtext="Fetching balances and members" />
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center sm:p-10">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                <Icon name="empty" className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                No accounts found
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add a new account or change your search/filter.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`hidden overflow-x-auto md:block ${hiddenScrollbarClass}`}
              >
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                    <tr className="text-left">
                      <th className="p-4 font-black">Account</th>
                      <th className="p-4 font-black">Type</th>
                      <th className="p-4 font-black">Owner</th>
                      <th className="p-4 text-right font-black">Opening</th>
                      <th className="p-4 text-right font-black">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {filteredItems.map((account) => (
                      <tr
                        key={account._id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <IconBox
                              name={
                                account.type === "bank"
                                  ? "bank"
                                  : account.type === "wallet"
                                    ? "wallet"
                                    : "account"
                              }
                              tone={
                                account.type === "bank"
                                  ? "sky"
                                  : account.type === "wallet"
                                    ? "violet"
                                    : account.type === "cash"
                                      ? "emerald"
                                      : "amber"
                              }
                            />

                            <div className="min-w-0">
                              <div className="truncate font-black text-slate-950 dark:text-white">
                                {account.name}
                              </div>
                              <div className="mt-1">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${account.isActive !== false
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20"
                                    : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/10 dark:text-slate-400 dark:ring-white/10"
                                    }`}
                                >
                                  {account.isActive !== false
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <AccountTypeBadge type={account.type} />
                        </td>

                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {account.owner || "-"}
                        </td>

                        <td className="p-4 text-right font-black text-slate-950 dark:text-white">
                          {bdt(account.openingBalance)}
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(account)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <Icon name="edit" className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => remove(account._id)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
                            >
                              <Icon name="trash" className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 md:hidden">
                {filteredItems.map((account) => (
                  <article
                    key={account._id}
                    className="rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[15px] font-black leading-5 text-slate-950 dark:text-white">
                          {account.name}
                        </h4>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>{account.owner || "-"}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span
                            className={
                              account.isActive !== false
                                ? "text-emerald-600 dark:text-emerald-300"
                                : "text-slate-400 dark:text-slate-500"
                            }
                          >
                            {account.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <AccountTypeBadge type={account.type} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                          Opening
                        </p>
                        <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                          {bdt(account.openingBalance)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                          Type
                        </p>
                        <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                          {typeLabel(account.type)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(account)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        <Icon name="edit" className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(account._id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}