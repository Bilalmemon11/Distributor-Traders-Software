import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Topbar from '../components/Topbar';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => alert('Could not load dashboard. Is backend running on port 8005?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[#64748b] text-sm animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#ef4444] text-sm">Failed to load dashboard</p>
      </div>
    );
  }

  const expenseByCategory = data.expense_by_category || [];
  const totalExpenses = Number(data.total_expenses || 0);
  const todayInvoices = data.todays_invoices || [];
  const lowStock = (data.low_stock_products || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    stock: Number(p.stock_qty),
    unit: p.unit,
    reorderLevel: Number(p.reorder_level),
  }));
  const customerDues = data.customer_dues || [];
  const vendorDues = data.vendor_dues || [];

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Qadri Distributors Dashboard" />
      <div className="p-6 space-y-6">
        {/* Expiry Warning Banner (30 Days Alert) */}
        {(data.expired_count > 0 || data.expiring_soon_count > 0) && (
          <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              <div>
                <h4 className="text-sm font-bold text-red-800">
                  Stock Expiry Warning Alert (30 Days Threshold)
                </h4>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {data.expired_count > 0 && (
                    <strong className="text-red-600 mr-2">
                      🔴 {data.expired_count} product(s) Expired!
                    </strong>
                  )}
                  {data.expiring_soon_count > 0 && (
                    <strong className="text-amber-700">
                      🟡 {data.expiring_soon_count} product(s) expiring within 30 days!
                    </strong>
                  )}
                  {" "}Check shampoo, cosmetic & liquid inventory to clear or return to supplier.
                </p>
              </div>
            </div>
            <Link
              to="/inventory"
              className="px-4 py-2 text-xs bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold rounded-lg shadow-md transition whitespace-nowrap"
            >
              Open Inventory & Alerts ➔
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard label="Total Sales" value={fmt(data.total_sales)} sub="All invoices" color="accent" icon="💰" />
          <StatCard label="Cash Received" value={fmt(data.cash_collected)} sub="All payments collected" color="green" icon="✅" />
          <StatCard label="Customer Udhar" value={fmt(data.customer_udhar)} sub="Total receivable" color="amber" icon="⏳" />
          <StatCard label="Vendor Payable" value={fmt(data.vendor_payable)} sub="Amount owed to vendors" color="red" icon="🏪" />
          <StatCard label="Total Profit" value={fmt(data.total_profit)} sub="Net (Sales - COGS - Exp)" color="blue" icon="??" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-4 flex items-center gap-2">
              🧾 <span>Today's Sales Invoices</span>
              <span className="ml-auto text-xs bg-[#1e3a8a]/20 text-[#1e3a8a] px-2 py-0.5 rounded-full">
                {todayInvoices.length}
              </span>
            </h3>
            {todayInvoices.length === 0 ? (
              <p className="text-[#64748b] text-sm text-center py-6">No invoices today</p>
            ) : (
              <div className="space-y-3">
                {todayInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                    <div>
                      <p className="text-[#1e293b] text-sm font-medium">{inv.invoice_no}</p>
                      <p className="text-[#64748b] text-xs">{inv.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#22c55e] text-sm font-semibold">{fmt(inv.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inv.payment_type === 'cash' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                        {inv.payment_type === 'cash' ? 'Cash' : 'Udhar'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-4 flex items-center gap-2">
              ⚠️ <span>Low Stock Products</span>
              <span className="ml-auto text-xs bg-[#ef4444]/20 text-[#ef4444] px-2 py-0.5 rounded-full">
                {lowStock.length}
              </span>
            </h3>
            {lowStock.length === 0 ? (
              <p className="text-[#22c55e] text-sm text-center py-6">✅ All stock levels are good!</p>
            ) : (
              <div className="space-y-3">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                    <div>
                      <p className="text-[#1e293b] text-sm font-medium">{p.name}</p>
                      <p className="text-[#64748b] text-xs">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${p.stock === 0 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
                        {p.stock} {p.unit}
                      </p>
                      <p className="text-[#64748b] text-xs">Min: {p.reorderLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-4 flex items-center gap-2">
              💸 <span>Business Expenses</span>
            </h3>
            <div className="space-y-3">
              {expenseByCategory.map((row) => {
                const amt = Number(row.total);
                const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
                return (
                  <div key={row.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#64748b]">{row.category}</span>
                      <span className="text-[#1e293b]">{fmt(amt)}</span>
                    </div>
                    <div className="h-1.5 bg-[#2a3248] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1e3a8a] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {expenseByCategory.length === 0 && (
                <p className="text-[#64748b] text-sm text-center py-4">No expenses recorded</p>
              )}
              {totalExpenses > 0 && (
                <div className="pt-2 border-t border-[#e2e8f0] flex justify-between">
                  <span className="text-[#64748b] text-xs font-medium">Total</span>
                  <span className="text-[#ef4444] text-xs font-bold">{fmt(totalExpenses)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Shop Receivables */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-4">
              🏪 Shop Receivables
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider pb-2">
                      Shop Name
                    </th>

                    <th className="text-right text-[#64748b] text-xs font-semibold uppercase tracking-wider pb-2">
                      Outstanding
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customerDues.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[#e2e8f0] hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5">
                        <p className="text-[#1e293b] font-medium">{c.name}</p>
                        <p className="text-[#64748b] text-xs capitalize">
                          {c.type}
                        </p>
                      </td>

                      <td className="py-2.5 text-right">
                        <span className="text-[#f59e0b] font-semibold">
                          {fmt(c.balance)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {customerDues.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="text-center text-[#64748b] py-6 text-sm"
                      >
                        No Outstanding Shop Balances
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Payments */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-4">
              🚚 Supplier Payments Due
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider pb-2">
                      Supplier
                    </th>

                    <th className="text-right text-[#64748b] text-xs font-semibold uppercase tracking-wider pb-2">
                      Payable
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {vendorDues.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-[#e2e8f0] hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5">
                        <p className="text-[#1e293b] font-medium">{v.name}</p>
                        <p className="text-[#64748b] text-xs">{v.city}</p>
                      </td>

                      <td className="py-2.5 text-right">
                        <span className="text-[#ef4444] font-semibold">
                          {fmt(v.balance)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {vendorDues.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="text-center text-[#22c55e] py-6 text-sm"
                      >
                        ✅ All Suppliers Paid
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <h3 className="text-[#1e293b] font-semibold mb-4">🏪 Supplier Payments Due</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider pb-2">Supplier</th>
                  <th className="text-right text-[#64748b] text-xs font-semibold uppercase tracking-wider pb-2">Payable</th>
                </tr>
              </thead>
              <tbody>
                {vendorDues.map((v) => (
                  <tr key={v.id} className="border-b border-[#e2e8f0] hover:bg-white/[0.03]">
                    <td className="py-2.5">
                      <p className="text-[#1e293b] font-medium">{v.name}</p>
                      <p className="text-[#64748b] text-xs">{v.city}</p>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="text-[#ef4444] font-semibold">{fmt(v.balance)}</span>
                    </td>
                  </tr>
                ))}
                {vendorDues.length === 0 && (
                  <tr><td colSpan={2} className="text-center text-[#22c55e] py-6 text-sm">✅ All suppliers have been paid!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div >
  );
}
