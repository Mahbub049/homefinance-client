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

function dayNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalYMD(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function money(n) {
  const v = Number(n || 0);
  return `৳ ${v.toLocaleString("en-BD")}`;
}

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pct(part, total) {
  const p = total <= 0 ? 0 : (Number(part || 0) / Number(total || 0)) * 100;
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

function getId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return String(v._id || v.id || "");
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg text-sm border transition",
        active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
      )}
    >
      {children}
    </button>
  );
}

function MetricCard({ title, value, subtitle, tone = "neutral" }) {
  const toneMap = {
    neutral: "from-slate-50 to-white border-slate-200",
    income: "from-emerald-50 to-white border-emerald-200",
    expense: "from-rose-50 to-white border-rose-200",
    transfer: "from-sky-50 to-white border-sky-200",
    net: "from-violet-50 to-white border-violet-200",
  };
  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-b p-4",
        toneMap[tone] || toneMap.neutral
      )}
    >
      <div className="text-xs text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
    </div>
  );
}

function IconDot({ txType }) {
  const map = {
    income: "bg-emerald-500",
    expense: "bg-rose-500",
    transfer: "bg-sky-500",
  };
  return (
    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", map[txType] || "bg-gray-400")} />
  );
}

export default function Ledger() {
  const me = getUser();

  const [month, setMonth] = useState(monthNow());
  const [activeTab, setActiveTab] = useState("all"); // all | income | expense | transfer

  // ✅ NEW: day filter like Grocery
  const [day, setDay] = useState(dayNow());

  const [members, setMembers] = useState([]);
  const [incomeCats, setIncomeCats] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [memberFilter, setMemberFilter] = useState("all");
  const [q, setQ] = useState("");

  const [items, setItems] = useState([]);      // tab-filtered
  const [allItems, setAllItems] = useState([]); // full month
  const [ledgerItems, setLedgerItems] = useState([]);

  const [totals, setTotals] = useState({ income: 0, expense: 0, transfer: 0, netCashflow: 0 });

  const fixedExpenseTotal = useMemo(() => {
    return (allItems || [])
      .filter(
        (t) =>
          t.txType === "expense" &&
          (t.note?.toLowerCase().includes("fixed") ||
            t.categoryId?.name?.toLowerCase().includes("housing"))
      )
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [allItems]);
  // NEW: remaining expense after fixed expenses
  const remainingExpense = useMemo(() => {
    return Number(totals.expense || 0) - Number(fixedExpenseTotal || 0);
  }, [totals, fixedExpenseTotal]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    txType: "expense",
    date: new Date().toISOString().slice(0, 10),
    categoryId: "",
    amount: "",
    note: "",
    fromAccountId: "",
    toAccountId: "",
    paidByUserId: "",
    receivedByUserId: "",
  });

  async function loadBasics() {
    const [mRes, inc, exp, acc] = await Promise.all([
      api.get("/api/family/members"),
      api.get("/api/categories", { params: { kind: "income" } }),
      api.get("/api/categories", { params: { kind: "expense" } }),
      api.get("/api/accounts"),
    ]);

    setMembers(mRes.data.members || []);
    setIncomeCats(inc.data.items || []);
    setExpenseCats(exp.data.items || []);
    setAccounts((acc.data.items || []).filter((a) => a.isActive !== false));
  }

  async function loadTransactions() {
    setLoading(true);
    setMsg("");

    try {
      const baseParams = { month };

      const txParams = { ...baseParams };
      if (activeTab !== "all") txParams.txType = activeTab;

      const ledgerParams = { ...baseParams };
      if (activeTab !== "all" && activeTab !== "transfer") {
        ledgerParams.entryType = activeTab;
      }

      const [listRes, allRes, sumRes, ledgerRes] = await Promise.all([
        api.get("/api/transactions", { params: txParams }),
        api.get("/api/transactions", { params: baseParams }),
        api.get("/api/transactions/summary", { params: baseParams }),
        api.get("/api/ledger", { params: ledgerParams }),
      ]);

      setItems(listRes.data.items || []);
      setAllItems(allRes.data.items || []);
      setTotals(sumRes.data.totals || { income: 0, expense: 0, transfer: 0, netCashflow: 0 });
      setLedgerItems(ledgerRes.data.items || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBasics();
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, activeTab]);

  const memberById = useMemo(() => {
    const m = new Map();
    for (const x of members || []) m.set(getId(x), x);
    return m;
  }, [members]);

  const accountsById = useMemo(() => {
    const m = new Map();
    for (const a of accounts || []) m.set(String(a._id), a);
    return m;
  }, [accounts]);

  const ownerToMemberId = useMemo(() => {
    const out = { Mahbub: "", Mirza: "", Joint: "" };
    const lowerMembers = (members || []).map((m) => ({ id: getId(m), name: String(m.name || "").toLowerCase() }));
    const findByKeyword = (kw) => lowerMembers.find((x) => x.name.includes(kw.toLowerCase()))?.id || "";
    out.Mahbub = findByKeyword("mahbub");
    out.Mirza = findByKeyword("mirza");
    return out;
  }, [members]);

  const showCategory = form.txType !== "transfer";
  const showFrom = form.txType === "expense" || form.txType === "transfer";
  const showTo = form.txType === "income" || form.txType === "transfer";

  function openModal() {
    setMsg("");
    const defaultUser = getId(members?.[0]) || "";
    const defaultAccount = accounts?.[0]?._id || "";

    setForm((f) => ({
      ...f,
      paidByUserId: f.paidByUserId || defaultUser,
      receivedByUserId: f.receivedByUserId || defaultUser,
      fromAccountId: f.fromAccountId || defaultAccount,
      toAccountId: f.toAccountId || defaultAccount,
    }));
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  async function createTx() {
    setMsg("");
    try {
      const amt = Number(form.amount);
      if (!amt || amt <= 0) return setMsg("Amount must be > 0");
      if (showCategory && !form.categoryId) return setMsg("Select a category");
      if (showFrom && !form.fromAccountId) return setMsg("Select From account");
      if (showTo && !form.toAccountId) return setMsg("Select To account");
      if (form.txType === "transfer" && form.fromAccountId === form.toAccountId)
        return setMsg("From and To accounts must be different");

      const payload = {
        txType: form.txType,
        date: form.date,
        amount: amt,
        note: form.note,
        categoryId: showCategory ? form.categoryId : null,
        fromAccountId: showFrom ? form.fromAccountId : null,
        toAccountId: showTo ? form.toAccountId : null,
        paidByUserId: form.txType === "expense" ? form.paidByUserId : null,
        receivedByUserId: form.txType === "income" ? form.receivedByUserId : null,
      };

      await api.post("/api/transactions", payload);
      closeModal();
      await loadTransactions();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Create failed");
    }
  }

  function deleteTx(id) {
    setDeleteId(id);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);
    try {
      await api.delete(`/api/transactions/${deleteId}`);
      await loadTransactions();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  async function rebuildLedger() {
    setMsg("");
    try {
      await api.post("/api/ledger/rebuild", { month });
      await loadTransactions();
      setMsg("✅ Ledger rebuilt successfully for " + month);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Rebuild failed");
    }
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const filtered = (items || []).filter((it) => {
      if (memberFilter !== "all") {
        const filterId = String(memberFilter);
        if (it.txType === "income" && getId(it.receivedByUserId) !== filterId) return false;
        if (it.txType === "expense" && getId(it.paidByUserId) !== filterId) return false;
      }

      if (!needle) return true;

      const catName = it.categoryId?.name || "";
      const fromName = it.fromAccountId?.name || "";
      const toName = it.toAccountId?.name || "";
      const note = it.note || "";
      const hay = `${catName} ${fromName} ${toName} ${note} ${it.txType}`.toLowerCase();
      return hay.includes(needle);
    });

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [items, memberFilter, q]);

  // ✅ NEW: available dates from current "rows" (already filtered by tab/member/search)
  const availableDates = useMemo(() => {
    const s = new Set();
    for (const it of rows || []) {
      s.add(toLocalYMD(it.date));
    }
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1)); // latest first
  }, [rows]);

  // ✅ NEW: auto set day to latest date in this month after filters change
  useEffect(() => {
    if (!availableDates.length) return;

    const dayMonth = (day || "").slice(0, 7);
    if (dayMonth !== month) {
      setDay(availableDates[0]);
      return;
    }

    if (!availableDates.includes(day)) {
      setDay(availableDates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates, month]);

  // ✅ NEW: show only selected day’s items (like Grocery)
  const dayRows = useMemo(() => {
    return (rows || []).filter((it) => toLocalYMD(it.date) === day);
  }, [rows, day]);

  const memberStats = useMemo(() => {
    const by = {};
    for (const m of members || []) {
      const id = getId(m);
      by[id] = { id, name: m.name, income: 0, expense: 0, transferIn: 0, transferOut: 0 };
    }

    for (const e of ledgerItems || []) {
      const amt = Number(e.amountTotal || 0);

      if (e.entryType === "income") {
        const splits = Array.isArray(e.splits) ? e.splits : [];
        if (splits.length > 0) {
          for (const s of splits) {
            const id = getId(s.userId);
            if (id && by[id]) by[id].income += Number(s.shareAmount || 0);
          }
        } else {
          const id = getId(e.receivedByUserId);
          if (id && by[id]) by[id].income += amt;
        }
      }

      if (e.entryType === "expense") {
        const splits = Array.isArray(e.splits) ? e.splits : [];
        if (splits.length > 0) {
          for (const s of splits) {
            const id = getId(s.userId);
            if (id && by[id]) by[id].expense += Number(s.shareAmount || 0);
          }
        } else {
          const id = getId(e.paidByUserId);
          if (id && by[id]) by[id].expense += amt;
        }
      }
    }

    const membersArr = Object.values(by);
    const memberCount = Math.max(1, membersArr.length);

    for (const t of allItems || []) {
      if (t.txType !== "transfer") continue;
      const amt = Number(t.amount || 0);
      const fromAcc = accountsById.get(getId(t.fromAccountId));
      const toAcc = accountsById.get(getId(t.toAccountId));

      const fromOwner = fromAcc?.owner || "Joint";
      const toOwner = toAcc?.owner || "Joint";

      const fromMemberId = ownerToMemberId[fromOwner] || "";
      const toMemberId = ownerToMemberId[toOwner] || "";

      if (fromOwner === "Joint" || !fromMemberId) {
        const share = amt / memberCount;
        for (const m of membersArr) m.transferOut += share;
      } else if (by[fromMemberId]) {
        by[fromMemberId].transferOut += amt;
      }

      if (toOwner === "Joint" || !toMemberId) {
        const share = amt / memberCount;
        for (const m of membersArr) m.transferIn += share;
      } else if (by[toMemberId]) {
        by[toMemberId].transferIn += amt;
      }
    }

    const list = Object.values(by).map((x) => ({
      ...x,
      transferIn: Number(x.transferIn || 0),
      transferOut: Number(x.transferOut || 0),
      remaining: Number(x.income || 0) - Number(x.expense || 0),
    }));

    list.sort((a, b) => b.remaining - a.remaining);
    return list;
  }, [ledgerItems, allItems, members, accountsById, ownerToMemberId]);

  const topExpenseCategory = useMemo(() => {
    const m = new Map();
    for (const it of allItems || []) {
      if (it.txType !== "expense") continue;
      const name = it.categoryId?.name || "Uncategorized";
      m.set(name, (m.get(name) || 0) + Number(it.amount || 0));
    }
    let best = { name: "—", amount: 0 };
    for (const [name, amount] of m.entries()) {
      if (amount > best.amount) best = { name, amount };
    }
    return best;
  }, [allItems]);

  const typeLabel = (t) =>
    t === "income" ? "Income" : t === "expense" ? "Expense" : t === "transfer" ? "Transfer" : t;

  return (
    <AppLayout>
      <div className="">
        <div className="mb-5 rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500">HomeFinance Ledger</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Transactions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track <b>Income</b>, <b>Expense</b>, and <b>Transfer</b>. Individual summary uses <b>ledger entries</b>{" "}
                (split-aware). If ledger entries are missing, rebuild once.
              </p>
            </div>

            <div className="grid sm:flex-row gap-2 sm:items-center">
              <div className="flex gap-2">
                <input
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  type="month"
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                />
                <button
                  onClick={openModal}
                  className="bg-black text-white rounded-lg px-4 py-2 text-sm shadow-sm hover:opacity-95 active:opacity-90"
                >
                  + Add
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-white w-full sm:w-64"
                  placeholder="Search category, note, account…"
                />
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-white"
                  title="Filter by member"
                >
                  <option value="all">All members</option>
                  {members.map((m) => (
                    <option key={getId(m)} value={getId(m)}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Biggest expense this month: <b>{topExpenseCategory.name}</b> ({money(topExpenseCategory.amount)}).
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            All
          </TabButton>
          <TabButton active={activeTab === "income"} onClick={() => setActiveTab("income")}>
            Income
          </TabButton>
          <TabButton active={activeTab === "expense"} onClick={() => setActiveTab("expense")}>
            Expense
          </TabButton>
          <TabButton active={activeTab === "transfer"} onClick={() => setActiveTab("transfer")}>
            Transfer
          </TabButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricCard title="Income" value={money(totals.income)} tone="income" />

              <MetricCard title="Expense" value={money(totals.expense)} tone="expense" />

              <MetricCard
                title="Remaining Expense"
                value={money(remainingExpense)}
                subtitle={`Expense - Fixed (${money(fixedExpenseTotal)})`}
                tone="neutral"
              />

              <MetricCard title="Transfer" value={money(totals.transfer)} tone="transfer" />

              <MetricCard
                title="Net Cashflow"
                value={money(totals.netCashflow)}
                subtitle={totals.netCashflow < 0 ? "Overspending this month" : "Healthy month so far"}
                tone="net"
              />
            </div>

            <div className="mt-4 rounded-2xl border bg-white">
              <div className="p-4 border-b flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Individual summary (split-aware)</div>
                  <div className="text-xs text-gray-500">
                    Remaining = Income (splits) − Expense (splits). Transfers shown separately.
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Ledger entries loaded: <b>{ledgerItems.length}</b> • Transactions loaded: <b>{allItems.length}</b>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Total Remaining:{" "}
                    <b>{money(memberStats.reduce((s, x) => s + (x.remaining || 0), 0))}</b>
                  </div>

                  {ledgerItems.length === 0 && allItems.length > 0 ? (
                    <button
                      onClick={rebuildLedger}
                      className="text-xs border rounded-lg px-3 py-2 hover:bg-gray-50"
                      title="Rebuild ledger entries from transactions"
                    >
                      Rebuild Ledger
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {memberStats.length === 0 ? (
                  <div className="text-sm text-gray-600">No family members found.</div>
                ) : (
                  memberStats.map((m) => {
                    const maxAbs = Math.max(
                      1,
                      ...memberStats.map((x) =>
                        Math.max(
                          Math.abs(x.income),
                          Math.abs(x.expense),
                          Math.abs(x.remaining),
                          Math.abs(x.transferIn),
                          Math.abs(x.transferOut)
                        )
                      )
                    );

                    const remP = pct(Math.abs(m.remaining), maxAbs);
                    const isNeg = m.remaining < 0;

                    return (
                      <div key={m.id} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-semibold text-gray-700">
                            {initials(m.name)}
                          </div>

                          <div className="flex-1">
                            <div className="text-sm font-semibold">{m.name}</div>
                            <div className="text-xs text-gray-500">
                              Income {money(m.income)} • Expense {money(m.expense)}
                              <br />
                              Transfer In {money(m.transferIn)} • Transfer Out {money(m.transferOut)}
                            </div>
                          </div>

                          <div className={cn("text-sm font-semibold", isNeg ? "text-rose-600" : "text-emerald-700")}>
                            {money(m.remaining)}
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={cn("h-2", isNeg ? "bg-rose-500" : "bg-emerald-500")}
                              style={{ width: `${remP}%` }}
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {isNeg ? "Over budget (negative remaining)" : "Remaining available"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold">Quick insights</div>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Transactions (month)</span>
                  <b>{allItems.length}</b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shown now (day)</span>
                  <b>{dayRows.length}</b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Top expense</span>
                  <b className="truncate max-w-[160px]" title={topExpenseCategory.name}>
                    {topExpenseCategory.name}
                  </b>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-gray-600">
                Tip: Transfers are attributed using <b>account ownership</b> (Mahbub/Mirza/Joint). If an account owner is
                wrong, transfer per-person may show 0 or split equally.
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Day-based list (like Grocery) */}
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm font-semibold">
              {month} — {dayRows.length} item(s)
              {availableDates.length ? (
                <span className="text-xs font-normal text-gray-500"> • (Showing {day})</span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Date</span>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setDay(dayNow())}
                className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
              >
                Today
              </button>

              <div className="text-xs text-gray-500">
                Logged in as <b>{me?.name || "User"}</b>
              </div>
            </div>
          </div>

          {msg && <div className="px-4 py-3 text-sm text-rose-600 border-b bg-rose-50">{msg}</div>}

          {loading ? (
            <div className="p-5">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-gray-600 text-sm">
              No transactions match your filters. Click <b>+ Add</b> to create one.
            </div>
          ) : dayRows.length === 0 ? (
            <div className="p-6 text-gray-600 text-sm">
              No transactions found for <b>{day}</b>. Try another date.
            </div>
          ) : (
            <div className="divide-y">
              {dayRows.map((it) => {
                const catName = it.categoryId?.name;
                const fromName = it.fromAccountId?.name;
                const toName = it.toAccountId?.name;

                let details = "";
                if (it.txType === "transfer") details = `${fromName || "-"} → ${toName || "-"}`;
                else if (it.txType === "income") details = `${catName || "-"} • To: ${toName || "-"}`;
                else details = `${catName || "-"} • From: ${fromName || "-"}`;

                if (it.note) details += ` • ${it.note}`;

                const who =
                  it.txType === "income"
                    ? memberById.get(getId(it.receivedByUserId))?.name
                    : it.txType === "expense"
                      ? memberById.get(getId(it.paidByUserId))?.name
                      : null;

                return (
                  <div key={it._id} className="px-4 py-3 flex items-start gap-3">
                    <div className="pt-1">
                      <IconDot txType={it.txType} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900">{typeLabel(it.txType)}</div>
                        {who ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {who}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 break-words">{details}</div>
                    </div>

                    <div className="text-right">
                      <div
                        className={cn(
                          "text-sm font-semibold",
                          it.txType === "income"
                            ? "text-emerald-700"
                            : it.txType === "expense"
                              ? "text-rose-700"
                              : "text-sky-700"
                        )}
                      >
                        {it.txType === "expense" ? "-" : it.txType === "income" ? "+" : ""}
                        {money(it.amount)}
                      </div>
                      <button
                        onClick={() => deleteTx(it._id)}
                        className="mt-2 text-xs border rounded-lg px-3 py-1 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <ConfirmModal
          open={confirmOpen}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="text-lg font-semibold mb-1">Add Transaction</h3>
              <p className="text-sm text-gray-500 mb-4">
                Use <b>Transfer</b> for moving money between accounts (e.g., Bank → DPS).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={form.txType}
                    onChange={(e) => setForm({ ...form, txType: e.target.value, categoryId: "" })}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                {showCategory && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">Select</option>
                      {(form.txType === "income" ? incomeCats : expenseCats).map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {showFrom && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">From Account</label>
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
                  </div>
                )}

                {showTo && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">To Account</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={form.toAccountId}
                      onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                    >
                      <option value="">Select</option>
                      {accounts.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.txType === "expense" && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Paid By</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={form.paidByUserId}
                      onChange={(e) => setForm({ ...form, paidByUserId: e.target.value })}
                    >
                      <option value="">Select</option>
                      {members.map((m) => (
                        <option key={getId(m)} value={getId(m)}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.txType === "income" && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Received By</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={form.receivedByUserId}
                      onChange={(e) => setForm({ ...form, receivedByUserId: e.target.value })}
                    >
                      <option value="">Select</option>
                      {members.map((m) => (
                        <option key={getId(m)} value={getId(m)}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-3 py-2"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g., 5000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Note (optional)</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={form.txType === "transfer" ? "e.g., DPS deposit" : "e.g., Electricity bill"}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button onClick={closeModal} className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={createTx} className="bg-black text-white rounded-lg px-4 py-2 text-sm">
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