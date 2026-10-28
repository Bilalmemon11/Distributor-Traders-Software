import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import StockHistory from "./pages/StockHistory";
import Vendors from "./pages/Vendors";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import ProfitLoss from "./pages/ProfitLoss";
import Areas from "./pages/Areas";
import Salesmen from "./pages/Salesmen";
import SupplyMen from "./pages/SupplyMen";
import PurchaseReturns from "./pages/PurchaseReturns";
import SaleReturns from "./pages/SaleReturns";
import Settings from "./pages/Settings";
import Backups from "./pages/Backups";
import ErrorBoundary from "./components/ErrorBoundary";

function MainLayout() {
  const { token, error } = useApp();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#f4f7fb] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {error && (
          <div className="bg-[#ef4444]/10 border-b border-[#ef4444]/30 text-[#ef4444] text-xs text-center py-2 px-4 font-medium">
            {error}
          </div>
        )}
        <ErrorBoundary>
          <Routes>
            {/* Common Routes (Both Admin & Cashier) */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/sale-returns" element={<SaleReturns />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/salesmen" element={<Salesmen />} />
            <Route path="/supply-men" element={<SupplyMen />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/stock-history" element={<StockHistory />} />
            <Route path="/expenses" element={<Expenses />} />

            {/* Admin Only Routes */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Vendors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Purchases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-returns"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PurchaseReturns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profit-loss"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ProfitLoss />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/backups"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Backups />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
