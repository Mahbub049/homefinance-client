import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";
import Loader from "../components/ui/Loader";

function yearNow() {
  return new Date().getFullYear();
}

function fmt(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x.toFixed(2).replace(/\.00$/, "") : "0";
}

function tk(n) {
  return `৳ ${fmt(n)}`;
}

function AmountText({ value, bold = false }) {
  return (
    <span className={bold ? "font-semibold tabular-nums" : "tabular-nums"}>
      {tk(value)}
    </span>
  );
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
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">Year Overview</h2>
            <p className="text-sm text-gray-600">
              12-month performance summary.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-full sm:w-28 bg-white"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2000"
              max="2100"
            />
            <button
              onClick={load}
              className="border rounded-md px-4 py-2 text-sm hover:bg-gray-50 w-full sm:w-auto"
            >
              Refresh
            </button>
          </div>
        </div>

        {msg && <div className="mb-3 text-sm text-red-600 break-words">{msg}</div>}

        {!data ? (
          <Loader
            text="Loading year overview"
            subtext="Preparing your 12-month summary"
          />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              <div className="bg-white border rounded-lg p-4 min-w-0">
                <div className="text-xs text-gray-500">Total Income</div>
                <div className="text-lg sm:text-xl font-semibold break-words">
                  {tk(data.totals.income)}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 min-w-0">
                <div className="text-xs text-gray-500">Total Expense</div>
                <div className="text-lg sm:text-xl font-semibold break-words">
                  {tk(data.totals.expense)}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 min-w-0">
                <div className="text-xs text-gray-500">Net Cashflow</div>
                <div className="text-lg sm:text-xl font-semibold break-words">
                  {tk(data.totals.netCashflow)}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 min-w-0">
                <div className="text-xs text-gray-500">Savings Growth</div>
                <div className="text-lg sm:text-xl font-semibold break-words">
                  {tk(data.totals.savingsGrowth)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Savings rate: {fmt(data.totals.savingsRate)}%
                </div>
              </div>
            </div>

            {/* Trend section */}
            <div className="bg-white border rounded-lg p-4 mb-4">
              <div className="font-medium mb-3">Trends</div>

              <div className="space-y-3">
                {data.months.map((m) => {
                  const exp = Number(m.expense || 0);
                  const incomePct = Math.round((Number(m.income || 0) / maxIncome) * 100);
                  const expPct = Math.round((exp / maxExpense) * 100);

                  return (
                    <div
                      key={m.month}
                      className="border rounded-lg p-3 sm:p-0 sm:border-0 sm:rounded-none"
                    >
                      {/* Mobile */}
                      <div className="sm:hidden space-y-3">
                        <div className="font-medium text-sm">{m.month}</div>

                        <div>
                          <div className="flex items-center justify-between gap-3 mb-1 text-xs">
                            <span className="text-gray-600">Income</span>
                            <span className="font-medium">{tk(m.income)}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-black"
                              style={{ width: `${incomePct}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-3 mb-1 text-xs">
                            <span className="text-gray-600">Expense</span>
                            <span className="font-medium">{tk(exp)}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-black"
                              style={{ width: `${expPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-2 text-gray-600">{m.month}</div>

                        <div className="col-span-5">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-black"
                                style={{ width: `${incomePct}%` }}
                              />
                            </div>
                            <div className="w-28 text-right whitespace-nowrap">
                              Inc {tk(m.income)}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-5">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-black"
                                style={{ width: `${expPct}%` }}
                              />
                            </div>
                            <div className="w-28 text-right whitespace-nowrap">
                              Exp {tk(exp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-gray-500 mt-3">
                Exp = total expense transactions. Bars are relative.
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-3 border-b font-medium text-sm">Monthly Breakdown</div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-auto">
                <table className="min-w-[1100px] w-full text-sm">
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
                        <td className="p-3"><AmountText value={m.income} /></td>
                        <td className="p-3"><AmountText value={m.expense} /></td>
                        <td className="p-3"><AmountText value={m.transfer} /></td>
                        <td className="p-3"><AmountText value={m.netCashflow} bold /></td>
                        <td className="p-3"><AmountText value={m.savingsIn} /></td>
                        <td className="p-3"><AmountText value={m.savingsOut} /></td>
                        <td className="p-3"><AmountText value={m.savingsGrowth} bold /></td>
                        <td className="p-3">{fmt(m.savingsRate)}%</td>
                        <td className="p-3"><AmountText value={m.openingBalance} /></td>
                        <td className="p-3">
                          {typeof m.closingBalance === "number" ? tk(m.closingBalance) : "-"}
                        </td>
                      </tr>
                    ))}

                    <tr className="border-t bg-gray-50">
                      <td className="p-3 font-semibold">TOTAL</td>
                      <td className="p-3 font-semibold">{tk(data.totals.income)}</td>
                      <td className="p-3 font-semibold">{tk(data.totals.expense)}</td>
                      <td className="p-3 font-semibold">{tk(data.totals.transfer)}</td>
                      <td className="p-3 font-semibold">{tk(data.totals.netCashflow)}</td>
                      <td className="p-3 font-semibold">{tk(data.totals.savingsIn)}</td>
                      <td className="p-3 font-semibold">{tk(data.totals.savingsOut)}</td>
                      <td className="p-3 font-semibold">{tk(data.totals.savingsGrowth)}</td>
                      <td className="p-3 font-semibold">{fmt(data.totals.savingsRate)}%</td>
                      <td className="p-3">—</td>
                      <td className="p-3">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y">
                {data.months.map((m) => (
                  <div key={m.month} className="p-4">
                    <div className="font-semibold text-sm mb-3">{m.month}</div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Income</div>
                        <div className="font-medium break-words">{tk(m.income)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Expense</div>
                        <div className="font-medium break-words">{tk(m.expense)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Transfers</div>
                        <div className="font-medium break-words">{tk(m.transfer)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Net Cashflow</div>
                        <div className="font-semibold break-words">{tk(m.netCashflow)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Savings In</div>
                        <div className="font-medium break-words">{tk(m.savingsIn)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Savings Out</div>
                        <div className="font-medium break-words">{tk(m.savingsOut)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Savings Growth</div>
                        <div className="font-semibold break-words">{tk(m.savingsGrowth)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Savings %</div>
                        <div className="font-medium">{fmt(m.savingsRate)}%</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Opening</div>
                        <div className="font-medium break-words">{tk(m.openingBalance)}</div>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500">Closing</div>
                        <div className="font-medium break-words">
                          {typeof m.closingBalance === "number" ? tk(m.closingBalance) : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-gray-50">
                  <div className="font-semibold text-sm mb-3">TOTAL</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Income</div>
                      <div className="font-semibold break-words">{tk(data.totals.income)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Expense</div>
                      <div className="font-semibold break-words">{tk(data.totals.expense)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Transfers</div>
                      <div className="font-semibold break-words">{tk(data.totals.transfer)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Net Cashflow</div>
                      <div className="font-semibold break-words">{tk(data.totals.netCashflow)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Savings In</div>
                      <div className="font-semibold break-words">{tk(data.totals.savingsIn)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Savings Out</div>
                      <div className="font-semibold break-words">{tk(data.totals.savingsOut)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Savings Growth</div>
                      <div className="font-semibold break-words">{tk(data.totals.savingsGrowth)}</div>
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="text-xs text-gray-500">Savings %</div>
                      <div className="font-semibold">{fmt(data.totals.savingsRate)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}