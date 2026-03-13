import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function SkeletonCard() {
  return (
    <div className="bg-white border rounded-xl p-4 sm:p-5 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-44 bg-gray-200 rounded" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
      </div>
      <div className="h-10 w-full bg-gray-200 rounded mt-4" />
    </div>
  );
}

export default function Wallet() {
  const [month, setMonth] = useState(monthNow());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get("/api/wallet/summary", { params: { month } });
      setData(res.data);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load wallet summary"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const nameById = useMemo(() => {
    const m = new Map();
    (data?.users || []).forEach((u) => m.set(String(u.userId), u.name));
    return m;
  }, [data]);

  const users = data?.users || [];

  const maxAbsNet = useMemo(() => {
    if (!users.length) return 1;
    return Math.max(...users.map((u) => Math.abs(Number(u.net || 0))), 1);
  }, [users]);

  return (
    <AppLayout>
      <div className="mx-auto w-full px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-5 sm:mb-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Wallet Summary
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track income, expenses, and who owes who — month by month.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="bg-white border rounded-lg px-3 py-2 flex items-center justify-between gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Month
              </span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="outline-none text-sm w-full sm:w-auto min-w-0"
              />
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <div className="font-semibold mb-1">Couldn’t load data</div>
            <div className="text-sm break-words">{err}</div>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          {loading && !data ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : !data ? (
            <div className="text-gray-600">No data yet.</div>
          ) : (
            users.map((u) => {
              const income = Number(u.income || 0);
              const paid = Number(u.paidExpense || 0);
              const share = Number(u.shareExpense || 0);
              const net = Number(u.net || 0);
              const remaining = income - paid;

              const netPositive = net >= 0;
              const pct = Math.round((Math.abs(net) / maxAbsNet) * 100);

              return (
                <div
                  key={u.userId}
                  className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        {u.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {netPositive ? "In surplus" : "In deficit"}
                      </p>
                    </div>

                    <span
                      className={[
                        "text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border w-fit",
                        netPositive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-rose-50 border-rose-200 text-rose-700",
                      ].join(" ")}
                    >
                      Net: {netPositive ? "+" : ""}
                      {formatMoney(net)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border rounded-xl p-3">
                      <p className="text-xs text-gray-500">Income</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                        {formatMoney(income)}
                      </p>
                    </div>
                    <div className="bg-gray-50 border rounded-xl p-3">
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                        {formatMoney(paid)}
                      </p>
                    </div>
                    <div className="bg-gray-50 border rounded-xl p-3">
                      <p className="text-xs text-gray-500">Share</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                        {formatMoney(share)}
                      </p>
                    </div>
                    <div className="bg-gray-50 border rounded-xl p-3">
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                        {formatMoney(remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Visual Net Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1 gap-2">
                      <span>Net impact</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={[
                          "h-full rounded-full transition-all duration-300",
                          netPositive ? "bg-emerald-500" : "bg-rose-500",
                        ].join(" ")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Hint */}
                  <div className="mt-4 text-xs sm:text-sm text-gray-500">
                    {netPositive
                      ? "They paid more than their share."
                      : "They paid less than their share."}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Settlement */}
        {data?.settlement && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h4 className="font-semibold text-amber-900">
                  Settlement Suggestion
                </h4>
                <p className="text-sm text-amber-900/80 mt-1">
                  Quick way to balance the month.
                </p>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 w-full md:w-auto">
                <p className="text-sm text-gray-800 leading-6 break-words">
                  <span className="font-semibold">
                    {nameById.get(String(data.settlement.fromUserId)) ||
                      `User ${data.settlement.fromUserId}`}
                  </span>{" "}
                  should pay{" "}
                  <span className="font-semibold">
                    {nameById.get(String(data.settlement.toUserId)) ||
                      `User ${data.settlement.toUserId}`}
                  </span>{" "}
                  <span className="font-bold text-gray-900">
                    {formatMoney(data.settlement.amount)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}