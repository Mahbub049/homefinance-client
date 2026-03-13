import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { setAuth } from "../services/authStorage";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", form);
      setAuth(res.data.token, res.data.user);
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Premium background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_30%)]" />
        <div className="absolute -top-20 left-[-80px] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-[-80px] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-100px] left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left premium content */}
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-200 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                Personal Budgeting App
              </div>

              <h1 className="mt-7 text-5xl font-extrabold tracking-[-0.04em] text-white leading-[1.02] xl:text-6xl">
                Manage your money with a smarter, premium experience
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Track expenses, manage EMI, review insights, and keep your family
                budget organized with a cleaner and more professional workflow.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-sm text-slate-400">Expense Tracking</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Simple
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Clear entries and clean overview.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-sm text-slate-400">EMI Planning</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Organized
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Better control over monthly bills.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-sm text-slate-400">Dashboard Insights</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Professional
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Better decisions with neat summaries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-1 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <div className="rounded-[26px] border border-white/10 bg-white/85 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl sm:p-8">
                  <div className="mb-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-lg ring-1 ring-white/10">
                      HF
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-[15px] leading-6 text-slate-600">
                      Sign in to your HomeFinance Ledger account
                    </p>
                  </div>

                  {err && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {err}
                    </div>
                  )}

                  <form onSubmit={submit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 pr-20 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />
                      <span className="relative z-10">
                        {loading ? "Logging in..." : "Login"}
                      </span>
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-slate-600">
                    No account?{" "}
                    <Link
                      className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4 transition hover:text-slate-700"
                      to="/register"
                    >
                      Register
                    </Link>
                  </p>
                </div>
              </div>

              {/* Mobile-only top text */}
              <div className="mt-6 block lg:hidden text-center">
                <p className="text-sm font-medium text-slate-300">
                  Personal Budgeting App
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Clean, professional and mobile-friendly finance management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}