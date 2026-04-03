import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { setAuth } from "../services/authStorage";
import logo from "../../assets/icon.png"

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left Side */}
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-md">
                Personal Budgeting App
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-[-0.04em] text-white xl:text-6xl">
                Smarter finance
                <br />
                starts here
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                Track expenses, manage EMI, and understand your money with a
                cleaner, faster, and more premium budgeting experience.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
                  <p className="text-sm text-slate-400">Expense Tracking</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Simple
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Keep entries clear and easy to review.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
                  <p className="text-sm text-slate-400">EMI Planning</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Organized
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Better control over monthly payments.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
                  <p className="text-sm text-slate-400">Insights</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    Professional
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    View your money in a smarter way.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="rounded-[30px] border border-white/10 bg-white/10 p-1 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <div className="rounded-[28px] bg-white p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-10">
                  <div className="mb-8">
                    <div className="mb-4 flex justify-center">
                      <img
                        src={logo}
                        alt="HomeFinance logo"
                        className="h-14 w-14 object-contain"
                      />
                    </div>

                    <h2 className="text-center text-3xl font-bold tracking-[-0.03em] text-slate-900">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-center text-[15px] leading-6 text-slate-600">
                      Sign in to your HomeFinance Ledger account
                    </p>
                  </div>

                  {err && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
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
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        required
                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          required
                          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Logging in..." : "Login"}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-slate-600">
                    No account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4 transition hover:text-slate-700"
                    >
                      Register
                    </Link>
                  </p>
                </div>
              </div>

              <div className="mt-6 block text-center lg:hidden">
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