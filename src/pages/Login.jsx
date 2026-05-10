import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { setAuth } from "../services/authStorage";

function LogoMark() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-900/30">
      <div className="absolute inset-1 rounded-[1.1rem] border border-white/25" />
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5.5 9.8V21h13V9.8" />
        <path d="M9 21v-6h6v6" />
        <path d="M8.5 11.5h2" />
        <path d="M13.5 11.5h2" />
      </svg>
    </div>
  );
}

function FloatingCard({ className = "", title, value, note }) {
  return (
    <div
      className={`rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
    >
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm leading-6 text-slate-300">{note}</div>
    </div>
  );
}

function FeaturePill({ children }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-md">
      {children}
    </span>
  );
}

function EyeIcon({ visible }) {
  return visible ? (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
      <path d="M17.8 17.8A12.8 12.8 0 0 1 12 19C7 19 3.7 16.1 2 12c.8-1.9 2-3.5 3.6-4.7" />
      <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 8.3 2.9 10 7a12.2 12.2 0 0 1-2.2 3.4" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(
    () => form.email.trim() && form.password.trim() && !loading,
    [form.email, form.password, loading]
  );

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", form);
      setAuth(res.data.token, res.data.user);
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-900">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.32),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.28),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_42%,#111827_100%)]" />
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <section className="hidden lg:block">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-medium text-slate-200 shadow-lg shadow-black/10 backdrop-blur-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.85)]" />
                Personal Budgeting App
              </div>

              <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white xl:text-7xl">
                Control your money with a cleaner budget system.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Track grocery, EMI, savings, ledger entries, transfers, and family-wise wallet balances from one organized finance dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <FeaturePill>Expense tracking</FeaturePill>
                <FeaturePill>Split calculation</FeaturePill>
                <FeaturePill>EMI planning</FeaturePill>
                <FeaturePill>Savings insight</FeaturePill>
              </div>

              <div className="relative mt-12 min-h-[260px]">
                <FloatingCard
                  title="Monthly Income"
                  value="৳ 85,000"
                  note="Income, expenses and remaining balance stay connected."
                  className="absolute left-0 top-0 w-72"
                />
                <FloatingCard
                  title="Savings Goal"
                  value="32%"
                  note="Follow your progress with clear financial signals."
                  className="absolute left-72 top-12 w-72"
                />
                <FloatingCard
                  title="Settlement"
                  value="Balanced"
                  note="See who paid more and who needs to settle."
                  className="absolute left-20 top-40 w-80"
                />
              </div>
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="mb-6 flex flex-col items-center text-center lg:hidden">
                <LogoMark />
                <div className="mt-4 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-xl">
                  Personal Budgeting App
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-1.5 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                <div className="rounded-[1.7rem] bg-white/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:bg-slate-950/95 sm:p-8">
                  <div className="mb-7 text-center">
                    <div className="mb-5 hidden justify-center lg:flex">
                      <LogoMark />
                    </div>

                    <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Login to manage your HomeFinance ledger and budget insights.
                    </p>
                  </div>

                  {err && (
                    <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                      {err}
                    </div>
                  )}

                  <form onSubmit={submit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                          Password
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-16 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <EyeIcon visible={showPassword} />
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-sm font-black text-white shadow-xl shadow-blue-900/25 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100" />
                      <span className="relative">{loading ? "Logging in..." : "Login"}</span>
                    </button>
                  </form>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/80">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No account yet?{" "}
                      <Link
                        to="/register"
                        className="font-black text-blue-600 underline decoration-blue-300 underline-offset-4 transition hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300"
                      >
                        Register now
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                Secure access for your personal budget, ledger, EMI and savings records.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
