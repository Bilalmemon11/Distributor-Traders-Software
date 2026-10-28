import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function AreaSalesReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("total_sales");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchAreaSales();
  }, [filters]);

  const fetchAreaSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.fromDate) params.append("from_date", filters.fromDate);
      if (filters?.toDate) params.append("to_date", filters.toDate);

      const res = await fetch(`${API_BASE_URL}/reports/area-sales?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load area sales report:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search && !item.area_name.toLowerCase().includes(search.toLowerCase())) {
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
  const totalBalance = filteredData.reduce((s, i) => s + Number(i.total_balance || 0), 0);
  const totalInvoices = filteredData.reduce((s, i) => s + Number(i.invoices_count || 0), 0);

  const columns = [
    { label: "Area / Route", key: "area_name" },
    { label: "City", key: "city" },
    { label: "Customers", key: "customer_count" },
    { label: "Invoices", key: "invoices_count" },
    { label: "Total Sales", key: "total_sales" },
    { label: "Paid", key: "total_paid" },
    { label: "Outstanding Udhar", key: "total_balance" },
  ];

  const exportRows = sortedData.map((item) => ({
    area_name: item.area_name,
    city: item.city || "Hyderabad",
    customer_count: item.customer_count,
    invoices_count: item.invoices_count,
    total_sales: fmt(item.total_sales),
    total_paid: fmt(item.total_paid),
    total_balance: fmt(item.total_balance),
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
        title="Hyderabad Area Wise Sales Report"
        columns={columns}
        rows={exportRows}
      />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Area Sales</p>
          <h2 className="text-2xl font-bold text-[#16a34a]">{fmt(totalSales)}</h2>
          <span className="text-xs text-[#64748b]">{totalInvoices} total bills</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Recovery / Paid</p>
          <h2 className="text-2xl font-bold text-[#2563eb]">{fmt(totalPaid)}</h2>
          <span className="text-xs text-[#64748b]">Collected from areas</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Pending Area Udhaar</p>
          <h2 className="text-2xl font-bold text-[#d97706]">{fmt(totalBalance)}</h2>
          <span className="text-xs text-amber-600 font-medium">To be recovered</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Covered Areas</p>
          <h2 className="text-2xl font-bold text-[#1e293b]">
            {filteredData.length} Sectors
          </h2>
          <span className="text-xs text-[#64748b]">Hyderabad region</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search Hyderabad area (e.g. Latifabad, Qasimabad)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:outline-none focus:border-[#1e3a8a]"
          />
          <span className="text-xs text-[#64748b]">
            Showing <strong>{sortedData.length}</strong> areas
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#64748b]">
            Loading Area Wise Sales Report...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1e293b]">
              <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0] uppercase">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("area_name")}
                  >
                    Area / Route {sortField === "area_name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="p-3.5">City</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("customer_count")}
                  >
                    Customers {sortField === "customer_count" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
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
                    Paid / Recovered {sortField === "total_paid" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("total_balance")}
                  >
                    Pending Udhar {sortField === "total_balance" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#64748b]">
                      No area sales records found for this period.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="p-3.5 font-bold text-[#1e293b]">
                        📍 {item.area_name}
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs bg-[#dbeafe] text-[#1e3a8a] px-2 py-0.5 rounded font-medium">
                          {item.city || "Hyderabad"}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-[#4338ca]">
                        {item.customer_count}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {item.invoices_count}
                      </td>
                      <td className="p-3.5 font-bold text-[#16a34a]">
                        {fmt(item.total_sales)}
                      </td>
                      <td className="p-3.5 font-semibold text-[#2563eb]">
                        {fmt(item.total_paid)}
                      </td>
                      <td className="p-3.5 font-bold text-[#d97706]">
                        {fmt(item.total_balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {sortedData.length > 0 && (
                <tfoot className="bg-[#f1f5f9] font-bold border-t-2 border-[#cbd5e1]">
                  <tr>
                    <td className="p-3.5" colSpan="2">
                      Total
                    </td>
                    <td className="p-3.5 text-[#4338ca]">
                      {filteredData.reduce((s, i) => s + Number(i.customer_count || 0), 0)}
                    </td>
                    <td className="p-3.5">{totalInvoices}</td>
                    <td className="p-3.5 text-[#16a34a]">{fmt(totalSales)}</td>
                    <td className="p-3.5 text-[#2563eb]">{fmt(totalPaid)}</td>
                    <td className="p-3.5 text-[#d97706]">{fmt(totalBalance)}</td>
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
