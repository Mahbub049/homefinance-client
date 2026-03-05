import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";

function yearNow() {
  return new Date().getFullYear();
}

function fmt(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x.toFixed(2).replace(/\.00$/, "") : "0";
}

export default function YearOverview() {
  const [year, setYear] = useState(yearNow());
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      setMsg("");
      const res = await api.get("/api/year-overview", { params: { year } });
      setData(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load year overview");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const maxIncome = useMemo(() => {
    if (!data?.months?.length) return 1;
    return Math.max(1, ...data.months.map((m) => Number(m.income || 0)));
  }, [data]);

  const maxExpense = useMemo(() => {
    if (!data?.months?.length) return 1;
    return Math.max(1, ...data.months.map((m) => Number(m.expense || 0)));
  }, [data]);

  return (
    <AppLayout>
      <div className="">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Year Overview</h2>
            <p className="text-sm text-gray-600">12-month performance summary (no Excel clone).</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-28"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2000"
              max="2100"
            />
            <button
              onClick={load}
              className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

        {!data ? (
          <div className="text-sm">Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">Total Income</div>
                <div className="text-xl font-semibold">{fmt(data.totals.income)}</div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">Total Expense</div>
                <div className="text-xl font-semibold">{fmt(data.totals.expense)}</div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">Net Cashflow</div>
                <div className="text-xl font-semibold">{fmt(data.totals.netCashflow)}</div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-xs text-gray-500">Savings Growth</div>
                <div className="text-xl font-semibold">{fmt(data.totals.savingsGrowth)}</div>
                <div className="text-xs text-gray-600 mt-1">Savings rate: {fmt(data.totals.savingsRate)}%</div>
              </div>
            </div>

            {/* Simple trend rows (no new libraries) */}
            <div className="bg-white border rounded-lg p-4 mb-4">
              <div className="font-medium mb-3">Trends (relative bars)</div>
              <div className="space-y-2">
                {data.months.map((m) => {
                  const exp = Number(m.expense || 0);
                  const incomePct = Math.round((Number(m.income || 0) / maxIncome) * 100);
                  const expPct = Math.round((exp / maxExpense) * 100);
                  return (
                    <div key={m.month} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-2 text-gray-600">{m.month}</div>

                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="h-2 bg-black" style={{ width: `${incomePct}%` }} />
                          </div>
                          <div className="w-20 text-right">Inc {fmt(m.income)}</div>
                        </div>
                      </div>

                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="h-2 bg-black" style={{ width: `${expPct}%` }} />
                          </div>
                          <div className="w-24 text-right">Exp {fmt(exp)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Exp = total expense transactions. Bars are relative (no chart library added).
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-3 border-b font-medium text-sm">Monthly Breakdown</div>
              <div className="overflow-auto">
                <table className="min-w-[950px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-3">Month</th>
                      <th className="p-3">Income</th>
                      <th className="p-3">Expense</th>
                      <th className="p-3">Transfers</th>
                      <th className="p-3">Net Cashflow</th>
                      <th className="p-3">Savings In</th>
                      <th className="p-3">Savings Out</th>
                      <th className="p-3">Savings Growth</th>
                      <th className="p-3">Savings %</th>
                      <th className="p-3">Opening</th>
                      <th className="p-3">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.months.map((m) => (
                      <tr key={m.month} className="border-t">
                        <td className="p-3 font-medium">{m.month}</td>
                        <td className="p-3">{fmt(m.income)}</td>
                        <td className="p-3">{fmt(m.expense)}</td>
                        <td className="p-3">{fmt(m.transfer)}</td>
                        <td className="p-3 font-semibold">{fmt(m.netCashflow)}</td>
                        <td className="p-3">{fmt(m.savingsIn)}</td>
                        <td className="p-3">{fmt(m.savingsOut)}</td>
                        <td className="p-3 font-semibold">{fmt(m.savingsGrowth)}</td>
                        <td className="p-3">{fmt(m.savingsRate)}%</td>
                        <td className="p-3">{fmt(m.openingBalance)}</td>
                        <td className="p-3">
                          {typeof m.closingBalance === "number" ? fmt(m.closingBalance) : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-gray-50">
                      <td className="p-3 font-semibold">TOTAL</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.income)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.expense)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.transfer)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.netCashflow)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.savingsIn)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.savingsOut)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.savingsGrowth)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.savingsRate)}%</td>
                      <td className="p-3">—</td>
                      <td className="p-3">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
