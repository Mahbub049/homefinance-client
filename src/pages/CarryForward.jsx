import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Loader from "../components/ui/Loader";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function money(n) {
  const x = Number(n || 0);
  return x.toFixed(2).replace(/\.00$/, "");
}

function Pill({ tone = "neutral", children }) {
  const base =
    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border whitespace-nowrap";
  const cls =
    tone === "good"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "bad"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-gray-50 text-gray-700 border-gray-200";
  return <span className={`${base} ${cls}`}>{children}</span>;
}

function Kpi({ label, value, sub, emphasis = false }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 min-w-0 ${emphasis ? "ring-2 ring-black/5" : ""
        }`}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`mt-1 font-semibold break-words ${emphasis ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
          } text-gray-900`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

function ChangeBadge({ value }) {
  const v = Number(value || 0);
  const isPos = v > 0;
  const isNeg = v < 0;
  return (
    <span
      className={[
        "inline-flex justify-center min-w-[72px] px-2 py-1 rounded-lg text-xs font-medium border tabular-nums",
        isPos ? "bg-green-50 text-green-700 border-green-200" : "",
        isNeg ? "bg-red-50 text-red-700 border-red-200" : "",
        !isPos && !isNeg ? "bg-gray-50 text-gray-700 border-gray-200" : "",
      ].join(" ")}
    >
      {isPos ? `+${money(v)}` : money(v)}
    </span>
  );
}

export default function CarryForward() {
  const [month, setMonth] = useState(monthNow());
  const [item, setItem] = useState(null);
  const [calc, setCalc] = useState(null);
  const [computed, setComputed] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      const res = await api.get("/api/month-balance", { params: { month } });
      setItem(res.data.item);
      setComputed(res.data.computed || null);
      setCalc(null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load carry forward data.");
    } finally {
      setBusy(false);
    }
  }

  async function closeMonth() {
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      const res = await api.post("/api/month-balance/close", { month });
      setItem(res.data.item);
      setCalc(res.data.calc);

      if (res.data.accounts) {
        setComputed((prev) => ({
          ...(prev || {}),
          month,
          openingTotal: res.data.calc?.openingTotal,
          closingTotal: res.data.calc?.closingTotal,
          accountsOpening: res.data.accounts.opening,
          accountsClosing: res.data.accounts.closing,
          summary: {
            income: res.data.calc?.income,
            expense: res.data.calc?.expense,
            transfer: res.data.calc?.transfer,
            netCashflow: res.data.calc?.netCashflow,
          },
        }));
      }

      setMsg("Month closed successfully.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Close month failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const isClosed = typeof item?.closingBalance === "number";

  const rows = useMemo(() => {
    const opening = computed?.accountsOpening || [];
    const closing = computed?.accountsClosing || [];
    const r = opening.map((o) => {
      const c = closing.find((x) => String(x.accountId) === String(o.accountId));
      const op = Number(o.balance ?? 0);
      const cl = Number(c?.balance ?? 0);
      return {
        accountId: String(o.accountId),
        name: o.name,
        type: o.type,
        opening: op,
        closing: cl,
        change: cl - op,
      };
    });
    r.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return r;
  }, [computed]);

  const totals = useMemo(() => {
    const o = rows.reduce((s, x) => s + x.opening, 0);
    const c = rows.reduce((s, x) => s + x.closing, 0);
    return { opening: o, closing: c, change: c - o };
  }, [rows]);

  return (
    <AppLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        {/* TOP BAR */}
        <div className="bg-white border rounded-2xl p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Carry Forward
                </h2>
                <div className="w-fit">
                  {item ? (
                    isClosed ? (
                      <Pill tone="good">● Closed</Pill>
                    ) : (
                      <Pill tone="bad">● Open</Pill>
                    )
                  ) : (
                    <Pill>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-black" />
                        Loading
                      </span>
                    </Pill>
                  )}
                </div>
              </div>

              <div className="mt-1 text-sm text-gray-600">
                Locks the month and carries the closing balance to next month’s
                opening.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-gray-50 w-full sm:w-auto">
                <span className="text-xs text-gray-500 whitespace-nowrap">Month</span>
                <input
                  type="month"
                  className="bg-transparent outline-none text-sm w-full min-w-0"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>

              <button
                onClick={load}
                disabled={busy}
                className="w-full sm:w-auto border rounded-xl px-4 py-2 text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                Refresh
              </button>

              {!isClosed && (
                <button
                  onClick={closeMonth}
                  disabled={busy}
                  className="w-full sm:w-auto bg-black text-white rounded-xl px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
                >
                  Close Month
                </button>
              )}
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 break-words">
              {msg}
            </div>
          )}
          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 break-words">
              {err}
            </div>
          )}
        </div>

        {!item ? (
          <div className="mt-6 text-sm text-gray-600">
            {busy ? (
              <Loader
                card={false}
                size="sm"
                text="Loading carry forward"
                subtext="Checking previous and current month balances"
              />
            ) : (
              <div className="text-sm text-gray-600">No data</div>
            )}
          </div>
        ) : (
          <>
            {/* BALANCE STRIP */}
            <div className="mt-6 bg-white border rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Balance Flow</div>
                  <div className="mt-1 text-sm text-gray-700">
                    Opening → (Income − Expense) → Closing
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 sm:gap-4">
                  <div className="rounded-xl border bg-gray-50 p-3 text-center sm:text-right">
                    <div className="text-xs text-gray-500">Opening</div>
                    <div className="text-lg font-semibold tabular-nums break-words">
                      ৳ {money(item.openingBalance ?? 0)}
                    </div>
                  </div>

                  <div className="text-center text-gray-300 text-2xl hidden sm:block">
                    →
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-3 text-center sm:text-right sm:col-span-1">
                    <div className="text-xs text-gray-500">Closing</div>
                    <div className="text-lg font-semibold tabular-nums break-words">
                      ৳ {isClosed ? money(item.closingBalance) : "Not closed"}
                    </div>
                  </div>
                </div>
              </div>

              {computed?.summary && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Kpi label="Income" value={money(computed.summary.income ?? 0)} />
                  <Kpi label="Expense" value={money(computed.summary.expense ?? 0)} />
                  <Kpi label="Transfers" value={money(computed.summary.transfer ?? 0)} />
                  <Kpi
                    label="Net Cashflow"
                    value={money(computed.summary.netCashflow ?? 0)}
                    sub="This month’s net movement"
                    emphasis
                  />
                </div>
              )}
            </div>

            {/* CLOSE RESULT */}
            {calc && (
              <div className="mt-6 bg-white border rounded-2xl p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="font-semibold text-gray-900">
                    Saved Close Month Snapshot
                  </div>
                  <div className="w-fit">
                    <Pill tone="good">● Stored</Pill>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Kpi label="Opening Total" value={money(calc.openingTotal)} />
                  <Kpi label="Net Cashflow" value={money(calc.netCashflow)} emphasis />
                  <Kpi label="Closing Total" value={money(calc.closingTotal)} />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Kpi label="Income" value={money(calc.income)} />
                  <Kpi label="Expense" value={money(calc.expense)} />
                  <Kpi label="Transfers" value={money(calc.transfer)} />
                </div>
              </div>
            )}

            {/* PER ACCOUNT */}
            {rows.length ? (
              <div className="mt-6 bg-white border rounded-2xl overflow-hidden">
                <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">
                      Per-Account Breakdown
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Accounts sorted by biggest change.
                    </div>
                  </div>

                  <div className="rounded-xl border bg-gray-50 px-4 py-3 text-center lg:text-right w-full lg:w-auto">
                    <div className="text-xs text-gray-500">Total Change</div>
                    <div className="text-lg font-semibold tabular-nums break-words">
                      {money(totals.change)}
                    </div>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-auto border-t">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="p-3 text-left">Account</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-right">Opening</th>
                        <th className="p-3 text-right">Closing</th>
                        <th className="p-3 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr
                          key={r.accountId}
                          className={`border-t ${idx % 2 ? "bg-gray-50/40" : ""}`}
                        >
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{r.name}</div>
                            <div className="text-xs text-gray-500">
                              ID: {r.accountId.slice(-6)}
                            </div>
                          </td>
                          <td className="p-3 text-gray-700">{r.type}</td>
                          <td className="p-3 text-right tabular-nums">
                            {money(r.opening)}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {money(r.closing)}
                          </td>
                          <td className="p-3 text-right">
                            <ChangeBadge value={r.change} />
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td className="p-3 font-semibold" colSpan={2}>
                          Totals
                        </td>
                        <td className="p-3 text-right font-semibold tabular-nums">
                          {money(totals.opening)}
                        </td>
                        <td className="p-3 text-right font-semibold tabular-nums">
                          {money(totals.closing)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          <ChangeBadge value={totals.change} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden border-t divide-y">
                  {rows.map((r) => (
                    <div key={r.accountId} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 break-words">
                            {r.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.type} • ID: {r.accountId.slice(-6)}
                          </div>
                        </div>
                        <ChangeBadge value={r.change} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="border rounded-xl p-3 bg-gray-50">
                          <div className="text-xs text-gray-500">Opening</div>
                          <div className="font-semibold tabular-nums break-words">
                            {money(r.opening)}
                          </div>
                        </div>
                        <div className="border rounded-xl p-3 bg-gray-50">
                          <div className="text-xs text-gray-500">Closing</div>
                          <div className="font-semibold tabular-nums break-words">
                            {money(r.closing)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-gray-50">
                    <div className="font-semibold text-gray-900 mb-3">Totals</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded-xl p-3 bg-white">
                        <div className="text-xs text-gray-500">Opening</div>
                        <div className="font-semibold tabular-nums">
                          {money(totals.opening)}
                        </div>
                      </div>
                      <div className="border rounded-xl p-3 bg-white">
                        <div className="text-xs text-gray-500">Closing</div>
                        <div className="font-semibold tabular-nums">
                          {money(totals.closing)}
                        </div>
                      </div>
                      <div className="col-span-2 border rounded-xl p-3 bg-white flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Change</div>
                        </div>
                        <ChangeBadge value={totals.change} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 text-xs text-gray-500">
              Recommendation: close the month only after all income, expense, and
              transfer entries are finished.
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}