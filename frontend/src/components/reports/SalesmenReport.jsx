import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function SalesmenReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("total_sales");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchSalesmenPerformance();
  }, [filters]);

  const fetchSalesmenPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.fromDate) params.append("from_date", filters.fromDate);
      if (filters?.toDate) params.append("to_date", filters.toDate);

      const res = await fetch(
        `${API_BASE_URL}/reports/salesmen-performance?${params.toString()}`
      );
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load salesmen report:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data, search]);

  const sortedData = useMemo(() => {
    const list = [...filteredData];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });
    return list;
  }, [filteredData, sortField, sortDirection]);

  const totalSales = filteredData.reduce((s, i) => s + Number(i.total_sales || 0), 0);
  const totalPaid = filteredData.reduce((s, i) => s + Number(i.total_paid || 0), 0);
  const totalCommission = filteredData.reduce((s, i) => s + Number(i.total_commission || 0), 0);
  const totalInvoices = filteredData.reduce((s, i) => s + Number(i.invoices_count || 0), 0);

  const columns = [
    { label: "Salesman / Booker", key: "name" },
    { label: "Phone", key: "phone" },
    { label: "Commission Rate", key: "commission_rate" },
    { label: "Invoices", key: "invoices_count" },
    { label: "Total Sales", key: "total_sales" },
    { label: "Paid Collected", key: "total_paid" },
    { label: "Commission Earned", key: "total_commission" },
  ];

  const exportRows = sortedData.map((item) => ({
    name: item.name,
    phone: item.phone || "—",
    commission_rate: `${item.commission_rate || 0}%`,
    invoices_count: item.invoices_count,
    total_sales: fmt(item.total_sales),
    total_paid: fmt(item.total_paid),
    total_commission: fmt(item.total_commission),
  }));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-6">
      <ExportButtons
        title="Salesmen & Booker Commission Report"
        columns={columns}
        rows={exportRows}
      />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Sales by Team</p>
          <h2 className="text-2xl font-bold text-[#16a34a]">{fmt(totalSales)}</h2>
          <span className="text-xs text-[#64748b]">{totalInvoices} total bills booked</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Commission Payable</p>
          <h2 className="text-2xl font-bold text-[#d97706]">{fmt(totalCommission)}</h2>
          <span className="text-xs text-amber-600 font-medium">To be distributed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Paid Collections</p>
          <h2 className="text-2xl font-bold text-[#2563eb]">{fmt(totalPaid)}</h2>
          <span className="text-xs text-[#64748b]">Cash / Online collected</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Salesmen Tracked</p>
          <h2 className="text-2xl font-bold text-[#1e293b]">
            {filteredData.length} Members
          </h2>
          <span className="text-xs text-[#64748b]">Includes Self / Direct</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search salesman or booker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:outline-none focus:border-[#1e3a8a]"
          />
          <span className="text-xs text-[#64748b]">
            Showing <strong>{sortedData.length}</strong> salesmen
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#64748b]">
            Loading Salesmen Performance Report...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1e293b]">
              <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0] uppercase">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("name")}
                  >
                    Salesman / Booker {sortField === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="p-3.5">Phone</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("commission_rate")}
                  >
                    Commission % {sortField === "commission_rate" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("invoices_count")}
                  >
                    Invoices {sortField === "invoices_count" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("total_sales")}
                  >
                    Total Sales {sortField === "total_sales" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("total_paid")}
                  >
                    Paid / Collected {sortField === "total_paid" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("total_commission")}
                  >
                    Commission Earned {sortField === "total_commission" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#64748b]">
                      No salesmen records found for this period.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1e293b]">
                            👨‍💼 {item.name}
                          </span>
                          {(item.id === 1 || item.name.toLowerCase().includes("self")) && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                              Direct / Self
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {item.phone || "—"}
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs bg-[#e0e7ff] text-[#4338ca] font-bold px-2 py-0.5 rounded">
                          {item.commission_rate || 0}%
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {item.invoices_count}
                      </td>
                      <td className="p-3.5 font-bold text-[#16a34a]">
                        {fmt(item.total_sales)}
                      </td>
                      <td className="p-3.5 font-semibold text-[#2563eb]">
                        {fmt(item.total_paid)}
                      </td>
                      <td className="p-3.5 font-bold text-[#d97706]">
                        {fmt(item.total_commission)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {sortedData.length > 0 && (
                <tfoot className="bg-[#f1f5f9] font-bold border-t-2 border-[#cbd5e1]">
                  <tr>
                    <td className="p-3.5" colSpan="3">
                      Total
                    </td>
                    <td className="p-3.5">{totalInvoices}</td>
                    <td className="p-3.5 text-[#16a34a]">{fmt(totalSales)}</td>
                    <td className="p-3.5 text-[#2563eb]">{fmt(totalPaid)}</td>
                    <td className="p-3.5 text-[#d97706]">{fmt(totalCommission)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
