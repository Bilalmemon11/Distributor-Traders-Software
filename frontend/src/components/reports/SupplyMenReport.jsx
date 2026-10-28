import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function SupplyMenReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("total_delivered_volume");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchPerformance();
  }, [filters]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.fromDate) params.append("from_date", filters.fromDate);
      if (filters?.toDate) params.append("to_date", filters.toDate);

      const res = await fetch(
        `${API_BASE_URL}/reports/supply-men-performance?${params.toString()}`
      );
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load supply men report:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchPhone = item.phone?.toLowerCase().includes(query);
        const matchVehicle = item.vehicle_no?.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchVehicle) return false;
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

  // Aggregate totals
  const totalInvoices = filteredData.reduce((s, i) => s + Number(i.total_invoices || 0), 0);
  const totalDelivered = filteredData.reduce((s, i) => s + Number(i.delivered_count || 0), 0);
  const totalPending = filteredData.reduce((s, i) => s + Number(i.pending_count || 0), 0);
  const totalReturned = filteredData.reduce((s, i) => s + Number(i.returned_count || 0), 0);
  const totalVolume = filteredData.reduce((s, i) => s + Number(i.total_delivered_volume || 0), 0);
  const totalCollected = filteredData.reduce((s, i) => s + Number(i.total_collected_cash || 0), 0);
  const totalPendingCash = filteredData.reduce((s, i) => s + Number(i.total_pending_cash || 0), 0);

  const columns = [
    { label: "Supply Man / Driver", key: "name" },
    { label: "Phone", key: "phone" },
    { label: "Vehicle / Loader", key: "vehicle_no" },
    { label: "Total Invoices", key: "total_invoices" },
    { label: "Delivered", key: "delivered_count" },
    { label: "Pending / On Way", key: "pending_count" },
    { label: "Returned", key: "returned_count" },
    { label: "Delivery Volume", key: "total_delivered_volume" },
    { label: "Cash Collected", key: "total_collected_cash" },
    { label: "Pending Cash", key: "total_pending_cash" },
    { label: "Success Rate", key: "success_rate" },
  ];

  const exportRows = sortedData.map((item) => {
    const totalInv = Number(item.total_invoices || 0);
    const deliv = Number(item.delivered_count || 0);
    const rate = totalInv > 0 ? Math.round((deliv / totalInv) * 100) : 0;

    return {
      name: item.name,
      phone: item.phone || "—",
      vehicle_no: item.vehicle_no || "—",
      total_invoices: item.total_invoices,
      delivered_count: item.delivered_count,
      pending_count: item.pending_count,
      returned_count: item.returned_count,
      total_delivered_volume: fmt(item.total_delivered_volume),
      total_collected_cash: fmt(item.total_collected_cash),
      total_pending_cash: fmt(item.total_pending_cash),
      success_rate: `${rate}%`,
    };
  });

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
        title="Supply Men Delivery & Dispatch Report"
        columns={columns}
        rows={exportRows}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Total Invoices Delivered
          </p>
          <h2 className="text-2xl font-black text-blue-600 mt-1">
            {totalDelivered} / {totalInvoices}
          </h2>
          <p className="text-xs text-[#64748b] mt-1">
            {totalPending} pending / on the road • {totalReturned} returned
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Total Delivery Volume
          </p>
          <h2 className="text-2xl font-black text-[#1e3a8a] mt-1">
            {fmt(totalVolume)}
          </h2>
          <p className="text-xs text-[#64748b] mt-1">
            Across {filteredData.length} drivers & counter staff
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Cash Collected by Staff
          </p>
          <h2 className="text-2xl font-black text-emerald-600 mt-1">
            {fmt(totalCollected)}
          </h2>
          <p className="text-xs text-emerald-700 font-medium mt-1">
            Received from shops on delivery
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Remaining Cash to Collect
          </p>
          <h2 className="text-2xl font-black text-amber-600 mt-1">
            {fmt(totalPendingCash)}
          </h2>
          <p className="text-xs text-amber-700 font-medium mt-1">
            Pending udhaar recovery on invoices
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by driver name, phone number, or vehicle number..."
          className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-blue-600"
        />
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#1e3a8a] z-20 text-white">
              <tr className="border-b border-[#e2e8f0]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer px-4 py-3.5 text-left text-white hover:text-slate-200 whitespace-nowrap text-xs font-bold uppercase tracking-wider"
                  >
                    {col.label}
                    {sortField === col.key && (sortDirection === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-[#64748b]">
                    Loading delivery performance report...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-[#64748b]">
                    No supply men delivery data found for the selected period.
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => {
                  const totalInv = Number(row.total_invoices || 0);
                  const deliv = Number(row.delivered_count || 0);
                  const rate = totalInv > 0 ? Math.round((deliv / totalInv) * 100) : 0;
                  const isDefault = row.id === 1 || row.name?.toLowerCase().includes("self");

                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-[#1e293b] whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <span>🚚</span> {row.name}
                          {isDefault && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                              Default (Counter)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-medium">
                        {row.vehicle_no ? `🚗 ${row.vehicle_no}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {row.total_invoices}
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">
                        {row.delivered_count}
                      </td>
                      <td className="px-4 py-3 text-blue-700 font-medium">
                        {row.pending_count}
                      </td>
                      <td className="px-4 py-3 text-rose-700 font-medium">
                        {row.returned_count}
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900 whitespace-nowrap">
                        {fmt(row.total_delivered_volume)}
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold whitespace-nowrap">
                        {fmt(row.total_collected_cash)}
                      </td>
                      <td className="px-4 py-3 text-amber-600 font-bold whitespace-nowrap">
                        {fmt(row.total_pending_cash)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            rate >= 80
                              ? "bg-emerald-100 text-emerald-800"
                              : rate >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {sortedData.length > 0 && (
              <tfoot>
                <tr className="bg-[#1e3a8a] font-bold text-white text-xs">
                  <td colSpan={3} className="px-4 py-4 text-white">
                    Totals ({sortedData.length} Staff)
                  </td>
                  <td className="px-4 py-4 text-white">{totalInvoices}</td>
                  <td className="px-4 py-4 text-emerald-300">{totalDelivered}</td>
                  <td className="px-4 py-4 text-blue-200">{totalPending}</td>
                  <td className="px-4 py-4 text-rose-200">{totalReturned}</td>
                  <td className="px-4 py-4 text-white whitespace-nowrap">{fmt(totalVolume)}</td>
                  <td className="px-4 py-4 text-emerald-300 whitespace-nowrap">{fmt(totalCollected)}</td>
                  <td className="px-4 py-4 text-yellow-300 whitespace-nowrap">{fmt(totalPendingCash)}</td>
                  <td className="px-4 py-4 text-white">
                    {totalInvoices > 0 ? `${Math.round((totalDelivered / totalInvoices) * 100)}%` : "0%"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
