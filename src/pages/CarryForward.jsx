import HFPageLead from "../components/design/HFPageLead";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function money(n) {
  const x = Number(n || 0);
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function bdt(n) {
  const value = money(n);
  return `৳ ${value.toLocaleString("en-BD", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

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
    wallet: (
      <svg {...common}>
        <path d="M4 7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 1-2-2V7Z" />
        <path d="M16 12h3" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <path d="M3 10h18" />
      </svg>
    ),
    refresh: (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
    lock: (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="10" rx="3" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
    save: (
      <svg {...common}>
        <path d="M5 3h12l2 2v16H5V3Z" />
        <path d="M8 3v6h8V3" />
        <path d="M8 21v-7h8v7" />
      </svg>
    ),
    edit: (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
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
    account: (
      <svg {...common}>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v9h14v-9" />
        <path d="M9 19v-5h6v5" />
      </svg>
    ),
  };

  return icons[name] || icons.wallet;
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

function StatusPill({ closed, loading }) {
  if (loading) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        লোড হচ্ছে
      </span>
    );
  }

  return closed ? (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
      বন্ধ
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
      খোলা
    </span>
  );
}

function ChangeBadge({ value }) {
  const v = money(value);
  const positive = v > 0;
  const negative = v < 0;

  return (
    <span
      className={[
        "inline-flex min-w-[86px] justify-center rounded-full px-3 py-1 text-xs font-black ring-1",
        positive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20"
          : "",
        negative
          ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20"
          : "",
        !positive && !negative
          ? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
          : "",
      ].join(" ")}
    >
      {positive ? `+${bdt(v)}` : bdt(v)}
    </span>
  );
}

function StatCard({ title, value, sub, icon, tone = "emerald" }) {
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
          {sub && (
            <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {sub}
            </p>
          )}
        </div>
        <IconBox name={icon} tone={tone} />
      </div>
    </div>
  );
}

export default function CarryForward() {
  const [hfMore, setHfMore] = useState(false);
  const [month, setMonth] = useState(monthNow());
  const [item, setItem] = useState(null);
  const [calc, setCalc] = useState(null);
  const [computed, setComputed] = useState(null);
  const [draftClosing, setDraftClosing] = useState({});
  const [editRow, setEditRow] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const loadSerial = useRef(0);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionConfirmation, setRevisionConfirmation] = useState("");

  async function load() {
    const serial = ++loadSerial.current;
    setMsg("");
    setErr("");
    setItem(null);
    setComputed(null);
    setBusy(true);

    try {
      const res = await api.get("/api/month-balance", { params: { month } });
      if (serial !== loadSerial.current) return;

      setItem(res.data.item);
      setComputed(res.data.computed || null);
      setRevisionMode(false);
      setRevisionReason("");
      setRevisionConfirmation("");
      setCalc(null);

      const nextDraft = {};
      for (const row of res.data.computed?.accountsClosing || []) {
        nextDraft[String(row.accountId)] = row.balance;
      }
      setDraftClosing(nextDraft);
    } catch (e) {
      if (serial === loadSerial.current) setErr(e?.response?.data?.message || "মাস শেষে হিসাবের তথ্য আনা যায়নি।");
    } finally {
      if (serial === loadSerial.current) setBusy(false);
    }
  }

  // Only changed account values are sent. Sending every displayed system balance
  // would accidentally freeze unchanged accounts when another payment arrives.
  function manualOverrides() {
    return rows.filter((row) => row.manualEdited).map((row) => ({
      accountId: row.accountId, balance: row.editedClosing,
    }));
  }

  async function performSave(action) {
    setMsg("");
    setErr("");
    if (!computed?.fingerprint) {
      setErr("টাকা সংরক্ষণের আগে মাসের তথ্য রিফ্রেশ করুন।");
      return;
    }
    if (action === "close" && !window.confirm(`${month} মাসের হিসাব বন্ধ করবেন? এই মাসের শেষের টাকা পরবর্তী মাসে যোগ হবে।`)) return;
    if (action === "revise" && !window.confirm(`আগে বন্ধ করা ${month} মাসের হিসাব সংশোধন করবেন? পরিবর্তনের ইতিহাস সংরক্ষিত থাকবে।`)) return;
    setBusy(true);
    try {
      const res = await api.post(`/api/month-balance/${action}`, {
        month,
        accountBalances: manualOverrides(),
        expectedFingerprint: computed.fingerprint,
        expectedVersion: computed.snapshotVersion || "",
        ...(action === "revise" ? {
          reason: revisionReason.trim(),
          confirmation: revisionConfirmation.trim(),
        } : {}),
      });
      setItem(res.data.item);
      setComputed(res.data.computed);
      setCalc(res.data.calc);
      const newDraft = {};
      for (const row of res.data.computed?.accountsClosing || []) {
        newDraft[String(row.accountId)] = row.balance;
      }
      setDraftClosing(newDraft);
      setRevisionMode(false);
      setRevisionReason("");
      setRevisionConfirmation("");
      setMsg(action === "save"
        ? "খসড়া সংরক্ষিত হয়েছে। মাস এখনও খোলা আছে; নতুন লেনদেনের হিসাব চলতে থাকবে।"
        : action === "revise"
          ? "মাস শেষে সংশোধন ও পরিবর্তনের ইতিহাস সংরক্ষিত হয়েছে।"
          : "মাসের হিসাব বন্ধ হয়েছে। শেষের টাকা পরবর্তী মাসে যাবে।");
    } catch (e) {
      setErr(e?.response?.data?.message || "মাসের হিসাব সংরক্ষণ করা যায়নি। রিফ্রেশ করে আবার চেষ্টা করুন।");
    } finally { setBusy(false); }
  }
  const saveDraft = () => performSave("save");
  const closeMonth = () => performSave(isClosed ? "revise" : "close");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const isClosed =
    item?.closingBalance !== null && item?.closingBalance !== undefined;

  const rows = useMemo(() => {
    const opening = computed?.accountsOpening || [];
    const closing = computed?.accountsClosing || [];
    const latestSystem = computed?.systemAccountsClosing || [];

    const result = opening.map((o) => {
      const c = closing.find(
        (x) => String(x.accountId) === String(o.accountId)
      );

      const accountId = String(o.accountId);
      const openingAmount = money(o.balance ?? 0);
      const live = latestSystem.find((x) => String(x.accountId) === String(o.accountId));
      const systemClosing = money(live?.balance ?? c?.systemBalance ?? c?.balance ?? 0);
      const editedClosing = money(
        draftClosing[accountId] ?? c?.balance ?? systemClosing
      );

      return {
        accountId,
        name: o.name,
        type: o.type,
        owner: o.owner,
        opening: openingAmount,
        systemClosing,
        editedClosing,
        change: editedClosing - openingAmount,
        variance: editedClosing - systemClosing,
        manualEdited: money(editedClosing) !== money(systemClosing),
      };
    });

    result.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    return result;
  }, [computed, draftClosing]);

  const totals = useMemo(() => {
    const opening = rows.reduce((sum, row) => sum + Number(row.opening || 0), 0);
    const systemClosing = rows.reduce(
      (sum, row) => sum + Number(row.systemClosing || 0),
      0
    );
    const editedClosing = rows.reduce(
      (sum, row) => sum + Number(row.editedClosing || 0),
      0
    );

    return {
      opening: money(opening),
      systemClosing: money(systemClosing),
      editedClosing: money(editedClosing),
      change: money(editedClosing - opening),
      variance: money(editedClosing - systemClosing),
    };
  }, [rows]);

  const editedCount = rows.filter((row) => row.manualEdited).length;

  function openEdit(row) {
    if (isClosed && !revisionMode) return;
    if (computed?.protectedHistorical) return;
    setEditRow(row);
    setEditAmount(String(row.editedClosing ?? 0));
  }

  function closeEdit() {
    setEditRow(null);
    setEditAmount("");
  }

  function saveEdit() {
    if (!editRow) return;

    const n = Number(editAmount || 0);

    if (Number.isNaN(n)) {
      setErr("সঠিক টাকার পরিমাণ লিখুন।");
      return;
    }

    setDraftClosing((prev) => ({
      ...prev,
      [editRow.accountId]: money(n),
    }));

    closeEdit();
  }

  function resetAccount(row) {
    if ((isClosed && !revisionMode) || computed?.protectedHistorical) return;
    setDraftClosing((prev) => ({
      ...prev,
      [row.accountId]: money(row.systemClosing),
    }));
  }

  function resetAllToSystem() {
    if ((isClosed && !revisionMode) || computed?.protectedHistorical) return;
    const next = {};

    for (const row of rows) {
      next[row.accountId] = money(row.systemClosing);
    }

    setDraftClosing(next);
  }

  return (
    <AppLayout>
      <div className={`hf-step3-page hf-step3-carryforward hf-v2-page hf-v2-carryforward ${hfMore ? "hf-step3-expanded" : ""}`}>
        <HFPageLead title="মাস শেষে হিসাব" description="অ্যাকাউন্ট অনুযায়ী হিসাব মিলিয়ে মাস শেষ করুন" month={month} onMonthChange={setMonth}
          metrics={[
 {label:'শুরুর টাকা',value:totals.opening},
 {label:'হিসাব অনুযায়ী শেষ',value:totals.systemClosing},
 {label:'আপনার দেওয়া শেষ টাকা',value:totals.editedClosing,primary:true},
 {label:'অমিল',value:totals.variance}
]}
          onAdd={undefined} addLabel=""
          addDisabled={false}
          onExtra={undefined} extraLabel=""
          onRefresh={load}
          more={undefined} onToggleMore={undefined} />

      <div
        className={`carry-forward-page min-h-screen w-full max-w-full overflow-x-hidden bg-white px-0 pb-8 text-[13px] text-slate-900 dark:bg-[#020617] dark:text-slate-100 sm:text-sm ${hiddenScrollbarClass}`}
      >
        <div className="space-y-5">
          <></>

          <section className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <IconBox name="calendar" tone="emerald" />
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    মাস বন্ধ করার ব্যবস্থা
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    প্রথমে মাস নির্বাচন করুন, প্রয়োজনে প্রকৃত শেষের টাকা সংশোধন করুন, তারপর মাসের হিসাব বন্ধ করুন।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:min-w-[760px] xl:grid-cols-4">
                <input
                  type="month"
                  className={fieldClass}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />

                <button
                  type="button"
                  onClick={load}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Icon name="refresh" className="h-4 w-4" />
                  রিফ্রেশ
                </button>

                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={busy || !rows.length || isClosed || computed?.protectedHistorical}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:hover:bg-emerald-400/15"
                >
                  <Icon name="save" className="h-4 w-4" />
                  সংরক্ষণ করুন
                </button>

                <button
                  type="button"
                  onClick={closeMonth}
                  disabled={busy || !rows.length || computed?.protectedHistorical || (isClosed ? !revisionMode : !computed?.canClose)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(255,255,255,0.08)] dark:hover:bg-slate-100"
                >
                  <Icon name="lock" className="h-4 w-4" />
                  {isClosed ? "সংশোধন নিশ্চিত করুন" : "মাস বন্ধ করুন"}
                </button>
              </div>
            </div>
          </section>

          {computed?.protectedHistorical && (
            <div role="status" className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100">
              অক্টোবর ২০২৬-এর আগের মাসগুলো শুধু দেখা যাবে। আগের হাতে সংশোধন করা হিসাব অপরিবর্তিত থাকবে।
            </div>
          )}
          {!isClosed && computed?.pendingMonth && (
            <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              এই মাস এখনও চলছে। খসড়া সংরক্ষণ করা যাবে, তবে মাস শেষ হওয়ার পরে স্থায়ীভাবে বন্ধ করা যাবে (বাংলাদেশ সময়)।
            </div>
          )}
          {isClosed && !computed?.protectedHistorical && (
            <section className="rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-900 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>মাসটি বন্ধ। সংশোধন হয়েছে: {computed?.revisions || 0}. শুধু ব্যাংক বা অ্যাকাউন্টের নিশ্চিত অমিল সংশোধন করুন।</span>
                <button type="button" disabled={busy} className="rounded-xl border border-violet-400 px-3 py-2 font-black" onClick={() => setRevisionMode((x) => !x)}>
                  {revisionMode ? "সংশোধন বাতিল" : "বন্ধ মাসের হিসাব দেখুন / সংশোধন করুন"}
                </button>
              </div>
              {revisionMode && (
                <div className="mt-4 grid gap-3">
                  <label className="text-xs">কেন সংশোধন করছেন (কমপক্ষে ১২ অক্ষর)
                    <textarea rows={2} className={fieldClass} value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} placeholder="অ্যাকাউন্টের অমিলের কারণ লিখুন" />
                  </label>
                  <label className="text-xs">REVISE লিখুন {month} নিশ্চিত করতে
                    <input className={fieldClass} value={revisionConfirmation} onChange={(e) => setRevisionConfirmation(e.target.value)} />
                  </label>
                  <p className="text-xs">পরবর্তী কোনো মাস ইতিমধ্যে বন্ধ থাকলে আগের মাস এখানে সংশোধন করা যাবে না। পুরোনো লেনদেন মুছে ফেলা হবে না।</p>
                </div>
              )}
            </section>
          )}
          {msg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              {msg}
            </div>
          )}

          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {err}
            </div>
          )}

          {!item ? (
            <Loader
              text="মাসের হিসাব আনা হচ্ছে"
              subtext="অ্যাকাউন্টের টাকা যাচাই করা হচ্ছে"
            />
          ) : (
            <>
              <></>

              {!isClosed && item?.draftSavedAt && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-900 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100">
                  আপনি খসড়ায় টাকার পরিমাণ সংশোধন করেছেন। মাসটি স্থায়ীভাবে বন্ধ না করা পর্যন্ত এই অঙ্ক টাকার হিসাব পেজে দেখানো অঙ্কের থেকে আলাদা হতে পারে।
                </div>
              )}
              {computed?.openingSource === "previous_closed_month" && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100">
                  শুরুর টাকা এসেছে আগের বন্ধ মাস থেকে ({computed.anchorMonth || "আগের মাস"}) এবং মাঝের মাসের লেনদেনসহ।
                </div>
              )}
              {(computed?.reconciliationIssues?.length > 0 || computed?.staleClosedCount > 0) && (
                <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                  হিসাবে অমিল: {computed?.reconciliationIssues?.length || 0} টি সমস্যা।
                  {computed?.staleClosedCount ? ` ${computed.staleClosedCount} টি অ্যাকাউন্টের হিসাব মাস বন্ধের সময় সংরক্ষিত অঙ্কের সঙ্গে মিলছে না।` : ""}
                  মাস বন্ধ করার আগে সব পরিশোধ মিলিয়ে নিন।
                </div>
              )}

              {computed?.summary && (
            <section className="rounded-2xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-400/20 dark:bg-teal-400/10">
              <div className="text-xs font-black uppercase tracking-wide text-teal-800 dark:text-teal-200">এই মাসে অ্যাকাউন্টে আসল টাকা বেড়েছে বা কমেছে</div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-teal-900 dark:text-teal-100">
                <span>শুরুর টাকা {bdt(computed.summary.liquidOpening)} + পরিবর্তন {bdt(computed.summary.liquidMovement)}</span>
                <span className="text-lg font-black">হিসাব অনুযায়ী শেষ {bdt(computed.summary.liquidSystemClosing)}</span>
              </div>
              <p className="mt-1 text-xs text-teal-700 dark:text-teal-200">নগদ বা ব্যাংক অ্যাকাউন্টের মধ্যে টাকা পাঠালে দুজনের সম্মিলিত টাকা বদলায় না। সঞ্চয়ে জমা দিলে ব্যবহারযোগ্য টাকা কমে, কিন্তু সম্পদ কমে না।</p>
            </section>
          )}

          {computed?.summary && (
                <></>
              )}

              <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/70">
                <div className="border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <IconBox name="account" tone="sky" />
                      <div>
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">
                          অ্যাকাউন্ট অনুযায়ী শেষের হিসাব
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          প্রতিটি অ্যাকাউন্টে বাস্তবে যত টাকা আছে, তার সঙ্গে মিলিয়ে নিন।
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetAllToSystem}
                      disabled={(isClosed && !revisionMode) || computed?.protectedHistorical}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                    >
                      <Icon name="refresh" className="h-4 w-4" />
                      হিসাব অনুযায়ী ফিরিয়ে নিন
                    </button>
                  </div>
                </div>

                {busy ? (
                  <Loader
                    text="Loading balances"
                    subtext="Preparing account-wise breakdown"
                  />
                ) : rows.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    কোনো অ্যাকাউন্টের হিসাব পাওয়া যায়নি।
                  </div>
                ) : (
                  <>
                    <div
                      className={`hidden overflow-x-auto md:block ${hiddenScrollbarClass}`}
                    >
                      <table className="w-full min-w-[960px] text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                          <tr className="text-left">
                            <th className="p-4 font-black">অ্যাকাউন্ট</th>
                            <th className="p-4 font-black">শুরুর টাকা</th>
                            <th className="p-4 font-black">হিসাব অনুযায়ী শেষ</th>
                            <th className="p-4 font-black">আসল শেষ টাকা</th>
                            <th className="p-4 font-black">অমিল</th>
                            <th className="p-4 text-right font-black">
                              কাজ
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                          {rows.map((row) => (
                            <tr
                              key={row.accountId}
                              className="transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                            >
                              <td className="p-4">
                                <div className="font-black text-slate-950 dark:text-white">
                                  {row.name}
                                </div>
                                <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {row.owner || "-"} • {row.type || "-"}
                                </div>
                              </td>

                              <td className="p-4 font-black text-slate-800 dark:text-slate-100">
                                {bdt(row.opening)}
                              </td>

                              <td className="p-4 font-black text-slate-800 dark:text-slate-100">
                                {bdt(row.systemClosing)}
                              </td>

                              <td className="p-4">
                                <div className="font-black text-slate-950 dark:text-white">
                                  {bdt(row.editedClosing)}
                                </div>
                                {row.manualEdited && (
                                  <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                                    নিজে সংশোধিত
                                  </div>
                                )}
                              </td>

                              <td className="p-4">
                                <ChangeBadge value={row.variance} />
                              </td>

                              <td className="p-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(row)}
                                    disabled={(isClosed && !revisionMode) || computed?.protectedHistorical}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                  >
                                    <Icon name="edit" className="h-3.5 w-3.5" />
                                    সম্পাদনা
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => resetAccount(row)}
                                    disabled={(isClosed && !revisionMode) || computed?.protectedHistorical}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
                                  >
                                    ফিরিয়ে নিন
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        <tfoot className="border-t border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-slate-950/50">
                          <tr>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              মোট
                            </td>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              {bdt(totals.opening)}
                            </td>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              {bdt(totals.systemClosing)}
                            </td>
                            <td className="p-4 font-black text-slate-950 dark:text-white">
                              {bdt(totals.editedClosing)}
                            </td>
                            <td className="p-4">
                              <ChangeBadge value={totals.variance} />
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="space-y-3 p-3 md:hidden">
                      {rows.map((row) => (
                        <article
                          key={row.accountId}
                          className="rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[15px] font-black leading-5 text-slate-950 dark:text-white">
                                {row.name}
                              </h4>

                              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {row.owner || "-"} • {row.type || "-"}
                              </p>
                            </div>

                            <ChangeBadge value={row.variance} />
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                শুরুর টাকা
                              </p>
                              <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                                {bdt(row.opening)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                বাস্তব
                              </p>
                              <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                                {bdt(row.editedClosing)}
                              </p>
                            </div>
                          </div>

                          {row.manualEdited && (
                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                              হিসাব অনুযায়ী: {bdt(row.systemClosing)} • সংশোধন করেছেন{" "}
                              {bdt(row.variance)}
                            </div>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              disabled={(isClosed && !revisionMode) || computed?.protectedHistorical}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <Icon name="edit" className="h-3.5 w-3.5" />
                              সম্পাদনা
                            </button>

                            <button
                              type="button"
                              onClick={() => resetAccount(row)}
                              disabled={(isClosed && !revisionMode) || computed?.protectedHistorical}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-black text-amber-700 transition hover:bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
                            >
                              ফিরিয়ে নিন
                            </button>
                          </div>
                        </article>
                      ))}

                      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
                          সব অ্যাকাউন্টে শেষে আছে
                        </p>
                        <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-100">
                          {bdt(totals.editedClosing)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700/80 dark:text-emerald-200/80">
                          সব অ্যাকাউন্টের হিসাব যোগ করে মোট টাকা দেখানো হয়েছে।
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {calc && (
                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-5">
                  <div className="flex items-start gap-3">
                    <IconBox name="check" tone="emerald" />
                    <div>
                      <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-100">
                        মাসের হিসাব সংরক্ষিত
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-emerald-700/80 dark:text-emerald-200/80">
                        শুরুতে: {bdt(calc.openingTotal)} • শেষে:{" "}
                        {bdt(calc.closingTotal)} • নিজে সংশোধন করেছেন:{" "}
                        {calc.manualAdjusted ? "হ্যাঁ" : "না"}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                পরামর্শ: আয়, খরচ, টাকা আদান-প্রদান, বাজার ও কিস্তির সব এন্ট্রি সম্পন্ন করে মাস বন্ধ করুন। প্রকৃত অ্যাকাউন্টের টাকার সঙ্গে পার্থক্য থাকলেই সংশোধন করুন।
              </div>
            </>
          )}
        </div>

        {editRow && (
          <div className="app-modal-overlay--center">
            <div
              className={`app-modal-panel max-h-[92vh] max-w-md overflow-y-auto rounded-[30px] border border-white/70 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950 ${hiddenScrollbarClass}`}
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

                <div className="flex items-start justify-between gap-4 pt-1">
                  <div className="flex items-start gap-3">
                    <IconBox name="edit" tone="amber" />
                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                        শেষ হিসাব সংশোধন
                      </div>

                      <h3 className="text-xl font-black text-slate-950 dark:text-white">
                        শেষের টাকা সংশোধন
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {editRow.name} • {editRow.owner || "-"} •{" "}
                        {editRow.type || "-"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeEdit}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      হিসাব অনুযায়ী শেষ
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                      {bdt(editRow.systemClosing)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      শুরুর টাকা
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950 dark:text-white">
                      {bdt(editRow.opening)}
                    </p>
                  </div>
                </div>

                <Field label="বাস্তবে মাস শেষে আছে">
                  <input
                    type="number"
                    step="0.01"
                    className={fieldClass}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="বাস্তবে যত টাকা আছে লিখুন"
                  />
                </Field>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  এই পরিমাণ অনুযায়ী মাসের মোট শেষের টাকা স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:w-auto"
                  >
                    বাতিল
                  </button>

                  <button
                    type="button"
                    onClick={saveEdit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    টাকা সংরক্ষণ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
          </div>
    </AppLayout>
  );
}