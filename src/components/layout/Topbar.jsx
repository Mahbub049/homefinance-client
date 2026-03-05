import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../../services/authStorage";

export default function Topbar({ onToggleSidebar, onOpenDrawer }) {
  const nav = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    nav("/login", { replace: true });
  }

  const firstName = user?.name?.split(" ")[0] || "Guest";

  return (
    <header className="h-16 bg-white border-b sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          {onOpenDrawer && (
            <button
              onClick={onOpenDrawer}
              className="md:hidden p-2 rounded-md border hover:bg-gray-100"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Desktop collapse */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden md:inline-flex p-2 rounded-md border hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Page area (keep simple) */}
          <div className="font-semibold text-gray-900">Dashboard</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-xs text-gray-400">Welcome back</span>
            <span className="text-sm font-medium text-gray-900">{firstName}</span>
          </div>

          <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
            {firstName.charAt(0).toUpperCase()}
          </div>

          {user && (
            <button
              onClick={logout}
              className="text-sm bg-black text-white px-3 py-2 rounded-md hover:opacity-90 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}