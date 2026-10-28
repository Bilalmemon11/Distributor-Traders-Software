import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useApp();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || "admin";
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8fafc]">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
            🔒
          </div>
          <h2 className="text-xl font-bold text-[#1e293b]">Access Restricted</h2>
          <p className="text-[#64748b] text-sm mt-2 max-w-md">
            Ye page sirf <strong>Administrator</strong> ke liye makhsoos hai. Cashier account ko is section ko dekhne ya edit karne ki ijazat nahi hai.
          </p>
          <a
            href="/"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold shadow-md hover:bg-[#1e40af] transition"
          >
            <span>←</span>
            <span>Dashboard par wapis jayein</span>
          </a>
        </div>
      );
    }
  }

  return children;
}
