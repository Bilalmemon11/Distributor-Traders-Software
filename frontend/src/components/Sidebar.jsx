import { NavLink, useLocation } from "react-router-dom";

const navGroups = [
  {
    label: "Sales",
    items: [
      { path: "/invoices", icon: "🧾", label: "Invoices" },
      { path: "/sale-returns", icon: "↩️", label: "Customer Returns" },
      { path: "/customers", icon: "👥", label: "Customers" },
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
      { path: "/vendors", icon: "🏪", label: "Suppliers" },
      { path: "/purchases", icon: "🛒", label: "Stock Purchase" },
      { path: "/purchase-returns", icon: "↩️", label: "Supplier Returns" },
      { path: "/expenses", icon: "💸", label: "Expenses" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { path: "/reports", icon: "📊", label: "Reports" },
      { path: "/profit-loss", icon: "📈", label: "Profit & Loss" },
      {
        path: "/settings",
        icon: "⚙️",
        label: "Settings",
      },
      {
        path: "/backups",
        icon: "💾",
        label: "Backup & Restore",
      },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#1e3a8a] text-white shadow-lg flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Qadri Distributors"
              className="w-full h-full object-cover"
            />
          </div>{" "}
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">
              Qadri Distributor
            </h1>
            <p className="text-slate-300 text-xs">Business Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest px-3 mb-2">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#fbbf24] text-[#1e3a8a] border border-transparent font-bold shadow-md"
                      : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#fbbf24] text-[#1e3a8a] border border-transparent font-bold shadow-md"
                : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
            }`
          }
          end
        >
          <span className="text-base">🏠</span>
          <span>Dashboard</span>
        </NavLink>
      </div>
    </aside>
  );
}
