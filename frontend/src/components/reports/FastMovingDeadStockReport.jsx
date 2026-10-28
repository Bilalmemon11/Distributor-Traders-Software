import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function FastMovingDeadStockReport({ filters }) {
  const [data, setData] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(60);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("movement_status");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchVelocityData();
  }, [period]);

  const fetchVelocityData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("period", period);
      const res = await fetch(`${API_BASE_URL}/reports/inventory-velocity?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch inventory velocity:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return (data.items || []).filter((item) => {
      if (statusFilter !== "all" && item.movement_status !== statusFilter) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const match =
          item.product_name.toLowerCase().includes(q) ||
          item.variant_name.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.batch_no && item.batch_no.toLowerCase().includes(q)) ||
          (item.category_name && item.category_name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [data.items, statusFilter, search]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Custom ordering for status
      if (sortField === "movement_status") {
        const order = { dead: 1, slow: 2, fast: 3, out_of_stock: 4 };
        aVal = order[a.movement_status] || 99;
        bVal = order[b.movement_status] || 99;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? Number(aVal || 0) - Number(bVal || 0)
        : Number(bVal || 0) - Number(aVal || 0);
    });
    return list;
  }, [filteredItems, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const columns = [
    { label: "Product & Variant", key: "full_name" },
    { label: "Category", key: "category_name" },
    { label: "Stock Qty", key: "stock_qty" },
    { label: "Cost Value", key: "stock_value_cost" },
    { label: "Units Sold", key: "units_sold" },
    { label: "Revenue", key: "revenue" },
    { label: "Days Inactive", key: "days_inactive" },
    { label: "Status", key: "status_label" },
    { label: "Action Suggestion", key: "action_suggestion" },
  ];

  const exportRows = sortedItems.map((i) => ({
    full_name: i.full_name,
    category_name: i.category_name,
    stock_qty: i.stock_qty,
    stock_value_cost: fmt(i.stock_value_cost),
    units_sold: i.units_sold,
    revenue: fmt(i.revenue),
    days_inactive: i.days_inactive !== null ? `${i.days_inactive} days` : "Never Sold",
    status_label: i.status_label,
    action_suggestion: i.action_suggestion,
  }));

  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      <ExportButtons
        title={`Fast-Moving vs Dead Stock Report (Last ${period} Days)`}
        columns={columns}
        rows={exportRows}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dead Stock Alert Card */}
        <div className="bg-red-50/80 border-2 border-red-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ⚠️ Dead Stock (Tied-up Capital)
              </p>
              <h2 className="text-2xl font-black text-red-700 mt-1">
                {fmt(summary.dead_stock_cost_value || 0)}
              </h2>
            </div>
            <span className="text-2xl">🛑</span>
          </div>
          <div className="mt-2 text-xs text-red-600 font-medium">
            <strong>{summary.dead_stock_count || 0}</strong> item(s) with 0 sales in past {period} days. Discount sale recommended!
          </div>
        </div>

        {/* Fast Moving Card */}
        <div className="bg-green-50/80 border-2 border-green-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                🚀 Fast Moving (Top Sellers)
              </p>
              <h2 className="text-2xl font-black text-green-800 mt-1">
                {summary.fast_moving_count || 0} Products
              </h2>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="mt-2 text-xs text-green-700 font-medium">
            High velocity sales! Keep safety stock buffer to prevent out of stock.
          </div>
        </div>

        {/* Slow Moving Card */}
        <div className="bg-amber-50/80 border-2 border-amber-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                🐢 Slow Moving Stock
              </p>
              <h2 className="text-2xl font-black text-amber-800 mt-1">
                {summary.slow_moving_count || 0} Products
              </h2>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            Moderate sales. Avoid bulk reordering until stock levels drop.
          </div>
        </div>

        {/* Total Inventory Capital */}
        <div className="bg-blue-50/80 border-2 border-blue-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                💼 Total Stock Holding Capital
              </p>
              <h2 className="text-2xl font-black text-blue-800 mt-1">
                {fmt(summary.total_stock_capital || 0)}
              </h2>
            </div>
            <span className="text-2xl">🏢</span>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-medium">
            Total cost investment across {summary.total_products_tracked || 0} product variants.
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border ${
              statusFilter === "all"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:bg-[#e2e8f0]"
            }`}
          >
            All Products ({data.items?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("dead")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              statusFilter === "dead"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            <span>⚠️</span> Dead Stock ({summary.dead_stock_count || 0})
          </button>
          <button
            onClick={() => setStatusFilter("fast")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              statusFilter === "fast"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            }`}
          >
            <span>🚀</span> Fast Moving ({summary.fast_moving_count || 0})
          </button>
          <button
            onClick={() => setStatusFilter("slow")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              statusFilter === "slow"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span>🐢</span> Slow Moving ({summary.slow_moving_count || 0})
          </button>
          <button
            onClick={() => setStatusFilter("out_of_stock")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              statusFilter === "out_of_stock"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>📦</span> Out of Stock ({summary.out_of_stock_count || 0})
          </button>
        </div>

        {/* Time Period Selector & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748b]">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#1e3a8a]"
            >
              <option value="30">Last 30 Days (1 Month)</option>
              <option value="60">Last 60 Days (2 Months)</option>
              <option value="90">Last 90 Days (Quarterly)</option>
              <option value="180">Last 180 Days (Half Year)</option>
              <option value="all">All Time History</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search product, SKU, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#1e3a8a]"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#64748b] flex flex-col items-center gap-2">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Analyzing inventory movement and sales velocity...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1e293b]">
              <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0] uppercase">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("full_name")}
                  >
                    Product & Variant {sortField === "full_name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="p-3.5">Category / Batch</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("stock_qty")}
                  >
                    Godown Stock {sortField === "stock_qty" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("stock_value_cost")}
                  >
                    Locked Capital {sortField === "stock_value_cost" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("units_sold")}
                  >
                    Units Sold ({period}d) {sortField === "units_sold" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("days_inactive")}
                  >
                    Last Sale / Inactive {sortField === "days_inactive" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("movement_status")}
                  >
                    Movement Status {sortField === "movement_status" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="p-3.5">Action Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-[#64748b]">
                      No products match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        item.movement_status === "dead" && item.stock_qty > 0
                          ? "bg-red-50/20"
                          : ""
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-[#1e293b]">{item.product_name}</div>
                        <div className="text-xs text-[#64748b]">Variant: {item.variant_name}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium block w-fit mb-1">
                          {item.category_name}
                        </span>
                        {item.batch_no && (
                          <span className="text-[11px] font-mono text-[#4338ca]">
                            Batch: {item.batch_no}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-bold text-sm ${
                            item.stock_qty <= 0
                              ? "text-red-500"
                              : item.stock_qty <= item.reorder_level
                              ? "text-amber-600"
                              : "text-slate-800"
                          }`}
                        >
                          {item.stock_qty}
                        </span>
                        <span className="text-xs text-[#64748b] block">
                          Cost: {fmt(item.cost_price)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-[#1e293b]">
                          {fmt(item.stock_value_cost)}
                        </span>
                        <span className="text-[11px] text-[#64748b] block">
                          Retail: {fmt(item.stock_value_retail)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-black text-sm ${
                            item.units_sold > 0 ? "text-[#16a34a]" : "text-red-600"
                          }`}
                        >
                          {item.units_sold} sold
                        </span>
                        {item.revenue > 0 && (
                          <span className="text-[11px] text-slate-600 block">
                            Rev: {fmt(item.revenue)}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs">
                        {item.days_inactive !== null ? (
                          <div>
                            <span
                              className={`font-semibold ${
                                item.days_inactive > 60
                                  ? "text-red-600 font-bold"
                                  : "text-slate-700"
                              }`}
                            >
                              {item.days_inactive} days ago
                            </span>
                            {item.last_sale_date && (
                              <span className="text-[11px] text-[#64748b] block">
                                ({item.last_sale_date})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-500 font-semibold italic">Never Sold</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {item.movement_status === "dead" && (
                          <span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            <span>🛑</span> Dead Stock
                          </span>
                        )}
                        {item.movement_status === "fast" && (
                          <span className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            <span>🚀</span> Fast Moving
                          </span>
                        )}
                        {item.movement_status === "slow" && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            <span>🐢</span> Slow Moving
                          </span>
                        )}
                        {item.movement_status === "out_of_stock" && (
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            <span>📦</span> Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-lg block w-fit ${
                            item.movement_status === "dead"
                              ? "bg-red-50 text-red-700 border border-red-200 font-bold"
                              : item.movement_status === "fast"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {item.action_suggestion}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
