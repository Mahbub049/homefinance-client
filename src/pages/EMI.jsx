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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthInRange(targetMonth, startMonth, endMonth) {
  if (!targetMonth || !startMonth || !endMonth) return false;
  return targetMonth >= startMonth && targetMonth <= endMonth;
}

function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function monthLabel(value) {
  if (!value) return "Selected Month";
  const [year, month] = String(value).split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function normalizeId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v._id || v.id || "");
  return String(v);
}

function ownerFromMemberName(name) {
  const n = String(name || "").trim().toLowerCase();

  if (n.includes("mahbub")) return "Mahbub";
  if (n.includes("mirza")) return "Mirza";

  return "";
}

function safeDate(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function percentage(value, total) {
  const v = Number(value || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.min(100, Math.max(0, Math.round((v / t) * 100)));
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function openNativePicker(e) {
  const input = e.currentTarget.querySelector("input");
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers only allow showPicker on a direct input click.
    }
  }
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200";
  }

  if (s === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200";
  }

  if (s === "active") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200";
  }

  if (s === "closed") {
    return "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
}

function splitLabel(value) {
  const v = String(value || "equal").toLowerCase();
  if (v === "personal") return "Personal";
  if (v === "ratio") return "Ratio";
  if (v === "fixed") return "Fixed";
  return "Equal";
}

