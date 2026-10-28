import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function AreaRecoveryReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("total_collected");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchAreaRecovery();
  }, [filters]);

  const fetchAreaRecovery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.fromDate) params.append("from_date", filters.fromDate);
      if (filters?.toDate) params.append("to_date", filters.toDate);

      const res = await fetch(
        `${API_BASE_URL}/reports/area-recovery?${params.toString()}`
      );
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load area recovery report:", e);
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

  // Totals
  const totalCustomers = filteredData.reduce((s, i) => s + Number(i.customers_count || 0), 0);
  const totalRecovery = filteredData.reduce((s, i) => s + Number(i.recovery_amount || 0), 0);
  const totalInvoiceCash = filteredData.reduce((s, i) => s + Number(i.invoice_cash || 0), 0);
  const totalCollected = filteredData.reduce((s, i) => s + Number(i.total_collected || 0), 0);
  const totalLiveUdhar = filteredData.reduce((s, i) => s + Number(i.current_udhar || 0), 0);
  const totalRecoveryCount = filteredData.reduce((s, i) => s + Number(i.recovery_count || 0), 0);

  const topArea = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => Number(b.total_collected) - Number(a.total_collected))[0];
  }, [data]);

  const columns = [
    { label: "Area / Route", key: "area_name" },
    { label: "City", key: "city" },
    { label: "Customers", key: "customers_count" },
    { label: "Recovery Received", key: "recovery_amount" },
    { label: "Counter Cash", key: "invoice_cash" },
    { label: "Total Cash Collected", key: "total_collected" },
    { label: "Current Live Udhaar", key: "current_udhar" },
    { label: "Recovery Entries", key: "recovery_count" },
  ];

  const exportRows = sortedData.map((item) => ({
    area_name: item.area_name,
    city: item.city || "Hyderabad",
    customers_count: item.customers_count,
    recovery_amount: fmt(item.recovery_amount),
    invoice_cash: fmt(item.invoice_cash),
    total_collected: fmt(item.total_collected),
    current_udhar: fmt(item.current_udhar),
    recovery_count: item.recovery_count,
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
        title="Hyderabad Area Wise Recovery & Outstanding Report"
        columns={columns}
        rows={exportRows}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Total Cash Collected in Period
          </p>
          <h2 className="text-2xl font-black text-emerald-600 mt-1">
            {fmt(totalCollected)}
          </h2>
          <p className="text-xs text-emerald-700 font-medium mt-1">
            {fmt(totalRecovery)} market recovery + {fmt(totalInvoiceCash)} counter cash
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Actual Live Market Udhaar
          </p>
          <h2 className="text-2xl font-black text-amber-600 mt-1">
            {fmt(totalLiveUdhar)}
          </h2>
          <p className="text-xs text-amber-700 font-medium mt-1">
            Asal baqi udhaar (Customer ledger balance)
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Top Recovery Area
          </p>
          <h2 className="text-xl font-bold text-[#1e3a8a] mt-1 truncate">
            {topArea && Number(topArea.total_collected) > 0 ? `📍 ${topArea.area_name}` : "—"}
          </h2>
          <p className="text-xs text-blue-700 font-medium mt-1">
            {topArea && Number(topArea.total_collected) > 0 ? fmt(topArea.total_collected) : "No recovery in period"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            Covered Customers
          </p>
          <h2 className="text-2xl font-black text-[#1e293b] mt-1">
            {totalCustomers} Shops
          </h2>
          <p className="text-xs text-[#64748b] mt-1">
            Across {filteredData.length} Hyderabad areas
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Hyderabad area (e.g. Latifabad, Qasimabad, Naseem Nagar)..."
          className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1e293b] focus:outline-blue-600"
        />
      </div>

      {/* Area Recovery Table */}
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
                    Loading area recovery report...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-[#64748b]">
                    No recovery data found for the selected filters.
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr key={row.area_id ?? `unassigned-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-bold text-[#1e293b] whitespace-nowrap">
                      📍 {row.area_name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {row.city}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {row.customers_count}
                    </td>
                    <td className="px-4 py-3.5 text-emerald-700 font-bold whitespace-nowrap">
                      {fmt(row.recovery_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-blue-700 font-medium whitespace-nowrap">
                      {fmt(row.invoice_cash)}
                    </td>
                    <td className="px-4 py-3.5 text-emerald-800 font-black whitespace-nowrap">
                      {fmt(row.total_collected)}
                    </td>
                    <td className="px-4 py-3.5 font-bold whitespace-nowrap">
                      {row.current_udhar > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {fmt(row.current_udhar)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Rs. 0 (Clear)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {row.recovery_count} entries
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {sortedData.length > 0 && (
              <tfoot>
                <tr className="bg-[#1e3a8a] font-bold text-white text-xs">
                  <td colSpan={2} className="px-4 py-4 text-white">
                    Total ({sortedData.length} Areas)
                  </td>
                  <td className="px-4 py-4 text-white">{totalCustomers}</td>
                  <td className="px-4 py-4 text-emerald-300 whitespace-nowrap">{fmt(totalRecovery)}</td>
                  <td className="px-4 py-4 text-blue-200 whitespace-nowrap">{fmt(totalInvoiceCash)}</td>
                  <td className="px-4 py-4 text-emerald-300 whitespace-nowrap">{fmt(totalCollected)}</td>
                  <td className="px-4 py-4 text-yellow-300 whitespace-nowrap">{fmt(totalLiveUdhar)}</td>
                  <td className="px-4 py-4 text-white">{totalRecoveryCount} entries</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
