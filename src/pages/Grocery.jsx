import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import { getUser } from "../services/authStorage";
import ConfirmModal from "../components/ui/ConfirmModal";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function money(n) {
  const x = Number(n || 0);
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function bdt(n) {
  return `৳ ${money(n).toLocaleString("en-BD", {
    minimumFractionDigits: money(n) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function toLocalYMD(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function getName(value, fallback = "-") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.name || value.label || fallback;
}

function monthLabel(month) {
  if (!month) return "";
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function blankTxnItem(next = {}) {
  return {
    name: next.name || "",
    unit: next.unit || "pcs",
    qty: next.qty ?? 1,
    unitPrice: next.unitPrice ?? 0,
    note: next.note || "",
  };
}

const UNITS = [
  "pcs",
  "kg",
  "g",
  "lb",
  "liter",
  "ml",
  "pack",
  "bottle",
  "box",
  "dozen",
];

const splitLabels = {
  equal: "Equal Split",
  personal: "Personal",
  ratio: "Ratio",
  fixed: "Fixed Amount",
};

const splitBadgeClass = {
  equal:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20",
  personal:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20",
  ratio:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
  fixed:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
};

const fieldClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

const smallFieldClass =
  "w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

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
    receipt: (
      <svg {...common}>
        <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.5L13 21l-3-1.5L7 21l-3-1.5V5a2 2 0 0 1 2-2Z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
    cart: (
      <svg {...common}>
        <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.2 3H3" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M20 19H4" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-3" />
      </svg>
    ),
    flame: (
      <svg {...common}>
        <path d="M12 22c4 0 7-2.7 7-6.7 0-2.7-1.5-4.9-3.5-6.7-.7 2-2 3.2-3.5 3.8.4-3-1-5.5-3.5-7.4.1 3.7-3.5 5.5-3.5 10.2C5 19.3 8 22 12 22Z" />
      </svg>
    ),
    bag: (
      <svg {...common}>
        <path d="M6 8h12l-1 13H7L6 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
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
    wallet: (
      <svg {...common}>
        <path d="M4 7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 1-2-2V7Z" />
        <path d="M16 12h3" />
      </svg>
    ),
    tag: (
      <svg {...common}>
        <path d="M20 13 13 20 4 11V4h7l9 9Z" />
        <path d="M7.5 7.5h.01" />
      </svg>
    ),
    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
        <path d="M16 3.2a4 4 0 0 1 0 7.6" />
      </svg>
    ),
    split: (
      <svg {...common}>
        <path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6" />
        <path d="M18 3v6a3 3 0 0 1-3 3H9a3 3 0 0 0-3 3v6" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <path d="M3 10h18" />
      </svg>
    ),
  };

  return icons[name] || icons.receipt;
}

function IconBox({ name, tone = "slate" }) {
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

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SmartTextDropdown({
  value,
  onTextChange,
  onPick,
  options = [],
  open,
  setOpen,
  placeholder = "Type or choose",
  emptyText = "No saved option found",
  getKey,
  getLabel,
  getSubLabel,
  iconName = "tag",
}) {
  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <div className="relative">
        <input
          className={`${fieldClass} pr-12`}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onTextChange(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
        />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen(!open);
          }}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ChevronDownIcon
            className={`h-4 w-4 transition duration-200 ${open ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[90] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          {options.length > 0 ? (
            <div className="space-y-1">
              {options.map((option) => {
                const label = getLabel(option);
                const subLabel = getSubLabel?.(option);

                return (
                  <button
                    key={getKey(option)}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onPick(option);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-emerald-50 dark:hover:bg-emerald-400/10"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20">
                      <Icon name={iconName} className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-900 dark:text-white">
                        {label}
                      </span>

                      {subLabel && (
                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                          {subLabel}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
              {emptyText}
            </div>
          )}

          <div className="mt-2 border-t border-slate-100 px-3 pt-2 text-[11px] font-bold text-slate-400 dark:border-white/10 dark:text-slate-500">
            You can also type manually.
          </div>
        </div>
      )}
    </div>
  );
}

export default function Grocery() {
  const me = getUser();
  const currentUserId = String(me?.id || me?._id || "");

  const [month, setMonth] = useState(monthNow());
  const [day, setDay] = useState(dayNow());
  const [msg, setMsg] = useState("");

  const [members, setMembers] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [methods, setMethods] = useState([]);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [groceryShops, setGroceryShops] = useState([]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paidByFilter, setPaidByFilter] = useState("");

  const [form, setForm] = useState({
    txnDate: new Date().toISOString().slice(0, 10),
    shopName: "",
    location: "",
    paymentMethodId: "",
    cardLabelId: "",
    categoryId: "",
    paidByUserId: "",
    fromAccountId: "",
    discountTotal: 0,
    deliveryFee: 0,
    vatAmount: 0,
    vatIncluded: true,
    note: "",

    splitType: "equal",
    personalUserId: "",
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
  });

  const [txnItems, setTxnItems] = useState([blankTxnItem()]);
  const [fixedEditedField, setFixedEditedField] = useState("fixedMe");
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  useEffect(() => {
    const selectedMonth = day.slice(0, 7);
    if (selectedMonth !== month) setMonth(selectedMonth);
  }, [day]);

  const otherMember = useMemo(
    () => members.find((m) => String(getId(m)) !== currentUserId) || null,
    [members, currentUserId]
  );

  const memberById = useMemo(() => {
    const map = new Map();
    for (const member of members || []) map.set(getId(member), member);
    return map;
  }, [members]);

  function normalizeText(value = "") {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function normalizeWords(value = "") {
    return String(value || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean);
  }

  function isEmiCategory(category) {
    return normalizeText(category?.name) === "emi";
  }

  function isHiddenGroceryAccount(account) {
    const type = normalizeText(account?.type);
    const name = normalizeText(account?.name);

    return (
      type === "savings" ||
      type === "investment" ||
      name.includes("dps") ||
      name.includes("savings") ||
      name.includes("saving")
    );
  }

  function getAccountById(accountId) {
    return (accounts || []).find((a) => String(a._id) === String(accountId));
  }

  function methodMatches(method, keywords = []) {
    const name = normalizeText(method?.name);
    return keywords.some((key) => name.includes(normalizeText(key)));
  }

  function isPaymentMethodCard(methodId) {
    const method = (methods || []).find((m) => String(m._id) === String(methodId));
    return methodMatches(method, ["card", "debit", "credit"]);
  }

  function getAllowedPaymentMethodsForAccount(accountId) {
    const account = getAccountById(accountId);
    const type = normalizeText(account?.type);

    if (!account) return methods || [];

    if (type === "bank") {
      return (methods || []).filter((m) =>
        methodMatches(m, ["card", "check", "cheque"])
      );
    }

    if (type === "cash") {
      return (methods || []).filter((m) => methodMatches(m, ["cash"]));
    }

    if (type === "wallet") {
      return (methods || []).filter((m) =>
        methodMatches(m, ["bkash", "nagad"])
      );
    }

    return methods || [];
  }

  function getDefaultPaymentMethodId(accountId) {
    const account = getAccountById(accountId);
    const type = normalizeText(account?.type);
    const allowed = getAllowedPaymentMethodsForAccount(accountId);

    if (type === "bank") {
      return (
        allowed.find((m) => methodMatches(m, ["card"]))?._id ||
        allowed.find((m) => methodMatches(m, ["check", "cheque"]))?._id ||
        allowed[0]?._id ||
        ""
      );
    }

    if (type === "cash") {
      return allowed.find((m) => methodMatches(m, ["cash"]))?._id || allowed[0]?._id || "";
    }

    if (type === "wallet") {
      return (
        allowed.find((m) => methodMatches(m, ["bkash"]))?._id ||
        allowed.find((m) => methodMatches(m, ["nagad"]))?._id ||
        allowed[0]?._id ||
        ""
      );
    }

    return allowed[0]?._id || "";
  }

  function getDefaultCardLabelId(accountId) {
    const account = getAccountById(accountId);
    if (!account || normalizeText(account.type) !== "bank") return "";

    const ignoredWords = new Set([
      "account",
      "bank",
      "debit",
      "credit",
      "card",
      "saving",
      "savings",
      "current",
      "joint",
    ]);

    const accountWords = normalizeWords(account.name).filter(
      (word) => !ignoredWords.has(word) && word.length >= 2
    );

    const activeCards = (cards || []).filter((card) => card.isActive !== false);
    if (!activeCards.length) return "";

    const scoredCards = activeCards
      .map((card) => {
        const text = normalizeText(`${card.label || ""} ${card.last4 || ""}`);
        const wordScore = accountWords.reduce(
          (score, word) => score + (text.includes(normalizeText(word)) ? 1 : 0),
          0
        );
        const debitScore = text.includes("debit") ? 0.5 : 0;
        const cardScore = text.includes("card") ? 0.25 : 0;
        return { card, score: wordScore + debitScore + cardScore };
      })
      .sort((a, b) => b.score - a.score);

    if (scoredCards[0]?.score > 0) return scoredCards[0].card._id;

    return (
      activeCards.find((card) =>
        normalizeText(card.label).includes("debitcard")
      )?._id ||
      activeCards.find((card) => normalizeText(card.label).includes("debit"))?._id ||
      activeCards.find((card) => normalizeText(card.label).includes("card"))?._id ||
      activeCards[0]?._id ||
      ""
    );
  }

  function getAccountPreferenceKey(userId) {
    return `grocery:lastAccount:${String(userId || "")}`;
  }

  function savePreferredAccountForUser(userId, accountId) {
    if (!userId || !accountId) return;
    localStorage.setItem(getAccountPreferenceKey(userId), String(accountId));
  }

  function getPreferredAccountForUser(userId) {
    if (!userId) return "";
    return localStorage.getItem(getAccountPreferenceKey(userId)) || "";
  }

  function findShopByName(shopName) {
    return (groceryShops || []).find(
      (shop) => normalizeText(shop.name) === normalizeText(shopName)
    );
  }

  const resolveAccountOwner = (member) => {
    const name = String(member?.name || "").toLowerCase();
    if (name.includes("mahbub")) return "Mahbub";
    if (name.includes("mirza")) return "Mirza";
    return "";
  };

  const selectedPaidByOwner = useMemo(() => {
    return resolveAccountOwner(memberById.get(String(form.paidByUserId)));
  }, [memberById, form.paidByUserId]);

  const paidByAccounts = useMemo(() => {
    const activeAccounts = (accounts || []).filter(
      (a) => a.isActive !== false && !isHiddenGroceryAccount(a)
    );
    if (!selectedPaidByOwner) return activeAccounts;
    return activeAccounts.filter((a) => a.owner === selectedPaidByOwner);
  }, [accounts, selectedPaidByOwner]);

  const groceryExpenseCats = useMemo(() => {
    return (expenseCats || []).filter((category) => !isEmiCategory(category));
  }, [expenseCats]);

  const allowedPaymentMethods = useMemo(() => {
    return getAllowedPaymentMethodsForAccount(form.fromAccountId);
  }, [form.fromAccountId, accounts, methods]);

  const activeCardLabels = useMemo(() => {
    return (cards || []).filter((card) => card.isActive !== false);
  }, [cards]);

  const groceryLocations = useMemo(() => {
    const values = new Set();
    for (const shop of groceryShops || []) {
      if (shop?.location) values.add(shop.location);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [groceryShops]);

  const visibleGroceryShops = useMemo(() => {
    const q = normalizeText(form.shopName);

    const list = q
      ? (groceryShops || []).filter((shop) => {
        const text = normalizeText(`${shop.name || ""} ${shop.location || ""}`);
        return text.includes(q);
      })
      : groceryShops || [];

    return list.slice(0, 8);
  }, [groceryShops, form.shopName]);

  const visibleGroceryLocations = useMemo(() => {
    const q = normalizeText(form.location);

    const list = q
      ? groceryLocations.filter((location) =>
        normalizeText(location).includes(q)
      )
      : groceryLocations;

    return list.slice(0, 8);
  }, [groceryLocations, form.location]);

  const currentMemberName = useMemo(() => {
    return memberById.get(currentUserId)?.name || "My";
  }, [memberById, currentUserId]);

  const itemsSubtotal = useMemo(() => {
    let sum = 0;
    for (const it of txnItems) {
      sum += money(Number(it.qty || 0) * Number(it.unitPrice || 0));
    }
    return money(sum);
  }, [txnItems]);

  const totalPayable = useMemo(() => {
    let total =
      itemsSubtotal -
      Number(form.discountTotal || 0) +
      Number(form.deliveryFee || 0);

    if (!form.vatIncluded) {
      total += Number(form.vatAmount || 0);
    }

    return money(total);
  }, [
    itemsSubtotal,
    form.discountTotal,
    form.deliveryFee,
    form.vatAmount,
    form.vatIncluded,
  ]);

  useEffect(() => {
    if (!open || !form.paidByUserId) return;

    setForm((prev) => {
      const selectedAccountStillValid = paidByAccounts.some(
        (a) => String(a._id) === String(prev.fromAccountId)
      );

      let nextAccountId = prev.fromAccountId;

      if (!selectedAccountStillValid) {
        const preferredAccountId = getPreferredAccountForUser(prev.paidByUserId);
        const preferredStillValid = paidByAccounts.some(
          (a) => String(a._id) === String(preferredAccountId)
        );

        nextAccountId = preferredStillValid
          ? preferredAccountId
          : paidByAccounts?.[0]?._id || "";
      }

      const allowed = getAllowedPaymentMethodsForAccount(nextAccountId);
      const selectedMethodStillValid = allowed.some(
        (m) => String(m._id) === String(prev.paymentMethodId)
      );

      const nextPaymentMethodId = selectedMethodStillValid
        ? prev.paymentMethodId
        : getDefaultPaymentMethodId(nextAccountId);

      const nextCardLabelId = isPaymentMethodCard(nextPaymentMethodId)
        ? String(prev.fromAccountId || "") === String(nextAccountId || "") &&
          prev.cardLabelId
          ? prev.cardLabelId
          : getDefaultCardLabelId(nextAccountId)
        : "";

      if (
        String(prev.fromAccountId || "") === String(nextAccountId || "") &&
        String(prev.paymentMethodId || "") === String(nextPaymentMethodId || "") &&
        String(prev.cardLabelId || "") === String(nextCardLabelId || "")
      ) {
        return prev;
      }

      return {
        ...prev,
        fromAccountId: nextAccountId,
        paymentMethodId: nextPaymentMethodId,
        cardLabelId: nextCardLabelId,
      };
    });
  }, [
    open,
    form.paidByUserId,
    form.fromAccountId,
    form.paymentMethodId,
    form.cardLabelId,
    paidByAccounts,
    accounts,
    methods,
    cards,
  ]);

  useEffect(() => {
    if (!open || form.splitType !== "fixed" || !otherMember) return;
    if (form.fixedMe === "" && form.fixedOther === "") return;

    setForm((prev) => {
      if (fixedEditedField === "fixedOther") {
        const nextMe = Math.max(
          0,
          money(totalPayable - Number(prev.fixedOther || 0))
        );
        return { ...prev, fixedMe: nextMe };
      }

      const nextOther = Math.max(
        0,
        money(totalPayable - Number(prev.fixedMe || 0))
      );
      return { ...prev, fixedOther: nextOther };
    });
  }, [totalPayable, open, form.splitType, otherMember, fixedEditedField]);

  const dayTxns = useMemo(() => {
    return (items || []).filter((t) => toLocalYMD(t.txnDate) === day);
  }, [items, day]);

  const filteredTxns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return dayTxns.filter((t) => {
      const categoryId = getId(t.categoryId);
      const paidById = getId(t.paidByUserId);

      if (categoryFilter && categoryId !== categoryFilter) return false;
      if (paidByFilter && paidById !== paidByFilter) return false;

      if (!q) return true;

      const itemText = (t.items || []).map((it) => it.name || "").join(" ");
      const searchable = [
        t.shopName,
        t.location,
        t.note,
        getName(t.categoryId, ""),
        getName(t.paidByUserId, ""),
        getName(t.fromAccountId, ""),
        itemText,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [dayTxns, search, categoryFilter, paidByFilter]);

  const monthlyStats = useMemo(() => {
    const monthTotal = (items || []).reduce(
      (sum, t) => sum + Number(t.totalPayable || 0),
      0
    );

    const dayTotal = dayTxns.reduce(
      (sum, t) => sum + Number(t.totalPayable || 0),
      0
    );

    const totalItemCount = (items || []).reduce(
      (sum, t) => sum + Number((t.items || []).length),
      0
    );

    const biggest = [...(items || [])].sort(
      (a, b) => Number(b.totalPayable || 0) - Number(a.totalPayable || 0)
    )[0];

    const avgTxn = items.length ? monthTotal / items.length : 0;

    return {
      monthTotal: money(monthTotal),
      dayTotal: money(dayTotal),
      totalItemCount,
      biggest,
      avgTxn: money(avgTxn),
      txnCount: items.length,
    };
  }, [items, dayTxns]);

  async function loadBasics() {
    setMsg("");
    try {
      const [mRes, exp, pm, cl, acc, shopRes] = await Promise.all([
        api.get("/api/family/members"),
        api.get("/api/categories", { params: { kind: "expense" } }),
        api.get("/api/payment-methods"),
        api.get("/api/card-labels"),
        api.get("/api/accounts"),
        api.get("/api/grocery-shops"),
      ]);

      setMembers(mRes.data.members || []);
      setExpenseCats(exp.data.items || []);
      setMethods(pm.data.items || []);
      setCards(cl.data.items || []);
      setAccounts(acc.data.items || []);
      setGroceryShops(shopRes.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load setup data");
    }
  }

  async function loadMonth() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/grocery", { params: { month } });
      setItems(res.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load grocery data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBasics();
  }, []);

  useEffect(() => {
    loadMonth();
  }, [month]);

  function getAccountsForUser(userId) {
    const owner = resolveAccountOwner(memberById.get(String(userId)));
    const activeAccounts = (accounts || []).filter(
      (a) => a.isActive !== false && !isHiddenGroceryAccount(a)
    );
    if (!owner) return activeAccounts;
    return activeAccounts.filter((a) => a.owner === owner);
  }

  function getFirstAccountForUser(userId) {
    return getAccountsForUser(userId)?.[0]?._id || "";
  }

  function getDefaultForm(next = {}) {
    const defaultUser = getId(members?.[0]) || currentUserId || "";
    const selectedUserId = next.paidByUserId || defaultUser;
    const preferredAccountId = getPreferredAccountForUser(selectedUserId);
    const userAccounts = getAccountsForUser(selectedUserId);
    const preferredStillValid = userAccounts.some(
      (a) => String(a._id) === String(preferredAccountId)
    );

    const defaultAccount = next.fromAccountId
      ? next.fromAccountId
      : preferredStillValid
        ? preferredAccountId
        : getFirstAccountForUser(selectedUserId);

    const defaultPaymentMethod = next.paymentMethodId
      ? next.paymentMethodId
      : getDefaultPaymentMethodId(defaultAccount);

    const defaultCardLabel = next.cardLabelId
      ? next.cardLabelId
      : isPaymentMethodCard(defaultPaymentMethod)
        ? getDefaultCardLabelId(defaultAccount)
        : "";

    return {
      txnDate: next.txnDate || day || dayNow(),
      shopName: next.shopName || "",
      location: next.location || "",
      paymentMethodId: defaultPaymentMethod,
      cardLabelId: defaultCardLabel,
      categoryId: next.categoryId || "",
      paidByUserId: selectedUserId,
      fromAccountId: defaultAccount,
      discountTotal: next.discountTotal ?? 0,
      deliveryFee: next.deliveryFee ?? 0,
      vatAmount: next.vatAmount ?? 0,
      vatIncluded: next.vatIncluded ?? true,
      note: next.note || "",

      splitType: next.splitType || "equal",
      personalUserId: next.personalUserId || next.paidByUserId || defaultUser,
      ratioMe: next.ratioMe ?? 50,
      ratioOther: next.ratioOther ?? 50,
      fixedMe: next.fixedMe ?? "",
      fixedOther: next.fixedOther ?? "",
    };
  }

  function openModal() {
    setMsg("");
    setIsEditing(false);
    setEditId(null);
    setFixedEditedField("fixedMe");
    setForm(getDefaultForm());
    setTxnItems([blankTxnItem()]);
    setOpen(true);
  }

  function openEditModal(txn) {
    setMsg("");
    setIsEditing(true);
    setEditId(txn._id);
    setFixedEditedField("fixedMe");

    const savedSplit = txn.split || txn.splitSnapshot || { type: "equal" };
    const ratioRows = savedSplit.ratios || [];
    const fixedRows = savedSplit.fixed || [];
    const otherId = getId(otherMember);
    const ratioFor = (userId, fallback) =>
      ratioRows.find((r) => getId(r.userId) === String(userId))?.ratio ??
      fallback;
    const fixedFor = (userId, fallback = "") =>
      fixedRows.find((r) => getId(r.userId) === String(userId))?.amount ??
      fallback;

    setForm(
      getDefaultForm({
        txnDate: toLocalYMD(txn.txnDate),
        shopName: txn.shopName || "",
        location: txn.location || "",
        paymentMethodId: getId(txn.paymentMethodId),
        cardLabelId: getId(txn.cardLabelId),
        categoryId: getId(txn.categoryId),
        paidByUserId: getId(txn.paidByUserId),
        fromAccountId: getId(txn.fromAccountId),
        discountTotal: txn.discountTotal ?? 0,
        deliveryFee: txn.deliveryFee ?? 0,
        vatAmount: txn.vatAmount ?? 0,
        vatIncluded: txn.vatIncluded ?? true,
        note: txn.note || "",
        splitType: savedSplit.type || "equal",
        personalUserId: getId(savedSplit.personalUserId) || getId(txn.paidByUserId),
        ratioMe: ratioFor(currentUserId, 50),
        ratioOther: ratioFor(otherId, 50),
        fixedMe: fixedFor(currentUserId, ""),
        fixedOther: fixedFor(otherId, ""),
      })
    );

    setTxnItems(
      (txn.items || []).length
        ? (txn.items || []).map((it) =>
          blankTxnItem({
            name: it.name || "",
            unit: it.unit || "pcs",
            qty: it.qty ?? 1,
            unitPrice: it.unitPrice ?? 0,
            note: it.note || "",
          })
        )
        : [blankTxnItem()]
    );

    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setIsEditing(false);
    setEditId(null);
    setMsg("");
  }

  function addItemRow() {
    setTxnItems([...txnItems, blankTxnItem()]);
  }

  function removeItemRow(idx) {
    if (txnItems.length === 1) return;
    setTxnItems(txnItems.filter((_, i) => i !== idx));
  }

  function updateItem(idx, key, val) {
    const copy = [...txnItems];
    copy[idx] = { ...copy[idx], [key]: val };
    setTxnItems(copy);
  }

  function handlePaidByChange(userId) {
    const preferredAccountId = getPreferredAccountForUser(userId);
    const userAccounts = getAccountsForUser(userId);
    const preferredStillValid = userAccounts.some(
      (a) => String(a._id) === String(preferredAccountId)
    );

    const nextAccountId = preferredStillValid
      ? preferredAccountId
      : getFirstAccountForUser(userId);

    const nextPaymentMethodId = getDefaultPaymentMethodId(nextAccountId);

    setForm((prev) => ({
      ...prev,
      paidByUserId: userId,
      fromAccountId: nextAccountId,
      paymentMethodId: nextPaymentMethodId,
      cardLabelId: isPaymentMethodCard(nextPaymentMethodId)
        ? getDefaultCardLabelId(nextAccountId)
        : "",
      personalUserId: prev.splitType === "personal" ? userId : prev.personalUserId,
    }));
  }

  function handleFromAccountChange(accountId) {
    savePreferredAccountForUser(form.paidByUserId, accountId);

    const nextPaymentMethodId = getDefaultPaymentMethodId(accountId);

    setForm((prev) => ({
      ...prev,
      fromAccountId: accountId,
      paymentMethodId: nextPaymentMethodId,
      cardLabelId: isPaymentMethodCard(nextPaymentMethodId)
        ? getDefaultCardLabelId(accountId)
        : "",
    }));
  }

  function handlePaymentMethodChange(methodId) {
    setForm((prev) => ({
      ...prev,
      paymentMethodId: methodId,
      cardLabelId: isPaymentMethodCard(methodId)
        ? prev.cardLabelId || getDefaultCardLabelId(prev.fromAccountId)
        : "",
    }));
  }

  function handleShopNameChange(shopName) {
    const selectedShop = findShopByName(shopName);

    setForm((prev) => ({
      ...prev,
      shopName,
      location: selectedShop?.location || prev.location,
    }));
  }

  function handleLocationChange(location) {
    setForm((prev) => ({ ...prev, location }));
  }

  function handleShopPick(shop) {
    setForm((prev) => ({
      ...prev,
      shopName: shop.name || "",
      location: shop.location || prev.location,
    }));
  }

  function handleLocationPick(location) {
    setForm((prev) => ({
      ...prev,
      location,
    }));
  }

  function handleSplitTypeChange(splitType) {
    setFixedEditedField("fixedMe");
    setForm((prev) => ({
      ...prev,
      splitType,
      fixedMe: splitType === "fixed" ? prev.fixedMe : prev.fixedMe,
      fixedOther: splitType === "fixed" ? prev.fixedOther : prev.fixedOther,
    }));
  }

  function handleFixedAmountChange(field, value) {
    setFixedEditedField(field);

    const numericValue = Number(value || 0);
    const opposite = Math.max(0, money(totalPayable - numericValue));

    setForm((prev) => {
      if (field === "fixedMe") {
        return { ...prev, fixedMe: value, fixedOther: value === "" ? "" : opposite };
      }

      return { ...prev, fixedOther: value, fixedMe: value === "" ? "" : opposite };
    });
  }

  async function saveTxn() {
    setMsg("");
    try {
      if (!form.categoryId) return setMsg("Select expense category");
      if (!form.paidByUserId) return setMsg("Select Paid By");
      if (!form.fromAccountId) return setMsg("Select From Account");
      if (txnItems.some((x) => !String(x.name || "").trim())) {
        return setMsg("Every item must have a name");
      }
      if (txnItems.some((x) => Number(x.qty || 0) <= 0)) {
        return setMsg("Every item quantity must be greater than 0");
      }
      if (txnItems.some((x) => Number(x.unitPrice || 0) < 0)) {
        return setMsg("Unit price cannot be negative");
      }
      if (totalPayable <= 0) return setMsg("Total payable must be greater than 0");

      let split = { type: form.splitType };

      if (form.splitType === "personal") {
        if (!form.personalUserId) return setMsg("Select Personal For");
        split.personalUserId = form.personalUserId;
      }

      if (form.splitType === "ratio") {
        if (!otherMember) return setMsg("Need 2 members for ratio split");

        const ratioMe = Number(form.ratioMe || 0);
        const ratioOther = Number(form.ratioOther || 0);

        if (money(ratioMe + ratioOther) !== 100) {
          return setMsg("Ratio split must sum to 100");
        }

        split.ratios = [
          { userId: currentUserId, ratio: ratioMe },
          { userId: getId(otherMember), ratio: ratioOther },
        ];
      }

      if (form.splitType === "fixed") {
        if (!otherMember) return setMsg("Need 2 members for fixed split");

        const fixedMe = Number(form.fixedMe || 0);
        const fixedOther = Number(form.fixedOther || 0);

        if (money(fixedMe + fixedOther) !== money(totalPayable)) {
          return setMsg("Fixed split must sum to total payable");
        }

        split.fixed = [
          { userId: currentUserId, amount: fixedMe },
          { userId: getId(otherMember), amount: fixedOther },
        ];
      }

      const payload = {
        txnDate: form.txnDate,
        shopName: form.shopName,
        location: form.location,
        paymentMethodId: form.paymentMethodId || null,
        cardLabelId: form.cardLabelId || null,
        categoryId: form.categoryId,
        paidByUserId: form.paidByUserId,
        fromAccountId: form.fromAccountId,
        discountTotal: Number(form.discountTotal || 0),
        deliveryFee: Number(form.deliveryFee || 0),
        vatAmount: Number(form.vatAmount || 0),
        vatIncluded: !!form.vatIncluded,
        note: form.note,
        items: txnItems.map((it) => ({
          name: String(it.name || "").trim(),
          unit: it.unit || "pcs",
          qty: Number(it.qty || 0),
          unitPrice: Number(it.unitPrice || 0),
          note: it.note || "",
        })),
        split,
      };

      if (isEditing && editId) {
        await api.put(`/api/grocery/${editId}`, payload);
      } else {
        await api.post("/api/grocery", payload);
      }

      const nextMonth = String(form.txnDate || "").slice(0, 7);
      const nextDay = form.txnDate || day;

      closeModal();
      setDay(nextDay);

      if (nextMonth && nextMonth !== month) {
        setMonth(nextMonth);
      } else {
        await loadMonth();
      }
    } catch (e) {
      setMsg(
        e?.response?.data?.message || (isEditing ? "Update failed" : "Save failed")
      );
    }
  }

  function deleteTxn(id) {
    setDeleteId(id);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);
    try {
      await api.delete(`/api/grocery/${deleteId}`);
      await loadMonth();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setDeleteId(null);
    }
  }

  function lineTotal(it) {
    if (it?.lineTotal !== undefined && it?.lineTotal !== null) {
      return money(it.lineTotal);
    }
    return money(Number(it?.qty || 0) * Number(it?.unitPrice || 0));
  }

  return (
    <AppLayout>
      <div className="grocery-page min-h-screen w-full max-w-full overflow-x-hidden bg-white px-0 pb-8 text-[13px] text-slate-900 dark:bg-[#020617] dark:text-slate-100 sm:text-sm">
        <ConfirmModal
          open={confirmOpen}
          title="Delete Grocery Transaction"
          message="Are you sure you want to delete this grocery transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        <div className="space-y-5">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[radial-gradient(circle_at_top_left,#059669_0%,#065f46_38%,#0f172a_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-6 lg:p-7">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12),transparent_45%,rgba(255,255,255,0.07))]" />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-50 ring-1 ring-white/20 backdrop-blur">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
                    <Icon name="cart" className="h-3.5 w-3.5" />
                  </span>
                  Grocery tracker
                </div>

                <h2 className="text-[1.65rem] font-black tracking-tight sm:text-3xl lg:text-4xl">
                  Grocery Transactions
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Track receipt-wise grocery expenses, payable amount, accounts,
                  and member-wise split records with a clean monthly overview.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[520px]">
                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                        Month Total
                      </div>
                      <div className="mt-1 text-2xl font-black">
                        {bdt(monthlyStats.monthTotal)}
                      </div>
                      <div className="mt-1 text-xs text-emerald-50/80">
                        {monthLabel(month)}
                      </div>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                      <Icon name="wallet" className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/15 bg-white/12 p-4 shadow-inner shadow-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50/80">
                        Selected Day
                      </div>
                      <div className="mt-1 text-2xl font-black">
                        {bdt(monthlyStats.dayTotal)}
                      </div>
                      <div className="mt-1 text-xs text-emerald-50/80">
                        {filteredTxns.length} shown transaction(s)
                      </div>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                      <Icon name="calendar" className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Top controls */}
          <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  Control Center
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  Choose a month and date, then add or review daily grocery records.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[660px]">
                <input
                  type="month"
                  className={fieldClass}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />

                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className={fieldClass}
                />

                <button
                  onClick={openModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(255,255,255,0.08)] dark:hover:bg-slate-100"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Transaction
                </button>
              </div>
            </div>
          </section>

          {msg && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {msg}
            </div>
          )}

          {/* Stats */}
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="group rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-emerald-400/25">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
                    Transactions
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                    {monthlyStats.txnCount}
                  </h4>
                </div>
                <IconBox name="receipt" tone="emerald" />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Total grocery entries this month
              </p>
            </div>

            <div className="group rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-sky-400/25">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">
                    Total Items
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                    {monthlyStats.totalItemCount}
                  </h4>
                </div>
                <IconBox name="cart" tone="sky" />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Item rows recorded in receipts
              </p>
            </div>

            <div className="group rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-violet-400/25">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                    Average
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                    {bdt(monthlyStats.avgTxn)}
                  </h4>
                </div>
                <IconBox name="chart" tone="violet" />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Average payable per transaction
              </p>
            </div>

            <div className="group rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-amber-400/25">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                    Biggest Bill
                  </p>
                  <h4 className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white">
                    {monthlyStats.biggest
                      ? bdt(monthlyStats.biggest.totalPayable)
                      : "৳ 0"}
                  </h4>
                </div>
                <IconBox name="flame" tone="amber" />
              </div>
              <p className="mt-3 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {monthlyStats.biggest?.shopName || "No transaction yet"}
              </p>
            </div>
          </section>

          {/* Filters */}
          <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
              <Field label="Search">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Icon name="search" className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search shop, item, account, note..."
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Category">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">All categories</option>
                  {groceryExpenseCats.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Paid By">
                <select
                  value={paidByFilter}
                  onChange={(e) => setPaidByFilter(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">All members</option>
                  {members.map((m) => (
                    <option key={getId(m)} value={getId(m)}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setDay(dayNow());
                    setSearch("");
                    setCategoryFilter("");
                    setPaidByFilter("");
                  }}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-black text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/5"
                >
                  Today + Reset
                </button>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/70">
            <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Transactions on {day}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredTxns.length} of {dayTxns.length} transaction(s)
                    for the selected day.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                  Daily total: {bdt(monthlyStats.dayTotal)}
                </div>
              </div>
            </div>

            {loading ? (
              <Loader text="Loading grocery data" subtext="Preparing your entries" />
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20">
                  <Icon name="cart" className="h-7 w-7" />
                </div>
                <h4 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  No grocery data yet
                </h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add your first grocery transaction to start tracking.
                </p>
                <button
                  onClick={openModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Transaction
                </button>
              </div>
            ) : filteredTxns.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                  <Icon name="search" className="h-7 w-7" />
                </div>
                <h4 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  No matching transaction
                </h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Change the date, search text, or filters to see more results.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {filteredTxns.map((t) => {
                  const splitType = t.split?.type || "equal";

                  return (
                    <article
                      key={t._id}
                      className="p-4 transition duration-200 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950">
                              <Icon name="bag" className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <h4 className="truncate text-base font-black text-slate-950 dark:text-white sm:text-lg">
                                {t.shopName || "Grocery Transaction"}
                              </h4>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {toLocalYMD(t.txnDate)} • {t.location || "No location"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                              <span className="block text-slate-400 dark:text-slate-500">
                                Category
                              </span>
                              <strong className="text-slate-800 dark:text-slate-100">
                                {getName(t.categoryId)}
                              </strong>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                              <span className="block text-slate-400 dark:text-slate-500">
                                Paid By
                              </span>
                              <strong className="text-slate-800 dark:text-slate-100">
                                {getName(t.paidByUserId)}
                              </strong>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                              <span className="block text-slate-400 dark:text-slate-500">
                                From Account
                              </span>
                              <strong className="text-slate-800 dark:text-slate-100">
                                {getName(t.fromAccountId)}
                              </strong>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                              <span className="block text-slate-400 dark:text-slate-500">
                                Split
                              </span>
                              <strong
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${splitBadgeClass[splitType] || splitBadgeClass.equal
                                  }`}
                              >
                                {splitLabels[splitType] || splitType}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:items-end">
                          <div className="rounded-[24px] border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-[0_18px_35px_rgba(15,23,42,0.16)] dark:border-emerald-400/20 dark:bg-slate-950/80 dark:text-white dark:shadow-[0_18px_35px_rgba(0,0,0,0.35)]">
                            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300 dark:text-emerald-200">
                              Total Payable
                            </div>
                            <div className="mt-1 text-2xl font-black">
                              {bdt(t.totalPayable)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
                            <button
                              onClick={() => openEditModal(t)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/5"
                            >
                              <Icon name="edit" className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              onClick={() => deleteTxn(t._id)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-600 transition duration-200 hover:bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop table */}
                      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/10 md:block">
                        <table className="w-full min-w-[680px] text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                            <tr className="text-left">
                              <th className="p-3">Item</th>
                              <th className="p-3">Qty</th>
                              <th className="p-3">Unit</th>
                              <th className="p-3">Unit Price</th>
                              <th className="p-3 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {(t.items || []).map((it, idx) => (
                              <tr key={it._id || idx}>
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                                  {it.name}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">
                                  {it.qty}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">
                                  {it.unit}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">
                                  {bdt(it.unitPrice)}
                                </td>
                                <td className="p-3 text-right font-black text-slate-950 dark:text-white">
                                  {bdt(lineTotal(it))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="mt-5 space-y-2 md:hidden">
                        {(t.items || []).map((it, idx) => (
                          <div
                            key={it._id || idx}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 dark:text-white">
                                  {it.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {it.qty} {it.unit} × {bdt(it.unitPrice)}
                                </div>
                              </div>
                              <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/10">
                                {bdt(lineTotal(it))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                          Subtotal:{" "}
                          <strong className="text-slate-800 dark:text-slate-100">
                            {bdt(t.itemsSubtotal)}
                          </strong>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                          Txn Discount:{" "}
                          <strong className="text-slate-800 dark:text-slate-100">
                            {bdt(t.discountTotal)}
                          </strong>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                          Delivery:{" "}
                          <strong className="text-slate-800 dark:text-slate-100">
                            {bdt(t.deliveryFee)}
                          </strong>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                          VAT:{" "}
                          <strong className="text-slate-800 dark:text-slate-100">
                            {bdt(t.vatAmount)}
                          </strong>{" "}
                          ({t.vatIncluded ? "included" : "added"})
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {open && (
          <div className="app-modal-overlay">
            <div className="app-modal-panel grocery-modal-scroll max-h-[92vh] max-w-6xl overflow-y-auto rounded-[30px] border border-white/70 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950">
              {/* Modal Header */}
              <div className="sticky top-0 z-20 overflow-hidden border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950 sm:grid">
                      <Icon name="receipt" className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                        {isEditing ? "Update receipt" : "New receipt"}
                      </div>

                      <h3 className="text-xl font-black text-slate-950 dark:text-white">
                        {isEditing
                          ? "Edit Grocery Transaction"
                          : "Add Grocery Transaction"}
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        Add receipt details, account source, item rows, payable total,
                        and split type in one clean form.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <Icon name="close" className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </div>

              <div className="p-5 dark:bg-slate-950 sm:p-6">
                {/* Basic Info */}
                <div className="mb-5 rounded-[26px] border border-slate-200/70 bg-slate-50/80 p-4 shadow-inner shadow-white/60 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
                  <div className="mb-4 flex items-center gap-3">
                    <IconBox name="tag" tone="emerald" />
                    <div>
                      <h4 className="text-base font-black text-slate-950 dark:text-white">
                        Transaction Information
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Keep the top section minimal, readable, and balanced in both themes.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label="Date">
                      <input
                        type="date"
                        className={fieldClass}
                        value={form.txnDate}
                        onChange={(e) =>
                          setForm({ ...form, txnDate: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Shop">
                      <SmartTextDropdown
                        value={form.shopName}
                        onTextChange={handleShopNameChange}
                        onPick={handleShopPick}
                        options={visibleGroceryShops}
                        open={shopDropdownOpen}
                        setOpen={setShopDropdownOpen}
                        placeholder="Choose saved shop or type manually"
                        emptyText="No saved shop found"
                        iconName="bag"
                        getKey={(shop) => shop._id}
                        getLabel={(shop) => shop.name}
                        getSubLabel={(shop) => shop.location || "No saved location"}
                      />
                    </Field>

                    <Field label="Location">
                      <SmartTextDropdown
                        value={form.location}
                        onTextChange={handleLocationChange}
                        onPick={handleLocationPick}
                        options={visibleGroceryLocations}
                        open={locationDropdownOpen}
                        setOpen={setLocationDropdownOpen}
                        placeholder="Choose saved location or type manually"
                        emptyText="No saved location found"
                        iconName="tag"
                        getKey={(location) => location}
                        getLabel={(location) => location}
                        getSubLabel={() => "Saved grocery location"}
                      />
                    </Field>

                    <Field label="Expense Category">
                      <select
                        className={fieldClass}
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm({ ...form, categoryId: e.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {groceryExpenseCats.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Paid By">
                      <select
                        className={fieldClass}
                        value={form.paidByUserId}
                        onChange={(e) => handlePaidByChange(e.target.value)}
                      >
                        {members.map((m) => (
                          <option key={getId(m)} value={getId(m)}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="From Account">
                      <select
                        className={fieldClass}
                        value={form.fromAccountId}
                        onChange={(e) => handleFromAccountChange(e.target.value)}
                      >
                        <option value="">
                          {paidByAccounts.length
                            ? "Select"
                            : `No ${selectedPaidByOwner || "selected member"
                            } account found`}
                        </option>
                        {paidByAccounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Payment Method">
                      <select
                        className={fieldClass}
                        value={form.paymentMethodId}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      >
                        <option value="">
                          {form.fromAccountId ? "Select payment method" : "Select account first"}
                        </option>
                        {allowedPaymentMethods.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Card Label">
                      <select
                        className={fieldClass}
                        value={form.cardLabelId}
                        onChange={(e) =>
                          setForm({ ...form, cardLabelId: e.target.value })
                        }
                        disabled={!isPaymentMethodCard(form.paymentMethodId)}
                      >
                        <option value="">
                          {isPaymentMethodCard(form.paymentMethodId)
                            ? "Select card label"
                            : "Not required"}
                        </option>
                        {activeCardLabels.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.label}
                            {c.last4 ? ` (${c.last4})` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Note" className="sm:col-span-2 xl:col-span-4">
                      <input
                        className={fieldClass}
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Optional note"
                      />
                    </Field>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-5 rounded-[26px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-900/60">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <IconBox name="cart" tone="sky" />
                      <div>
                        <h4 className="text-base font-black text-slate-950 dark:text-white">
                          Receipt Items
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Add item name, unit, quantity, and unit price.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={addItemRow}
                      className="hidden items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:inline-flex"
                    >
                      <Icon name="plus" className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>

                  {/* Desktop item table */}
                  <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/10 lg:block">
                    <table className="w-full min-w-[780px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                        <tr className="text-left">
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3">Qty</th>
                          <th className="p-3">Unit Price</th>
                          <th className="p-3">Line Total</th>
                          <th className="p-3 text-center">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                        {txnItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-3">
                              <input
                                className={smallFieldClass}
                                value={it.name}
                                onChange={(e) =>
                                  updateItem(idx, "name", e.target.value)
                                }
                                placeholder="Rice, Oil, Milk..."
                              />
                            </td>

                            <td className="p-3">
                              <select
                                className={smallFieldClass}
                                value={it.unit}
                                onChange={(e) =>
                                  updateItem(idx, "unit", e.target.value)
                                }
                              >
                                {UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                className={smallFieldClass}
                                value={it.qty}
                                onChange={(e) =>
                                  updateItem(idx, "qty", e.target.value)
                                }
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className={smallFieldClass}
                                value={it.unitPrice}
                                onChange={(e) =>
                                  updateItem(idx, "unitPrice", e.target.value)
                                }
                              />
                            </td>

                            <td className="p-3 font-black text-slate-950 dark:text-white">
                              {bdt(Number(it.qty || 0) * Number(it.unitPrice || 0))}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() => removeItemRow(idx)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
                                disabled={txnItems.length === 1}
                              >
                                <Icon name="close" className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / tablet item cards */}
                  <div className="space-y-3 lg:hidden">
                    {txnItems.map((it, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="font-black text-slate-950 dark:text-white">
                            Item {idx + 1}
                          </div>
                          <button
                            onClick={() => removeItemRow(idx)}
                            disabled={txnItems.length === 1}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Item Name" className="sm:col-span-2">
                            <input
                              className={fieldClass}
                              value={it.name}
                              onChange={(e) =>
                                updateItem(idx, "name", e.target.value)
                              }
                              placeholder="Rice, Oil, Milk..."
                            />
                          </Field>

                          <Field label="Unit">
                            <select
                              className={fieldClass}
                              value={it.unit}
                              onChange={(e) =>
                                updateItem(idx, "unit", e.target.value)
                              }
                            >
                              {UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Qty">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className={fieldClass}
                              value={it.qty}
                              onChange={(e) =>
                                updateItem(idx, "qty", e.target.value)
                              }
                            />
                          </Field>

                          <Field label="Unit Price">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={fieldClass}
                              value={it.unitPrice}
                              onChange={(e) =>
                                updateItem(idx, "unitPrice", e.target.value)
                              }
                            />
                          </Field>

                          <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                              Line Total
                            </div>
                            <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                              {bdt(Number(it.qty || 0) * Number(it.unitPrice || 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addItemRow}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                {/* Totals */}
                <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Items Subtotal
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                      {bdt(itemsSubtotal)}
                    </div>
                  </div>

                  <Field label="Transaction Discount">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClass}
                      value={form.discountTotal}
                      onChange={(e) =>
                        setForm({ ...form, discountTotal: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Delivery Fee">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClass}
                      value={form.deliveryFee}
                      onChange={(e) =>
                        setForm({ ...form, deliveryFee: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="VAT Amount">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClass}
                      value={form.vatAmount}
                      onChange={(e) =>
                        setForm({ ...form, vatAmount: e.target.value })
                      }
                    />
                  </Field>

                  <label className="flex items-start gap-3 rounded-[24px] border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035] lg:col-span-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-950"
                      checked={form.vatIncluded}
                      onChange={(e) =>
                        setForm({ ...form, vatIncluded: e.target.checked })
                      }
                    />
                    <span>
                      <span className="block text-sm font-black text-slate-800 dark:text-slate-100">
                        VAT already included in item prices
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Uncheck this if VAT should be added with total payable.
                      </span>
                    </span>
                  </label>

                  <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-950 p-4 text-white shadow-[0_18px_35px_rgba(15,23,42,0.16)] dark:border-emerald-400/20 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),rgba(15,23,42,0.96)_45%,rgba(2,6,23,1)_100%)] dark:text-white dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)] lg:col-span-2">
                    <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />

                    <div className="relative z-10">
                      <div className="inline-flex rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100 ring-1 ring-white/10">
                        Total Payable
                      </div>

                      <div className="mt-3 text-3xl font-black tracking-tight text-white">
                        {bdt(totalPayable)}
                      </div>

                      <p className="mt-1 text-xs font-medium text-slate-300">
                        Final amount after discount, delivery fee, and VAT.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Split */}
                <div className="mb-5 rounded-[26px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-900/60">
                  <div className="mb-4 flex items-center gap-3">
                    <IconBox name="split" tone="violet" />
                    <div>
                      <h4 className="text-base font-black text-slate-950 dark:text-white">
                        Split Details
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        This split will be reflected in the ledger summary automatically.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label="Split Type" className="sm:col-span-2">
                      <select
                        className={fieldClass}
                        value={form.splitType}
                        onChange={(e) => handleSplitTypeChange(e.target.value)}
                      >
                        <option value="equal">Equal</option>
                        <option value="personal">Personal</option>
                        <option value="ratio">Ratio</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </Field>

                    {form.splitType === "personal" && (
                      <Field label="Personal For" className="sm:col-span-2">
                        <select
                          className={fieldClass}
                          value={form.personalUserId}
                          onChange={(e) =>
                            setForm({ ...form, personalUserId: e.target.value })
                          }
                        >
                          {members.map((m) => (
                            <option key={getId(m)} value={getId(m)}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    {form.splitType === "ratio" && otherMember && (
                      <>
                        <Field label={`${currentMemberName} %`}>
                          <input
                            type="number"
                            className={fieldClass}
                            value={form.ratioMe}
                            onChange={(e) =>
                              setForm({ ...form, ratioMe: e.target.value })
                            }
                          />
                        </Field>

                        <Field label={`${otherMember.name} %`}>
                          <input
                            type="number"
                            className={fieldClass}
                            value={form.ratioOther}
                            onChange={(e) =>
                              setForm({ ...form, ratioOther: e.target.value })
                            }
                          />
                        </Field>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:col-span-2 xl:col-span-4">
                          Ratio values must sum to 100.
                        </div>
                      </>
                    )}

                    {form.splitType === "fixed" && otherMember && (
                      <>
                        <Field label={`${currentMemberName} Amount`}>
                          <input
                            type="number"
                            className={fieldClass}
                            value={form.fixedMe}
                            onChange={(e) =>
                              handleFixedAmountChange("fixedMe", e.target.value)
                            }
                          />
                        </Field>

                        <Field label={`${otherMember.name} Amount`}>
                          <input
                            type="number"
                            className={fieldClass}
                            value={form.fixedOther}
                            onChange={(e) =>
                              handleFixedAmountChange("fixedOther", e.target.value)
                            }
                          />
                        </Field>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:col-span-2 xl:col-span-4">
                          Fixed amounts must sum to the total payable.
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:-mx-6 sm:-mb-6 sm:px-6">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      onClick={closeModal}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={saveTxn}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"
                    >
                      <Icon name="receipt" className="h-4 w-4" />
                      {isEditing ? "Update Transaction" : "Save Transaction"}
                    </button>
                  </div>

                  {msg && (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                      {msg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}