function splitMonthlyAmount(plan, members) {
  const total = Number(plan?.monthlyAmount || 0);
  const splitType = String(plan?.splitType || "equal").toLowerCase();

  if (!total || !Array.isArray(members) || members.length === 0) return [];

  if (splitType === "personal") {
    const userId = normalizeId(plan?.personalUserId);
    const person = members.find((m) => normalizeId(m.id || m._id) === userId);

    return [
      {
        key: userId || "personal",
        userId,
        name: person?.name || "Personal",
        amount: total,
      },
    ];
  }

  if (splitType === "ratio") {
    const ratios = Array.isArray(plan?.ratios) ? plan.ratios : [];
    const validRatios = ratios
      .map((r) => ({
        userId: normalizeId(r?.userId),
        ratio: Number(r?.ratio || 0),
      }))
      .filter((r) => r.userId && r.ratio > 0);

    const ratioSum = validRatios.reduce((s, r) => s + r.ratio, 0);
    if (!validRatios.length || ratioSum <= 0) return [];

    return validRatios.map((r, index) => {
      const person = members.find((m) => normalizeId(m.id || m._id) === r.userId);
      const raw = (total * r.ratio) / ratioSum;

      return {
        key: `${r.userId}-${index}`,
        userId: r.userId,
        name: person?.name || "Unknown",
        amount: Math.round(raw * 100) / 100,
      };
    });
  }

  if (splitType === "fixed") {
    const fixed = Array.isArray(plan?.fixed) ? plan.fixed : [];
    const validFixed = fixed
      .map((f) => ({
        userId: normalizeId(f?.userId),
        amount: Number(f?.amount || 0),
      }))
      .filter((f) => f.userId && f.amount > 0);

    if (!validFixed.length) return [];

    return validFixed.map((f, index) => {
      const person = members.find((m) => normalizeId(m.id || m._id) === f.userId);

      return {
        key: `${f.userId}-${index}`,
        userId: f.userId,
        name: person?.name || "Unknown",
        amount: Math.round(f.amount * 100) / 100,
      };
    });
  }

  const activeMembers = members.filter(Boolean);
  const base = Math.floor((total / activeMembers.length) * 100) / 100;
  let used = 0;

  return activeMembers.map((m, index) => {
    const userId = normalizeId(m.id || m._id);
    const isLast = index === activeMembers.length - 1;
    const amount = isLast ? Math.round((total - used) * 100) / 100 : base;

    used += base;

    return {
      key: userId || index,
      userId,
      name: m.name || "Member",
      amount,
    };
  });
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "plus") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
        <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v6h-6" />
      </svg>
    );
  }

  if (name === "card") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-2" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7 12 12l8.7-5" />
        <path d="M12 22V12" />
      </svg>
    );
  }

  return (
    <svg {...common} viewBox="0 0 24 24">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent = "from-sky-500 to-indigo-600",
  icon = "chart",
  hideOnMobile = false,
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition dark:border-white/10 dark:bg-white/[0.06] sm:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-md",
        hideOnMobile && "hidden sm:block"
      )}
    >
      <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-15`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-xs">
            {label}
          </div>
          <div className="mt-2 break-words text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </div>
          {helper ? (
            <div className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
              {helper}
            </div>
          ) : null}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-sm sm:h-11 sm:w-11`}>
          <Icon name={icon} className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "", hint }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="block text-[11px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 sm:text-xs">
          {label}
        </label>
        {hint ? <span className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/10 ${extra}`;
}

function ActionButton({ children, onClick, variant = "primary", className = "", disabled = false }) {
  const styles = {
    primary:
      "bg-slate-950 text-white hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
    soft:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/20",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

function LiabilitySection({ items, total }) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:to-emerald-400/10 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">EMI Liability by Person</div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400 sm:text-sm">
              Split-aware monthly payable amount for the selected month.
            </p>
          </div>
          <div className="hidden rounded-2xl bg-emerald-50 px-3 py-2 text-right text-xs font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20 sm:block">
            Total ৳ {money(total)}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
            No active EMI liability for this month.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const share = percentage(item.amount, total);

              return (
                <div key={item.userId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-black text-slate-950 dark:text-white sm:text-base">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{share}% of this month</div>
                    </div>
                    <div className="shrink-0 text-base font-black text-emerald-700 dark:text-emerald-300 sm:text-xl">
                      ৳ {money(item.amount)}
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100 dark:bg-white/10 dark:ring-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function PlanCard({ plan, month, members, onGenerate, onStatus }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const progress = Math.min(100, Math.max(0, Number(plan?.stats?.progress || 0)));
  const canCreateBill = plan.status === "active" && month >= plan.startMonth && month <= plan.endMonth;
  const splitItems = splitMonthlyAmount(plan, members);

  return (
    <article className="emi-plan-card overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl lg:hover:-translate-y-0.5 lg:hover:shadow-md">
      <div className="bg-gradient-to-br from-slate-950 via-indigo-900 to-sky-800 p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-words text-base font-black sm:text-lg">{plan.productName}</div>
            <div className="mt-1 break-words text-xs text-slate-200">
              {plan.brand || "No brand"} {plan.category ? `• ${plan.category}` : ""}
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black sm:text-xs ${statusClass(plan.status)}`}>
            {plan.status || "-"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <div className="text-[11px] text-slate-300 sm:text-xs">Monthly</div>
            <div className="mt-1 text-lg font-black sm:text-xl">৳ {money(plan.monthlyAmount)}</div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <div className="text-[11px] text-slate-300 sm:text-xs">Progress</div>
            <div className="mt-1 text-lg font-black sm:text-xl">{progress}%</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment Progress</span>
            <span className="font-black text-slate-800 dark:text-slate-200">{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          {Number(plan?.stats?.behindBy || 0) > 0 && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              Behind: ৳ {money(plan.stats.behindBy)}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          {detailsOpen ? "Hide complete info" : "View complete info"}
          <Icon name="chevron" className={cx("h-4 w-4 transition", detailsOpen && "rotate-180")} />
        </button>

        {detailsOpen && (
          <div className="space-y-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</div>
                <div className="mt-1 font-black text-slate-950 dark:text-white">৳ {money(plan.totalPayable)}</div>
              </div>
              <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Remaining</div>
                <div className="mt-1 font-black text-slate-950 dark:text-white">৳ {money(plan?.stats?.remaining ?? 0)}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{plan?.stats?.remainingMonths ?? "-"} mo left</div>
              </div>
              <div className="col-span-2 rounded-2xl bg-white p-3 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</div>
                <div className="mt-1 font-black text-slate-950 dark:text-white">{plan.startMonth} → {plan.endMonth}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.months} months • {splitLabel(plan?.splitType)} split</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Who Pays Monthly
              </div>
              {!splitItems.length ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">Split info missing</div>
              ) : (
                <div className="space-y-2">
                  {splitItems.map((item) => {
                    const bar = percentage(item.amount, Number(plan?.monthlyAmount || 0));

                    return (
                      <div key={item.key} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100 dark:bg-slate-950/50 dark:ring-white/10">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className="font-black text-slate-950 dark:text-white">৳ {money(item.amount)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
                            style={{ width: `${bar}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {canCreateBill && (
            <ActionButton onClick={() => onGenerate(plan._id, plan.productName)} variant="primary" className="w-full">
              Create Bill
            </ActionButton>
          )}

          {plan.status === "active" ? (
            <ActionButton onClick={() => onStatus(plan._id, "closed")} variant="soft" className="w-full">
              Close Plan
            </ActionButton>
          ) : (
            <ActionButton onClick={() => onStatus(plan._id, "active")} variant="soft" className="w-full">
              Reopen Plan
            </ActionButton>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EMI() {
  const me = getUser();
  const myId = normalizeId(me?.id);
  const [month, setMonth] = useState(monthNow());
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const [members, setMembers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [expenseCats, setExpenseCats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [installments, setInstallments] = useState([]);

  const monthOptions = [1, 3, 6, 9, 12, 18, 24, 36];

  const productCategoryOptions = [
    "Electronics",
    "Mobile / Smartphone",
    "Laptop / Computer",
    "PC Accessories",
    "Furniture",
    "Home Appliance",
    "Kitchen Appliance",
    "Vehicle / Bike",
    "Education Device",
    "Medical Device",
    "Fashion / Personal",
    "Others",
  ];

  const [form, setForm] = useState({
    productName: "",
    brand: "",
    category: "",
    purchaseDate: today(),
    originalPrice: "",
    emiCharge: 0,
    totalPayable: "",
    months: 6,
    startMonth: monthNow(),
    splitType: "equal",
    personalUserId: "",
    ratioMe: 50,
    ratioOther: 50,
    fixedMe: "",
    fixedOther: "",
    note: "",
  });

  const [emiExpenseCategoryId, setEmiExpenseCategoryId] = useState("");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [payForm, setPayForm] = useState({
    paidByUserId: myId || "",
    fromAccountId: "",
    paidDate: today(),
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteInstallmentId, setDeleteInstallmentId] = useState("");

  const otherMember = useMemo(
    () => members.find((m) => normalizeId(m.id || m._id) !== myId) || null,
    [members, myId]
  );

  const selectedPayerOwner = useMemo(() => {
    const payer = members.find(
      (m) => normalizeId(m.id || m._id) === normalizeId(payForm.paidByUserId)
    );

    return ownerFromMemberName(payer?.name);
  }, [members, payForm.paidByUserId]);

  const payableAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const type = String(account.type || "").trim().toLowerCase();
      const owner = String(account.owner || "").trim();
      const name = String(account.name || "").trim().toLowerCase();

      const isNormalPaymentAccount = ["cash", "bank", "wallet"].includes(type);

      const isSavingAccount =
        type === "savings" ||
        type === "saving" ||
        name.includes("saving");

      const belongsToSelectedPayer =
        !selectedPayerOwner ||
        owner === selectedPayerOwner ||
        owner === "Joint";

      return (
        account.isActive !== false &&
        isNormalPaymentAccount &&
        !isSavingAccount &&
        belongsToSelectedPayer
      );
    });
  }, [accounts, selectedPayerOwner]);

  useEffect(() => {
  if (!payModalOpen) return;

  if (payableAccounts.length === 0) {
    if (payForm.fromAccountId) {
      setPayForm((prev) => ({
        ...prev,
        fromAccountId: "",
      }));
    }
    return;
  }

  const selectedAccountStillValid = payableAccounts.some(
    (account) => normalizeId(account._id) === normalizeId(payForm.fromAccountId)
  );

  if (!selectedAccountStillValid) {
    setPayForm((prev) => ({
      ...prev,
      fromAccountId: payableAccounts[0]._id,
    }));
  }
}, [payModalOpen, payableAccounts, payForm.fromAccountId]);

  function calcTotalPayable(originalPrice, emiChargePercent) {
    const op = toNum(originalPrice);
    const pct = toNum(emiChargePercent);
    const t = op + (op * pct) / 100;
    return Math.round(t * 100) / 100;
  }

  async function loadBasics() {
    const [mRes, accRes, exp] = await Promise.all([
      api.get("/api/family/members"),
      api.get("/api/accounts"),
      api.get("/api/categories", { params: { kind: "expense" } }),
    ]);

    const memberItems = mRes.data.members || [];
    setMembers(memberItems);

    if (memberItems.length > 0) {
      const defaultPersonalId = myId || memberItems[0]?.id || "";
      setForm((prev) => ({
        ...prev,
        personalUserId: prev.personalUserId || defaultPersonalId,
      }));
    }

    setAccounts((accRes.data.items || []).filter((a) => a.isActive !== false));

    const items = exp.data.items || [];
    setExpenseCats(items);

    const found = items.find(
      (c) => String(c?.name || "").trim().toLowerCase() === "emi"
    );
    if (found) setEmiExpenseCategoryId(found._id);
  }

  async function loadPlans() {
    const res = await api.get("/api/emi/plans");
    setPlans(res.data.plans || []);
  }

  async function loadInstallments() {
    const res = await api.get("/api/emi/installments", { params: { month } });
    setInstallments(res.data.items || []);
  }

  useEffect(() => {
    loadBasics();
    loadPlans();
    loadInstallments();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadInstallments();
    // eslint-disable-next-line
  }, [month]);

  useEffect(() => {
    const computed = calcTotalPayable(form.originalPrice, form.emiCharge);
    if (String(form.totalPayable || "") !== String(computed)) {
      setForm((prev) => ({ ...prev, totalPayable: String(computed) }));
    }
    // eslint-disable-next-line
  }, [form.originalPrice, form.emiCharge]);

  function openModal() {
    setMsg("");
    setForm((f) => ({
      ...f,
      productName: "",
      brand: "",
      category: "",
      purchaseDate: today(),
      originalPrice: "",
      emiCharge: 0,
      totalPayable: "",
      months: 6,
      startMonth: month,
      splitType: "equal",
      personalUserId: myId || members[0]?.id || "",
      ratioMe: 50,
      ratioOther: 50,
      fixedMe: "",
      fixedOther: "",
      note: "",
    }));
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setMsg("");
  }

  async function createPlan() {
    setMsg("");
    try {
      if (!form.productName) return setMsg("Product name required");
      if (!form.originalPrice || Number(form.originalPrice) <= 0) {
        return setMsg("Original price required");
      }
      if (Number(form.emiCharge) < 0) {
        return setMsg("EMI charge (%) cannot be negative");
      }
      if (!form.months || Number(form.months) <= 0) {
        return setMsg("Months required");
      }
      if (!form.startMonth) return setMsg("Start month required");

      if (form.splitType === "personal" && !form.personalUserId) {
        return setMsg("Please select who this personal EMI belongs to");
      }

      let payload = {
        ...form,
        originalPrice: Number(form.originalPrice),
        emiCharge: Number(form.emiCharge || 0),
        months: Number(form.months),
      };

      if (form.splitType === "personal") {
        payload.personalUserId = form.personalUserId;
      }

      if (form.splitType === "ratio" && otherMember) {
        payload.ratios = [
          { userId: myId, ratio: Number(form.ratioMe) },
          { userId: otherMember.id, ratio: Number(form.ratioOther) },
        ];
      }

      if (form.splitType === "fixed" && otherMember) {
        payload.fixed = [
          { userId: myId, amount: Number(form.fixedMe || 0) },
          { userId: otherMember.id, amount: Number(form.fixedOther || 0) },
        ];
      }

      await api.post("/api/emi/plans", payload);
      closeModal();
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Create plan failed");
    }
  }

  const monthlyPersonTotals = useMemo(() => {
    const map = new Map();

    members.forEach((m) => {
      const id = normalizeId(m.id || m._id);
      map.set(id, {
        userId: id,
        name: m.name || "Member",
        amount: 0,
      });
    });

    plans.forEach((plan) => {
      const isActive = String(plan?.status || "") === "active";
      const inThisMonth = monthInRange(month, plan?.startMonth, plan?.endMonth);

      if (!isActive || !inThisMonth) return;

      const parts = splitMonthlyAmount(plan, members);

      parts.forEach((part) => {
        const partUserId = normalizeId(part.userId || part.key);
        if (!partUserId) return;

        const existing = map.get(partUserId) || {
          userId: partUserId,
          name: part.name || "Member",
          amount: 0,
        };

        existing.amount =
          Math.round((existing.amount + Number(part.amount || 0)) * 100) / 100;

        if (!existing.name && part.name) existing.name = part.name;

        map.set(partUserId, existing);
      });
    });

    return Array.from(map.values())
      .filter((x) => Number(x.amount || 0) > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [plans, members, month]);

  const monthlyCombinedTotal = useMemo(() => {
    const total = monthlyPersonTotals.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return Math.round(total * 100) / 100;
  }, [monthlyPersonTotals]);

  const activePlansThisMonth = useMemo(
    () =>
      plans.filter(
        (p) => String(p?.status || "") === "active" && monthInRange(month, p?.startMonth, p?.endMonth)
      ),
    [plans, month]
  );

  const installmentStats = useMemo(() => {
    const total = installments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const paid = installments
      .filter((i) => String(i.status || "").toLowerCase() === "paid")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const pending = Math.max(0, total - paid);
    const pendingCount = installments.filter(
      (i) => String(i.status || "").toLowerCase() !== "paid"
    ).length;
    const paidCount = installments.filter(
      (i) => String(i.status || "").toLowerCase() === "paid"
    ).length;

    return {
      total: Math.round(total * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      pendingCount,
      paidCount,
      progress: total ? Math.round((paid / total) * 100) : 0,
    };
  }, [installments]);

  const nextDueInstallment = useMemo(() => {
    const pending = installments
      .filter((i) => String(i.status || "").toLowerCase() !== "paid")
      .sort((a, b) => new Date(a?.dueDate || 0) - new Date(b?.dueDate || 0));

    return pending[0] || null;
  }, [installments]);

  async function generateMonth() {
    setMsg("");
    try {
      const payload = emiExpenseCategoryId
        ? { month, expenseCategoryId: emiExpenseCategoryId }
        : { month };

      const res = await api.post("/api/emi/generate", payload);
      const catName = res.data?.usedCategory?.name;

      setMsg(
        `Created ${res.data.createdCount} EMI bill(s) for ${monthLabel(month)}` +
        (catName ? ` (Category: ${catName})` : "")
      );

      await loadInstallments();
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || "Generate failed");
    }
  }

  async function generateSinglePlan(planId, productName) {
    setMsg("");
    try {
      const payload = emiExpenseCategoryId
        ? { month, expenseCategoryId: emiExpenseCategoryId }
        : { month };

      const res = await api.post(`/api/emi/plans/${planId}/generate`, payload);
      const createdCount = Number(res.data?.createdCount || 0);
      const catName = res.data?.usedCategory?.name;

      setMsg(
        createdCount > 0
          ? `Created EMI bill for ${productName} in ${monthLabel(month)}` +
          (catName ? ` (Category: ${catName})` : "")
          : `EMI bill already exists for ${productName} in ${monthLabel(month)}`
      );

      await loadInstallments();
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || "Generate failed");
    }
  }

  async function setStatus(planId, status) {
    try {
      await api.put(`/api/emi/plans/${planId}/status`, { status });
      await loadPlans();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Status update failed");
    }
  }

function openPayModalForInstallment(item) {
  setSelectedInstallment(item);
  setPayForm({
    paidByUserId: myId || members[0]?.id || "",
    fromAccountId: "",
    paidDate: item?.dueDate
      ? new Date(item.dueDate).toISOString().slice(0, 10)
      : today(),
  });
  setPayModalOpen(true);
}

  function closePayModal() {
    setPayModalOpen(false);
    setSelectedInstallment(null);
  }

  async function confirmMarkPaid() {
    if (!selectedInstallment?._id) return;
    if (!payForm.paidByUserId) return setMsg("Select who is paying");
    if (!payForm.fromAccountId) return setMsg("Select which account is paying");

    try {
      await api.put(`/api/emi/installments/${selectedInstallment._id}/status`, {
        status: "paid",
        paidByUserId: payForm.paidByUserId,
        fromAccountId: payForm.fromAccountId,
        paidDate: payForm.paidDate,
      });
      closePayModal();
      await loadInstallments();
      await loadPlans();
      setMsg("EMI marked paid and deducted from selected account");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Update failed");
    }
  }

  async function setInstallmentStatus(id, status) {
    try {
      await api.put(`/api/emi/installments/${id}/status`, { status });
      await loadInstallments();
      await loadPlans();
      setMsg("EMI moved back to pending and the payment transaction was removed");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Update failed");
    }
  }

  function deleteInstallment(id) {
    setDeleteInstallmentId(id);
    setConfirmOpen(true);
  }

  async function handleConfirmDeleteInstallment() {
    if (!deleteInstallmentId) return;

    try {
      await api.delete(`/api/emi/installments/${deleteInstallmentId}`);
      await loadInstallments();
      await loadPlans();
      setMsg("Installment deleted successfully");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setDeleteInstallmentId("");
    }
  }

  return (
    <AppLayout>
      <main className="emi-page min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 px-2 py-3 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="mx-auto w-full space-y-4 sm:space-y-5">
          <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-800 p-4 text-white shadow-xl sm:rounded-3xl sm:p-6 lg:p-7">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="absolute bottom-0 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="hidden w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 backdrop-blur sm:inline-flex">
                  EMI Planner
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:mt-4 sm:text-4xl">
                  EMI Management
                </h1>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-200 sm:text-base sm:leading-6">
                  Create EMI plans, generate bills, and track monthly liability for {monthLabel(month)}.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-[460px]">
                <label
                  onClick={openNativePicker}
                  className="cursor-pointer rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur sm:p-3"
                >
                  <span className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-300 sm:text-xs">
                    <Icon name="calendar" className="h-3.5 w-3.5" />
                    Selected Month
                  </span>
                  <input
                    type="month"
                    className="w-full cursor-pointer rounded-xl border border-white/20 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-white/20 dark:bg-slate-950 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    onClick={(e) => {
                      e.currentTarget.focus();
                      e.currentTarget.showPicker?.();
                    }}
                  />
                </label>

                <ActionButton onClick={openModal} variant="soft" className="min-h-[46px] rounded-2xl bg-white text-slate-950 hover:bg-sky-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:min-h-[74px]">
                  <Icon name="plus" className="h-4 w-4" />
                  Add EMI Plan
                </ActionButton>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Combined EMI To Pay"
              value={`৳ ${money(monthlyCombinedTotal)}`}
              helper={`Total active EMI liability in ${monthLabel(month)}`}
              accent="from-emerald-400 to-teal-600"
              icon="card"
            />
            <StatCard
              label="Active Plans"
              value={activePlansThisMonth.length}
              helper="Plans active in selected month"
              accent="from-sky-400 to-blue-600"
              icon="chart"
              hideOnMobile
            />
            <StatCard
              label="Pending Bills"
              value={`৳ ${money(installmentStats.pending)}`}
              helper={`${installmentStats.pendingCount} pending installment(s)`}
              accent="from-amber-400 to-orange-600"
              icon="calendar"
              hideOnMobile
            />
            <StatCard
              label="Paid This Month"
              value={`৳ ${money(installmentStats.paid)}`}
              helper={`${installmentStats.paidCount} paid installment(s)`}
              accent="from-violet-400 to-fuchsia-600"
              icon="check"
            />
          </section>

          {msg && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 shadow-sm break-words dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
              {msg}
            </div>
          )}

          <LiabilitySection items={monthlyPersonTotals} total={monthlyCombinedTotal} />

          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-sky-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:to-sky-400/10 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Monthly EMI Bills</div>
                <p className="mt-1 hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
                  Generate pending installment rows for all active plans in {monthLabel(month)}.
                </p>
                <p className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Expense category used: <b>{emiExpenseCategoryId ? "EMI" : "Not selected"}</b>
                </p>
              </div>

              <ActionButton onClick={generateMonth} variant="primary" className="w-full rounded-2xl sm:w-auto">
                <Icon name="refresh" className="h-4 w-4" />
                Create EMI Bills
              </ActionButton>
            </div>

            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Created Bills
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{installments.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:col-span-2 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Collection Progress
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{installmentStats.progress}%</div>
                  <div className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                    Paid ৳ {money(installmentStats.paid)} / ৳ {money(installmentStats.total)}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    style={{ width: `${installmentStats.progress}%` }}
                  />
                </div>
              </div>
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40 sm:block sm:col-span-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Next Due
                </div>
                <div className="mt-2 text-base font-black text-slate-950 break-words dark:text-white">
                  {nextDueInstallment?.planId?.productName || "No pending due"}
                </div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {nextDueInstallment ? safeDate(nextDueInstallment.dueDate) : "All clear"}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-white via-indigo-50 to-sky-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:via-indigo-400/10 dark:to-sky-400/10 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div>
                <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">EMI Plans</div>
                <p className="mt-1 hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
                  Minimal cards with expandable details for product, split, progress, and bill creation.
                </p>
              </div>
              <div className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                {plans.length} plan(s)
              </div>
            </div>

            {plans.length === 0 ? (
              <div className="p-4 sm:p-6">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40 sm:p-8">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon name="card" className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-base font-black text-slate-900 dark:text-white">No EMI plans yet</div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Add your first EMI plan to calculate monthly payables automatically.
                  </p>
                  <ActionButton onClick={openModal} variant="primary" className="mt-4">
                    <Icon name="plus" className="h-4 w-4" />
                    Add EMI Plan
                  </ActionButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 xl:grid-cols-2 2xl:grid-cols-3">
                {plans.map((p) => (
                  <PlanCard
                    key={p._id}
                    plan={p}
                    month={month}
                    members={members}
                    onGenerate={generateSinglePlan}
                    onStatus={setStatus}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.05] sm:rounded-3xl">
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-white to-amber-50 p-4 dark:border-white/10 dark:from-white/[0.06] dark:to-amber-400/10 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div>
                <div className="text-base font-black text-slate-950 dark:text-white sm:text-lg">Installments ({monthLabel(month)})</div>
                <p className="mt-1 hidden text-sm text-slate-600 dark:text-slate-400 sm:block">
                  Mark monthly installments paid or pending. Paid installments deduct from selected account.
                </p>
              </div>
              <div className="w-fit rounded-full border border-amber-100 bg-white px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                Total generated: {installments.length}
              </div>
            </div>

            {installments.length === 0 ? (
              <div className="p-4 sm:p-6">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400 sm:p-8">
                  No installments generated for this month. Use <b>Create EMI Bills</b> first.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {installments.map((i) => {
                  const paid = String(i.status || "").toLowerCase() === "paid";

                  return (
                    <div key={i._id} className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="break-words text-sm font-black text-slate-950 dark:text-white sm:text-base">
                          {i?.planId?.productName || "-"}
                        </div>
                        <div className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                          Generated EMI installment for {monthLabel(month)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:contents">
                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-slate-950/40 dark:ring-white/10 lg:bg-transparent lg:p-0 lg:ring-0">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">Amount</div>
                          <div className="mt-1 text-base font-black text-slate-950 dark:text-white sm:text-lg">৳ {money(i.amount)}</div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-slate-950/40 dark:ring-white/10 lg:bg-transparent lg:p-0 lg:ring-0">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">Due Date</div>
                          <div className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200 sm:text-base">{safeDate(i.dueDate)}</div>
                        </div>
                      </div>

                      <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(i.status)}`}>
                          {i.status || "-"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
                        {paid ? (
                          <ActionButton onClick={() => setInstallmentStatus(i._id, "pending")} variant="soft" className="w-full px-3">
                            Pending
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => openPayModalForInstallment(i)} variant="success" className="w-full px-3">
                            Pay
                          </ActionButton>
                        )}

                        <ActionButton onClick={() => deleteInstallment(i._id)} variant="danger" className="w-full px-3">
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <ConfirmModal
          open={confirmOpen}
          title="Delete Installment"
          message="Are you sure you want to delete this installment? If it is already paid, the related payment record may also be affected."
          onCancel={() => {
            setConfirmOpen(false);
            setDeleteInstallmentId("");
          }}
          onConfirm={handleConfirmDeleteInstallment}
        />

        {payModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white sm:max-w-xl sm:rounded-3xl">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
                <div className="text-xl font-black">Mark EMI as Paid</div>
                <p className="mt-1 text-sm text-emerald-50">
                  {selectedInstallment?.planId?.productName || "This installment"} will create an expense transaction and deduct the selected account.
                </p>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Who is paying" className="sm:col-span-2">
                    <select
                      className={inputClass()}
                      value={payForm.paidByUserId}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, paidByUserId: e.target.value }))
                      }
                    >
                      <option value="">Select member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </Field>

<Field label="From which account" className="sm:col-span-2">
  <select
    className={inputClass()}
    value={payForm.fromAccountId}
    onChange={(e) =>
      setPayForm((p) => ({ ...p, fromAccountId: e.target.value }))
    }
  >
    <option value="">Select account</option>

    {payableAccounts.length === 0 ? (
      <option value="" disabled>
        No payable account found
      </option>
    ) : (
      payableAccounts.map((a) => (
        <option key={a._id} value={a._id}>
          {a.name}
        </option>
      ))
    )}
  </select>
</Field>

                  <Field label="Payment Date" className="sm:col-span-2">
                    <input
                      type="date"
                      className={inputClass()}
                      value={payForm.paidDate}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, paidDate: e.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-200">Payment Amount</span>
                    <span className="text-2xl font-black text-emerald-800 dark:text-emerald-100">
                      ৳ {money(selectedInstallment?.amount || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <ActionButton onClick={closePayModal} variant="soft">
                    Cancel
                  </ActionButton>
                  <ActionButton onClick={confirmMarkPaid} variant="success">
                    Confirm Payment
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="emi-modal max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white sm:max-w-5xl sm:rounded-3xl">
              <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-800 p-5 text-white sm:p-6">
                <div className="text-xl font-black sm:text-2xl">Add EMI Plan</div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-200 sm:text-sm">
                  Enter product, pricing, schedule, and split details. Monthly amount will be calculated automatically.
                </p>
              </div>

              <div className="space-y-4 p-3 sm:p-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white">Product Details</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Basic purchase information</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                      Step 1
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Product Name" className="sm:col-span-2">
                      <input
                        className={inputClass()}
                        value={form.productName}
                        onChange={(e) => setForm({ ...form, productName: e.target.value })}
                        placeholder="Example: Mobile phone"
                      />
                    </Field>

                    <Field label="Brand">
                      <input
                        className={inputClass()}
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="Example: Samsung"
                      />
                    </Field>

                    <Field label="Category">
                      <select
                        className={inputClass()}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value="">Select category</option>
                        {productCategoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Purchase Date">
                      <input
                        type="date"
                        className={inputClass()}
                        value={form.purchaseDate}
                        onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                      />
                    </Field>

                    <Field label="Start Month">
                      <input
                        type="month"
                        className={inputClass()}
                        value={form.startMonth}
                        onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                      />
                    </Field>

                    <Field label="Months">
                      <select
                        className={inputClass()}
                        value={form.months}
                        onChange={(e) => setForm({ ...form, months: e.target.value })}
                      >
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>
                            {m} month{m > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white">EMI Calculation</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Total payable is auto calculated</div>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20">
                      Step 2
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Field label="Original Price">
                      <input
                        className={inputClass()}
                        value={form.originalPrice}
                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                        placeholder="Example: 60000"
                      />
                    </Field>

                    <Field label="EMI Charge (%)">
                      <input
                        className={inputClass()}
                        value={form.emiCharge}
                        onChange={(e) => setForm({ ...form, emiCharge: e.target.value })}
                        placeholder="Example: 0.9"
                      />
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Example: <b>0.9</b> means <b>0.9%</b> charge.
                      </div>
                    </Field>

                    <Field label="Total Payable">
                      <input
                        className={inputClass("bg-slate-50 font-black text-slate-950 dark:bg-slate-900 dark:text-white")}
                        value={form.totalPayable}
                        readOnly
                        title="Auto calculated = Original Price + (Original Price × EMI Charge%)"
                      />
                    </Field>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10 md:col-span-3 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                            Estimated Monthly EMI
                          </div>
                          <div className="mt-1 hidden text-sm text-emerald-700 dark:text-emerald-200 sm:block">
                            Based on total payable and selected months.
                          </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-800 dark:text-emerald-100 sm:text-3xl">
                          ৳ {money(Number(form.totalPayable || 0) / Number(form.months || 1))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-slate-950 dark:text-white">Split Settings</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Decide who will carry this EMI liability</div>
                    </div>
                    <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20">
                      Step 3
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Split Type" className="sm:col-span-2">
                      <select
                        className={inputClass()}
                        value={form.splitType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            splitType: nextType,
                            personalUserId:
                              nextType === "personal"
                                ? (prev.personalUserId || myId || members[0]?.id || "")
                                : prev.personalUserId,
                          }));
                        }}
                      >
                        <option value="equal">Equal</option>
                        <option value="personal">Personal</option>
                        <option value="ratio">Ratio</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </Field>

                    {form.splitType === "personal" && (
                      <Field label="Personal For" className="sm:col-span-2">
                        <select
                          className={inputClass()}
                          value={form.personalUserId}
                          onChange={(e) => setForm({ ...form, personalUserId: e.target.value })}
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    {form.splitType === "ratio" && otherMember && (
                      <>
                        <Field label="My %">
                          <input
                            className={inputClass()}
                            value={form.ratioMe}
                            onChange={(e) => setForm({ ...form, ratioMe: e.target.value })}
                          />
                        </Field>

                        <Field label={`${otherMember.name} %`}>
                          <input
                            className={inputClass()}
                            value={form.ratioOther}
                            onChange={(e) => setForm({ ...form, ratioOther: e.target.value })}
                          />
                        </Field>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:col-span-2 lg:col-span-4">
                          Ratio split should normally sum to 100.
                        </div>
                      </>
                    )}

                    {form.splitType === "fixed" && otherMember && (
                      <>
                        <Field label="My Amount">
                          <input
                            className={inputClass()}
                            value={form.fixedMe}
                            onChange={(e) => setForm({ ...form, fixedMe: e.target.value })}
                          />
                        </Field>

                        <Field label={`${otherMember.name} Amount`}>
                          <input
                            className={inputClass()}
                            value={form.fixedOther}
                            onChange={(e) => setForm({ ...form, fixedOther: e.target.value })}
                          />
                        </Field>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:col-span-2 lg:col-span-4">
                          Fixed amounts should match the monthly amount.
                        </div>
                      </>
                    )}

                    <Field label="Note" className="sm:col-span-2 lg:col-span-4">
                      <input
                        className={inputClass()}
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Optional note"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <ActionButton onClick={closeModal} variant="soft">
                    Cancel
                  </ActionButton>
                  <ActionButton onClick={createPlan} variant="primary">
                    Save Plan
                  </ActionButton>
                </div>

                {msg && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 break-words dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                    {msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
