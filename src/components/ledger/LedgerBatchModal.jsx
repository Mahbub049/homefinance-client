import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { preferredMemberId } from "../../utils/preferredMember";

const MAX_ROWS = 30;
const inputClass = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none [color-scheme:light] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]";
const labelClass = "mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300";
const moneyText = (n) => `৳ ${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const idOf = (value) => String(value?.id || value?._id || value || "");
const rounded = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const correctMoney = (n) => Number.isFinite(Number(n)) && Number(n) > 0 && Math.abs(Number(n) * 100 - Math.round(Number(n) * 100)) < 0.000001;

function ownedAccounts(accounts, memberId, members) {
  const name = String(members.find((m) => idOf(m) === memberId)?.name || "").toLowerCase();
  return accounts.filter((a) => {
    if (a.isActive === false || !["cash", "bank", "wallet"].includes(String(a.type || "").toLowerCase())) return false;
    const owner = String(a.owner || "").trim().toLowerCase();
    if (["joint", "shared", "family"].includes(owner)) return true;
    if (owner === "mahbub") return name.includes("mahbub");
    if (owner === "mirza") return name.includes("mirza");
    return false;
  });
}

function payerParts(members, accounts) {
  return members.map((m) => ({
    userId: idOf(m),
    accountId: ownedAccounts(accounts, idOf(m), members)?.[0]?._id || "",
    amount: "",
  }));
}

function makeRow(key, members, accounts, user, template = null) {
  const defaultMember = preferredMemberId(members, user);
  const payer = template?.paidByUserId || defaultMember;
  const receiver = template?.receivedByUserId || defaultMember;
  return {
    key,
    txType: template?.txType || "expense",
    categoryId: template?.categoryId || "",
    amount: "",
    note: "",
    paidByUserId: payer,
    receivedByUserId: receiver,
    fromAccountId: template?.fromAccountId || ownedAccounts(accounts, payer, members)?.[0]?._id || "",
    toAccountId: template?.toAccountId || ownedAccounts(accounts, receiver, members)?.[0]?._id || "",
    paymentMode: template?.paymentMode || "single",
    paymentParts: payerParts(members, accounts),
    splitType: template?.splitType || "personal",
    personalUserId: template?.personalUserId || payer,
    shares: members.map((m, i) => ({
      userId: idOf(m),
      ratio: template?.shares?.find((s) => s.userId === idOf(m))?.ratio ?? String(
        (Math.floor(10000 / Math.max(1, members.length)) +
          (i === members.length - 1 ? 10000 % members.length : 0)) / 100
      ),
      fixed: "",
    })),
  };
}

function Labelled({ label, children, className = "" }) {
  return (
    <label className={`min-w-0 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function buildPayload(row, date, members, accounts) {
  const indexName = (id) => members.find((m) => idOf(m) === id)?.name;
  const amount = Number(row.amount);
  if (!correctMoney(row.amount)) throw new Error("টাকার পরিমাণ সঠিকভাবে লিখুন (সর্বোচ্চ দুই দশমিক)।");
  if (row.txType !== "transfer" && !row.categoryId) throw new Error("খরচ বা আয়ের ধরন বাছুন।");

  const base = {
    txType: row.txType,
    date,
    amount,
    categoryId: row.txType === "transfer" ? null : row.categoryId,
    note: row.note.trim(),
    paidByUserId: null,
    receivedByUserId: null,
    fromAccountId: null,
    toAccountId: null,
    paymentMode: "single",
    paymentParts: [],
    split: null,
  };

  if (row.txType === "transfer") {
    if (!row.fromAccountId || !row.toAccountId) throw new Error("পাঠানোর ও পাওয়ার অ্যাকাউন্ট বাছুন।");
    if (row.fromAccountId === row.toAccountId) throw new Error("একই অ্যাকাউন্টে টাকা পাঠানো যায় না।");
    return { ...base, fromAccountId: row.fromAccountId, toAccountId: row.toAccountId };
  }

  if (row.txType === "income") {
    if (!row.receivedByUserId || !indexName(row.receivedByUserId)) throw new Error("আয় পাওয়া সদস্য বাছুন।");
    if (!row.toAccountId || !ownedAccounts(accounts, row.receivedByUserId, members).some((a) => idOf(a) === row.toAccountId))
      throw new Error("আয় পাওয়া সদস্যের বৈধ অ্যাকাউন্ট বাছুন।");
    return { ...base, toAccountId: row.toAccountId, receivedByUserId: row.receivedByUserId };
  }

  if (row.paymentMode === "split") {
    if (row.paymentParts.length < 2) throw new Error("যৌথ পরিশোধের জন্য অন্তত দুজন সদস্য প্রয়োজন।");
    const paid = row.paymentParts.reduce((sum, p) => sum + Math.round(Number(p.amount || 0) * 100), 0);
    if (paid !== Math.round(amount * 100)) throw new Error("প্রত্যেক সদস্যের দেওয়া টাকার যোগফল মোট টাকার সমান হতে হবে।");
    for (const part of row.paymentParts) {
      if (!correctMoney(part.amount) || !ownedAccounts(accounts, part.userId, members).some((a) => idOf(a) === part.accountId))
        throw new Error("যৌথ পরিশোধের প্রত্যেক সদস্যের অ্যাকাউন্ট ও টাকা যাচাই করুন।");
    }
    base.paymentMode = "split";
    base.paymentParts = row.paymentParts.map((p) => ({ userId: p.userId, accountId: p.accountId, amount: Number(p.amount) }));
  } else {
    if (!row.paidByUserId || !indexName(row.paidByUserId)) throw new Error("টাকা দিয়েছেন এমন সদস্য বাছুন।");
    if (!row.fromAccountId || !ownedAccounts(accounts, row.paidByUserId, members).some((a) => idOf(a) === row.fromAccountId))
      throw new Error("পরিশোধকারী সদস্যের বৈধ অ্যাকাউন্ট বাছুন।");
    base.paidByUserId = row.paidByUserId;
    base.fromAccountId = row.fromAccountId;
  }

  const split = { type: row.splitType };
  if (row.splitType === "personal") {
    if (!row.personalUserId || !indexName(row.personalUserId)) throw new Error("খরচটি কার, সেই সদস্য বাছুন।");
    split.personalUserId = row.personalUserId;
  } else if (row.splitType === "ratio") {
    const ratios = row.shares.map((p) => ({ userId: p.userId, ratio: Number(p.ratio) }));
    if (ratios.some((p) => !Number.isFinite(p.ratio) || p.ratio < 0) || Math.abs(ratios.reduce((s, p) => s + p.ratio, 0) - 100) > 0.000001)
      throw new Error("সবার খরচের শতাংশ মিলে ১০০% হতে হবে।");
    split.ratios = ratios;
  } else if (row.splitType === "fixed") {
    const fixed = row.shares.map((p) => ({ userId: p.userId, amount: Number(p.fixed) }));
    if (fixed.some((p) => !Number.isFinite(p.amount) || p.amount < 0 || Math.abs(p.amount * 100 - Math.round(p.amount * 100)) > 0.000001) ||
      fixed.reduce((s, p) => s + Math.round(p.amount * 100), 0) !== Math.round(amount * 100))
      throw new Error("নির্দিষ্ট ভাগের যোগফল মোট খরচের সমান হতে হবে।");
    split.fixed = fixed;
  } else if (row.splitType !== "equal") {
    throw new Error("খরচের ভাগ বাছুন।");
  }
  base.split = split;
  return base;
}

