import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FamilySetup from "./pages/FamilySetup";
import ProtectedRoute from "./components/ProtectedRoute";
import { isLoggedIn } from "./services/authStorage";
import Settings from "./pages/Settings";
import Ledger from "./pages/Ledger";
import Fixed from "./pages/Fixed";
import Grocery from "./pages/Grocery";
import EMI from "./pages/EMI";
import Savings from "./pages/Savings";
import Wallet from "./pages/Wallet";
import CarryForward from "./pages/CarryForward";
import YearOverview from "./pages/YearOverview";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Register />} />

        <Route
          path="/family"
          element={
            <ProtectedRoute>
              <FamilySetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ledger"
          element={
            <ProtectedRoute>
              <Ledger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fixed"
          element={
            <ProtectedRoute>
              <Fixed />
            </ProtectedRoute>
          }
        />

        <Route
          path="/grocery"
          element={
            <ProtectedRoute>
              <Grocery />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emi"
          element={
            <ProtectedRoute>
              <EMI />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/savings"
          element={
            <ProtectedRoute>
              <Savings />
            </ProtectedRoute>
          }
        />

        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />

        <Route path="/carry-forward" element={<ProtectedRoute><CarryForward /></ProtectedRoute>} />

        <Route path="/year-overview" element={<ProtectedRoute><YearOverview /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}