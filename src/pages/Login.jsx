import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { setAuth } from "../services/authStorage";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api.post("/api/auth/login", form);
      setAuth(res.data.token, res.data.user);
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-1">Login</h1>
        <p className="text-sm text-gray-500 mb-6">HomeFinance Ledger</p>

        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}

        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full border rounded-md px-3 py-2 mb-4"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          className="w-full border rounded-md px-3 py-2 mb-6"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button className="w-full bg-black text-white rounded-md py-2">
          Login
        </button>

        <p className="text-sm text-gray-600 mt-4">
          No account?{" "}
          <Link className="underline" to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}