export default function LedgerBatchModal({ date: initialDate, members, accounts, incomeCats, expenseCats, user, onClose, onSaved }) {
  const nextId = useRef(3);
  const savingRef = useRef(false);
  const attemptRef = useRef(null);
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState(() => [makeRow(1, members, accounts, user), makeRow(2, members, accounts, user)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const totals = useMemo(() => rows.reduce((sum, row) => {
    if (!correctMoney(row.amount)) return sum;
    const sign = row.txType === "expense" ? "expense" : row.txType === "income" ? "income" : "transfer";
    sum[sign] += Number(row.amount);
    return sum;
  }, { expense: 0, income: 0, transfer: 0 }), [rows]);

  function updateRow(key, changes) {
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, ...changes } : r));
    setError("");
    setReview(false);
  }

  function changeType(row, txType) {
    const payer = row.paidByUserId || preferredMemberId(members, user);
    const receiver = row.receivedByUserId || preferredMemberId(members, user);
    updateRow(row.key, {
      txType,
      categoryId: "",
      paymentMode: "single",
      fromAccountId: txType === "transfer" ? (accounts.find((a) => idOf(a) === row.fromAccountId)?._id || accounts[0]?._id || "") : ownedAccounts(accounts, payer, members)?.[0]?._id || "",
      toAccountId: txType === "transfer" ? (accounts.find((a) => idOf(a) === row.toAccountId)?._id || accounts[1]?._id || "") : ownedAccounts(accounts, receiver, members)?.[0]?._id || "",
    });
  }

  function changePayer(row, memberId, receiving = false) {
    const options = ownedAccounts(accounts, memberId, members);
    updateRow(row.key, receiving ? {
      receivedByUserId: memberId,
      toAccountId: options[0]?._id || "",
    } : {
      paidByUserId: memberId,
      fromAccountId: options[0]?._id || "",
      personalUserId: row.personalUserId === row.paidByUserId ? memberId : row.personalUserId,
    });
  }

  function changePart(row, memberId, changes) {
    const paymentParts = row.paymentParts.map((p) => p.userId === memberId ? { ...p, ...changes } : p);
    const allEntered = paymentParts.every((p) => p.amount !== "");
    updateRow(row.key, {
      paymentParts,
      amount: allEntered ? String(rounded(paymentParts.reduce((s, p) => s + Number(p.amount || 0), 0))) : "",
    });
  }

  function addRow(source) {
    if (rows.length >= MAX_ROWS) return;
    setRows((prev) => [...prev, makeRow(nextId.current++, members, accounts, user, source)]);
    setReview(false);
    setError("");
  }

  function validateAll() {
    // Native date inputs display localized dates but always submit ISO YYYY-MM-DD values.
    // Match the server's strict ISO validation, including invalid calendar dates.
    const hasIsoFormat = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
    const parsedDate = hasIsoFormat ? new Date(`${date}T12:00:00Z`) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new Error("সঠিক তারিখ বাছুন।");
    }
    if (date < "2026-10-01") throw new Error("অক্টোবর ২০২৬-এর আগের হিসাব পরিবর্তন করা যাবে না।");
    if (rows.length < 2) throw new Error("একসঙ্গে হিসাব যোগ করতে অন্তত দুটি এন্ট্রি দিন।");
    return rows.map((row, i) => {
      try { return buildPayload(row, date, members, accounts); }
      catch (e) { throw new Error(`হিসাব ${i + 1}: ${e.message}`); }
    });
  }

  async function submit() {
    if (savingRef.current) return;
    setError("");
    let entries;
    try { entries = validateAll(); }
    catch (e) { setReview(false); setError(e.message); return; }
    if (!review) { setReview(true); return; }
    const request = { date, entries };
    const fingerprint = JSON.stringify(request);
    if (!attemptRef.current || attemptRef.current.fingerprint !== fingerprint)
      attemptRef.current = { fingerprint, key: crypto.randomUUID() };
    savingRef.current = true;
    setBusy(true);
    try {
      const response = await api.post("/api/transactions/batch", request, {
        headers: { "Idempotency-Key": attemptRef.current.key },
      });
      toast.success(`${response.data.savedCount}টি হিসাব আলাদা এন্ট্রি হিসেবে সংরক্ষিত হয়েছে।`);
      onSaved(date);
    } catch (e) {
      const message = e?.response?.data?.message || "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন; একই হিসাব দুবার সংরক্ষণ হবে না।";
      setError(message);
      setReview(false);
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  }

  const regularAccountOptions = accounts.filter((a) => a.isActive !== false && ["cash", "bank", "wallet", "savings", "investment"].includes(String(a.type).toLowerCase()));
  const choices = (items, placeholder = "বাছুন") => <><option value="">{placeholder}</option>{items.map((item) => <option key={idOf(item)} value={idOf(item)}>{item.name}{item.owner ? ` (${item.owner})` : ""}</option>)}</>;

  return (
    <div className="app-modal-overlay items-stretch p-0 sm:items-center sm:p-4" role="presentation">
      <section className="app-modal-panel ledger-batch-panel flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:h-[min(93dvh,940px)] sm:rounded-[26px]" role="dialog" aria-modal="true" aria-labelledby="ledger-batch-title">
        <header className="relative shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950 sm:px-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">একসঙ্গে এক দিনের হিসাব</span>
              <h2 id="ledger-batch-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">একাধিক হিসাব যোগ করুন</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সব এন্ট্রি একসঙ্গে সংরক্ষণ হবে, কিন্তু প্রতিটি আয়, খরচ ও আদান-প্রদান আলাদা হিসাবে থাকবে।</p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label="বন্ধ করুন" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-xl dark:border-white/10">×</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Labelled label="সব হিসাবের তারিখ">
              <input className={inputClass} type="date" value={date} onChange={(e) => { setDate(e.target.value); setReview(false); setError(""); }} />
            </Labelled>
            <span className="mt-4 text-xs text-slate-500 dark:text-slate-400">এক ব্যাচে সর্বোচ্চ {MAX_ROWS.toLocaleString("bn-BD")}টি এন্ট্রি</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-950 sm:p-5">
          {rows.map((row, index) => {
            const payerAccounts = ownedAccounts(accounts, row.paidByUserId, members);
            const receiverAccounts = ownedAccounts(accounts, row.receivedByUserId, members);
            const categoryOptions = (row.txType === "income" ? incomeCats : expenseCats).filter((c) => String(c?.name || "").trim().toLowerCase() !== "emi");
            return (
              <article key={row.key} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-600 text-xs font-black text-white">{(index + 1).toLocaleString("bn-BD")}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{row.txType === "expense" ? "খরচ" : row.txType === "income" ? "আয়" : "টাকা আদান-প্রদান"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addRow(row)} disabled={rows.length >= MAX_ROWS} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-500/10">অনুরূপ এন্ট্রি +</button>
                    <button type="button" onClick={() => { setRows((all) => all.filter((r) => r.key !== row.key)); setReview(false); setError(""); }} disabled={rows.length <= 2} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-500/10">বাদ দিন</button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Labelled label="হিসাবের ধরন">
                    <select className={inputClass} value={row.txType} onChange={(e) => changeType(row, e.target.value)}>
                      <option value="expense">খরচ</option><option value="income">আয়</option><option value="transfer">টাকা আদান-প্রদান</option>
                    </select>
                  </Labelled>
                  {row.txType !== "transfer" && <Labelled label={row.txType === "income" ? "আয়ের ধরন" : "খরচের ধরন"}>
                    <select className={inputClass} value={row.categoryId} onChange={(e) => updateRow(row.key, { categoryId: e.target.value })}>
                      {choices(categoryOptions, "ধরন বাছুন")}
                    </select>
                  </Labelled>}
                  <Labelled label="টাকা">
                    <input className={inputClass} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" readOnly={row.txType === "expense" && row.paymentMode === "split"} value={row.amount} onChange={(e) => updateRow(row.key, { amount: e.target.value })} />
                  </Labelled>
                  <Labelled label="বিবরণ (ঐচ্ছিক)" className={row.txType === "transfer" ? "sm:col-span-2" : ""}>
                    <input className={inputClass} value={row.note} onChange={(e) => updateRow(row.key, { note: e.target.value })} placeholder="কীসের হিসাব?" />
                  </Labelled>

                  {row.txType === "expense" && <>
                    <Labelled label="টাকা দিয়েছেন">
                      <select className={inputClass} value={row.paymentMode === "split" ? "__split__" : row.paidByUserId} onChange={(e) => {
                        if (e.target.value === "__split__") {
                          updateRow(row.key, { paymentMode: "split", paymentParts: payerParts(members, accounts), amount: "" });
                        } else {
                          const next = ownedAccounts(accounts, e.target.value, members);
                          updateRow(row.key, { paymentMode: "single", paidByUserId: e.target.value, fromAccountId: next[0]?._id || "", amount: row.paymentMode === "split" ? "" : row.amount, personalUserId: row.personalUserId === row.paidByUserId ? e.target.value : row.personalUserId });
                        }
                      }}>
                        {members.map((m) => <option key={idOf(m)} value={idOf(m)}>{m.name}</option>)}
                        {members.length >= 2 && <option value="__split__">যৌথ পরিশোধ</option>}
                      </select>
                    </Labelled>
                    {row.paymentMode === "single" && <Labelled label="যে অ্যাকাউন্ট থেকে দিয়েছেন">
                      <select className={inputClass} value={row.fromAccountId} onChange={(e) => updateRow(row.key, { fromAccountId: e.target.value })}>
                        {choices(payerAccounts, "অ্যাকাউন্ট বাছুন")}
                      </select>
                    </Labelled>}
                  </>}

                  {row.txType === "income" && <>
                    <Labelled label="টাকা পেয়েছেন">
                      <select className={inputClass} value={row.receivedByUserId} onChange={(e) => changePayer(row, e.target.value, true)}>
                        {members.map((m) => <option key={idOf(m)} value={idOf(m)}>{m.name}</option>)}
                      </select>
                    </Labelled>
                    <Labelled label="যে অ্যাকাউন্টে জমা হয়েছে">
                      <select className={inputClass} value={row.toAccountId} onChange={(e) => updateRow(row.key, { toAccountId: e.target.value })}>
                        {choices(receiverAccounts, "অ্যাকাউন্ট বাছুন")}
                      </select>
                    </Labelled>
                  </>}

                  {row.txType === "transfer" && <>
                    <Labelled label="যে অ্যাকাউন্ট থেকে">
                      <select className={inputClass} value={row.fromAccountId} onChange={(e) => updateRow(row.key, { fromAccountId: e.target.value })}>{choices(regularAccountOptions, "উৎস অ্যাকাউন্ট")}</select>
                    </Labelled>
                    <Labelled label="যে অ্যাকাউন্টে যাবে">
                      <select className={inputClass} value={row.toAccountId} onChange={(e) => updateRow(row.key, { toAccountId: e.target.value })}>{choices(regularAccountOptions, "গন্তব্য অ্যাকাউন্ট")}</select>
                    </Labelled>
                  </>}
                </div>

                {row.txType === "expense" && <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/40 p-3 dark:border-teal-400/20 dark:bg-teal-500/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Labelled label="খরচের ভাগ হবে">
                      <select className={inputClass} value={row.splitType} onChange={(e) => updateRow(row.key, { splitType: e.target.value })}>
                        <option value="personal">ব্যক্তিগত</option><option value="equal">সমান</option><option value="ratio">শতাংশ অনুযায়ী</option><option value="fixed">নির্দিষ্ট টাকা</option>
                      </select>
                    </Labelled>
                    {row.splitType === "personal" && <Labelled label="কার জন্য">
                      <select className={inputClass} value={row.personalUserId} onChange={(e) => updateRow(row.key, { personalUserId: e.target.value })}>{members.map((m) => <option value={idOf(m)} key={idOf(m)}>{m.name}</option>)}</select>
                    </Labelled>}
                    {row.paymentMode === "split" && <span className="text-xs text-slate-500 dark:text-slate-300">মোট টাকা সদস্যদের দেওয়া টাকা থেকে হিসাব হবে</span>}
                  </div>
                  {(row.splitType === "ratio" || row.splitType === "fixed") && <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {row.shares.map((share) => <Labelled key={share.userId} label={`${members.find((m) => idOf(m) === share.userId)?.name || "সদস্য"} — ${row.splitType === "ratio" ? "শতাংশ" : "টাকা"}`}>
                      <input className={inputClass} type="number" min="0" step="0.01" value={row.splitType === "ratio" ? share.ratio : share.fixed} onChange={(e) => updateRow(row.key, { shares: row.shares.map((s) => s.userId === share.userId ? { ...s, [row.splitType === "ratio" ? "ratio" : "fixed"]: e.target.value } : s) })} />
                    </Labelled>)}
                  </div>}
                  {row.paymentMode === "split" && <div className="mt-3 grid gap-3 border-t border-teal-100 pt-3 dark:border-teal-500/20 sm:grid-cols-2">
                    {row.paymentParts.map((part) => <div key={part.userId} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
                      <div className="mb-2 text-xs font-bold text-slate-800 dark:text-white">{members.find((m) => idOf(m) === part.userId)?.name || "সদস্য"}</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Labelled label="অ্যাকাউন্ট"><select className={inputClass} value={part.accountId} onChange={(e) => changePart(row, part.userId, { accountId: e.target.value })}>{choices(ownedAccounts(accounts, part.userId, members), "অ্যাকাউন্ট")}</select></Labelled>
                        <Labelled label="দিয়েছেন (৳)"><input className={inputClass} type="number" min="0.01" step="0.01" value={part.amount} onChange={(e) => changePart(row, part.userId, { amount: e.target.value })} placeholder="0.00" /></Labelled>
                      </div>
                    </div>)}
                  </div>}
                </div>}
              </article>
            );
          })}

          {rows.length < MAX_ROWS && <button type="button" onClick={() => addRow()} className="w-full rounded-xl border border-dashed border-teal-400 bg-teal-50 px-4 py-3 text-sm font-black text-teal-800 hover:bg-teal-100 dark:border-teal-600 dark:bg-teal-500/10 dark:text-teal-200">+ আরও একটি হিসাব যোগ করুন</button>}
          {review && <section className="rounded-2xl border border-teal-300 bg-teal-50 p-4 dark:border-teal-400/30 dark:bg-teal-500/10">
            <h3 className="text-base font-black text-teal-900 dark:text-teal-200">সংরক্ষণের আগে যাচাই করুন</h3>
            <p className="mt-1 text-xs text-teal-800 dark:text-teal-200">সব {rows.length.toLocaleString("bn-BD")}টি হিসাব আলাদা এন্ট্রি হবে। কোনো সমস্যা হলে একটিও সংরক্ষিত হবে না।</p>
            <ol className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
              {rows.map((r, i) => <li key={r.key} className="flex justify-between gap-3 border-b border-teal-100 pb-1 dark:border-white/10"><span>{(i + 1).toLocaleString("bn-BD")}. {r.txType === "income" ? "আয়" : r.txType === "expense" ? "খরচ" : "আদান-প্রদান"} — {r.note || [...incomeCats, ...expenseCats].find((c) => idOf(c) === r.categoryId)?.name || "হিসাব"}</span><strong>{moneyText(r.amount)}</strong></li>)}
            </ol>
          </section>}
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200" role="alert">{error}</p>}
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:pb-4">
          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>{rows.length.toLocaleString("bn-BD")}টি হিসাব</span><span>আয় {moneyText(totals.income)}</span><span>খরচ {moneyText(totals.expense)}</span><span>আদান-প্রদান {moneyText(totals.transfer)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={review ? () => { setReview(false); setError(""); } : onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">{review ? "সম্পাদনায় ফিরুন" : "বাতিল"}</button>
            <button type="button" disabled={busy} aria-busy={busy} onClick={submit} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-60">{busy ? "সংরক্ষণ হচ্ছে…" : review ? `সব ${rows.length.toLocaleString("bn-BD")}টি হিসাব সংরক্ষণ করুন` : "সব হিসাব যাচাই করুন"}</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
