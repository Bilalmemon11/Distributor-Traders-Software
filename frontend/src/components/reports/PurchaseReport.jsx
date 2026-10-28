import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function PurchaseReport({ filters }) {
  const { purchases, vendors } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("date");

  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return purchases.filter((purchase) => {
      const vendor =
        vendors.find((v) => v.id === purchase.vendorId)?.name || "";

      if (search && !vendor.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (filters.vendor && Number(filters.vendor) !== purchase.vendorId) {
        return false;
      }

      if (filters.fromDate && purchase.date < filters.fromDate) {
        return false;
      }

      if (filters.toDate && purchase.date > filters.toDate) {
        return false;
      }

      if (filters.month && purchase.date.substring(5, 7) !== filters.month) {
        return false;
      }

      if (
        filters.year &&
        purchase.date.substring(0, 4) !== String(filters.year)
      ) {
        return false;
      }

      // Hide fully returned purchases
      const isFullyReturned = purchase.items?.length > 0 && purchase.items.every(i => i.qty === i.returnedQty);
      if (isFullyReturned) {
        return false;
      }

      return true;
    });
  }, [purchases, vendors, filters, search]);

  const sortedData = useMemo(() => {
    const data = [...filteredData];

    data.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "vendor") {
        aValue = vendors.find((v) => v.id === a.vendorId)?.name || "";

        bValue = vendors.find((v) => v.id === b.vendorId)?.name || "";
      }

      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });

    return data;
  }, [filteredData, vendors, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);

      setSortDirection("asc");
    }
  };

  const columns = [
    {
      label: "Purchase #",
      key: "purchase",
    },

    {
      label: "Vendor",
      key: "vendor",
    },

    {
      label: "Date",
      key: "date",
    },

    {
      label: "Total",
      key: "total",
    },

    {
      label: "Paid",
      key: "paid",
    },

    {
      label: "Balance",
      key: "balance",
    },
  ];

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,

    currentPage * rowsPerPage,
  );

  const totalPurchase = filteredData.reduce(
    (sum, p) => sum + Number(p.total || 0),
    0,
  );

  const totalPaid = filteredData.reduce(
    (sum, p) => sum + Number(p.paid || 0),
    0,
  );

  const totalPending = filteredData.reduce(
    (sum, p) => sum + Number(p.balance || 0),
    0,
  );

  const rows = paginatedData.map((p) => ({
    purchase: p.poNo,
    vendor: p.vendorName || "-",
    date: p.date,
    total: fmt(p.total),
    paid: fmt(p.paid),
    balance: fmt(p.balance),
  }));

  return (
    <div className="space-y-6">
      <ExportButtons title="Purchase Report" columns={columns} rows={rows} />

      {/* Summary Cards */}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Purchase</p>

          <h2 className="text-3xl font-bold text-blue-400">
            {fmt(totalPurchase)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Paid</p>

          <h2 className="text-3xl font-bold text-green-400">
            {fmt(totalPaid)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Remaining</p>

          <h2 className="text-3xl font-bold text-red-400">
            {fmt(totalPending)}
          </h2>
        </div>
      </div>

      {/* Search */}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Vendor..."
        className="w-full bg-white
      border border-[#e2e8f0]
      rounded-lg
      px-4
      py-3
      text-[#1e293b]"
      />

      {/* Table */}

      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-auto max-h-[650px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#1b2233] z-20 text-white">
              <tr className="border-b border-[#e2e8f0]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer
                  px-4
                  py-4
                  text-left
                  text-white
                  hover:text-[#1e293b]
                  whitespace-nowrap"
                  >
                    {col.label}

                    {sortField === col.key &&
                      (sortDirection === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b
                border-[#e2e8f0]
                hover:bg-[#f8fafc]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="bg-[#1b2233] font-bold text-white">
                <td colSpan={3} className="px-4 py-4 text-white">
                  Totals
                </td>

                <td className="px-4 py-4 text-white">
                  {fmt(totalPurchase)}
                </td>

                <td className="px-4 py-4 text-white">{fmt(totalPaid)}</td>

                <td className="px-4 py-4 text-white">{fmt(totalPending)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#64748b]">Rows</span>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded px-3 py-1 text-[#1e293b]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="text-sm text-[#64748b]">
          Showing {(currentPage - 1) * rowsPerPage + 1} -
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of{" "}
          {sortedData.length}
        </div>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-[#2a3248] text-white hover:bg-[#3b4564] disabled:opacity-40 transition"
          >
            Prev
          </button>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-[#2a3248] text-white hover:bg-[#3b4564] disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
