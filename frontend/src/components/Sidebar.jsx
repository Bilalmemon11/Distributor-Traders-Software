import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

const navGroups = [
  {
    label: "Sales & Distribution",
    items: [
      { path: "/invoices", icon: "🧾", label: "Invoices & POS" },
      { path: "/sale-returns", icon: "↩️", label: "Customer Returns" },
      { path: "/customers", icon: "👥", label: "Customers" },
      { path: "/areas", icon: "📍", label: "Hyderabad Areas" },
      { path: "/salesmen", icon: "👨‍💼", label: "Salesmen & Bookers" },
      { path: "/supply-men", icon: "🚚", label: "Supply Men & Dispatch" },
    ],
  },
  {
    label: "Stock",
    items: [
      { path: "/products", icon: "📦", label: "Products" },
      { path: "/inventory", icon: "🏭", label: "Stock Inventory" },
      { path: "/stock-history", icon: "📜", label: "Stock History" },
    ],
  },
  {
    label: "Finance",
    items: [
      { path: "/vendors", icon: "🏪", label: "Vendors", adminOnly: true },
      { path: "/purchases", icon: "🛒", label: "Stock Purchase", adminOnly: true },
      { path: "/purchase-returns", icon: "↩️", label: "Vendors Return", adminOnly: true },
      { path: "/expenses", icon: "💸", label: "Expenses" },
    ],
  },
  {
    label: "Analytics & System",
    items: [
      { path: "/reports", icon: "📊", label: "Reports", adminOnly: true },
      { path: "/profit-loss", icon: "📈", label: "Profit & Loss", adminOnly: true },
      { path: "/settings", icon: "⚙️", label: "Settings", adminOnly: true },
      { path: "/backups", icon: "💾", label: "Backup & Restore", adminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useApp();

  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="w-64 h-screen bg-[#1e3a8a] text-white shadow-lg flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Qadri Distributors"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-sm leading-tight truncate">
              Qadri Distributor
            </h1>
            <p className="text-slate-300 text-xs">Trading & Billing ERP</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {/* Dashboard Link */}
        <div className="mb-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#fbbf24] text-[#1e3a8a] font-bold shadow-md"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="text-base">🏠</span>
            <span>Dashboard</span>
          </NavLink>
        </div>

        {filteredNavGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-slate-300/80 text-[11px] font-bold uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#fbbf24] text-[#1e3a8a] font-bold shadow-md"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-white/10 bg-[#162a63]">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || "Active User"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAdmin ? (
                <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full inline-block">
                  👑 Admin
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full inline-block">
                  💼 Cashier
                </span>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out of System"
            className="p-2 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition cursor-pointer flex items-center justify-center text-xs gap-1"
          >
            <span>🚪</span>
            <span className="text-[11px] font-semibold">Exit</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
