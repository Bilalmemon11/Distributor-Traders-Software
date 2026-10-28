import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function PurchaseReturnReport({ filters }) {
  const { purchaseReturns } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("date");

  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  // -----------------------------
  // Filter
  // -----------------------------

  const filteredData = useMemo(() => {
    return purchaseReturns.filter((r) => {
      const vendor = (r.vendorName || "").toLowerCase();

      if (
        search &&
        !vendor.includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        filters?.fromDate &&
        r.date < filters.fromDate
      ) {
        return false;
      }

      if (
        filters?.toDate &&
        r.date > filters.toDate
      ) {
        return false;
      }

      if (
        filters?.month &&
        r.date.substring(5, 7) !== filters.month
      ) {
        return false;
      }

      if (
        filters?.year &&
        r.date.substring(0, 4) !==
        String(filters.year)
      ) {
        return false;
      }

      return true;
    });
  }, [purchaseReturns, search, filters]);

  // -----------------------------
  // Sorting
  // -----------------------------

  const sortedData = useMemo(() => {
    const data = [...filteredData];

    data.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

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
  }, [
    filteredData,
    sortField,
    sortDirection,
  ]);

  // -----------------------------
  // Totals
  // -----------------------------

  const totalReturn = filteredData.reduce(
    (sum, r) => sum + Number(r.total),
    0
  );

  const totalItems = filteredData.reduce(
    (sum, r) => sum + (r.items?.length || 0),
    0
  );

  const totalQty = filteredData.reduce(
    (sum, r) =>
      sum +
      (r.items || []).reduce(
        (s, i) => s + Number(i.qty),
        0
      ),
    0
  );

  // -----------------------------
  // Sorting Handler
  // -----------------------------

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // -----------------------------
  // Pagination
  // -----------------------------

  const totalPages = Math.ceil(
    sortedData.length / rowsPerPage
  );

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // -----------------------------
  // Table Columns
  // -----------------------------

  const columns = [
    { label: "Return #", key: "returnNo" },
    { label: "Vendor", key: "vendorName" },
    { label: "Date", key: "date" },
    { label: "Items", key: "items" },
    { label: "Qty", key: "qty" },
    { label: "Total", key: "total" },
  ];

  // -----------------------------
  // Export Rows
  // -----------------------------

  const rows = paginatedData.map((r) => ({
    returnNo: r.returnNo,
    vendorName: r.vendorName || "-",
    date: r.date,
    items: r.items.length,
    qty: r.items.reduce(
      (s, i) => s + Number(i.qty),
      0
    ),
    total: fmt(r.total),
  }));

  return (
    <div className="space-y-6">

      {/* Export */}

      <ExportButtons
        title="Purchase Return Report"
        columns={columns}
        rows={rows}
      />

      {/* Summary */}

      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Total Return Amount
          </p>

          <h2 className="text-3xl font-bold text-red-400">
            {fmt(totalReturn)}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Returned Items
          </p>

          <h2 className="text-3xl font-bold text-yellow-400">
            {totalItems}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Returned Quantity
          </p>

          <h2 className="text-3xl font-bold text-green-400">
            {totalQty}
          </h2>
        </div>

      </div>

      {/* Search */}

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search Vendor..."
        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b]"
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
                    className="cursor-pointer whitespace-nowrap px-4 py-4 text-left text-white hover:text-slate-200"
                  >

                    {col.label}

                    {sortField === col.key &&
                      (sortDirection === "asc"
                        ? " ▲"
                        : " ▼")}

                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {rows.length > 0 ? (

                rows.map((row, index) => (

                  <tr
                    key={index}
                    className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]"
                  >

                    {columns.map((col) => (

                      <td
                        key={col.key}
                        className="px-4 py-3 whitespace-nowrap"
                      >
                        {row[col.key]}
                      </td>

                    ))}

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={6}
                    className="text-center py-10 text-[#64748b]"
                  >
                    No Purchase Returns Found
                  </td>

                </tr>

              )}

            </tbody>

            <tfoot>

              <tr className="bg-[#1b2233] font-bold text-white">

                <td
                  colSpan={3}
                  className="px-4 py-4 text-white"
                >
                  Totals
                </td>

                <td className="px-4 py-4">
                  {totalItems}
                </td>

                <td className="px-4 py-4 text-yellow-400">
                  {totalQty}
                </td>

                <td className="px-4 py-4 text-red-400">
                  {fmt(totalReturn)}
                </td>

              </tr>

            </tfoot>

          </table>

        </div>
      </div>
      {/* Pagination */}

      <div className="flex items-center justify-between px-5 py-4 border-t border-[#e2e8f0]">

        {/* Rows */}

        <div className="flex items-center gap-3">

          <span className="text-sm text-[#64748b]">
            Rows
          </span>

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

        {/* Showing */}

        <div className="text-sm text-[#64748b]">

          {sortedData.length === 0
            ? "Showing 0 of 0"
            : `Showing ${(currentPage - 1) * rowsPerPage + 1}-${Math.min(
              currentPage * rowsPerPage,
              sortedData.length
            )} of ${sortedData.length}`}

        </div>

        {/* Buttons */}

        <div className="flex gap-2">

          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((p) => p - 1)
            }
            className="px-4 py-2 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-medium border border-[#cbd5e1] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ◀ Prev
          </button>

          <button
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              setCurrentPage((p) => p + 1)
            }
            className="px-4 py-2 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-medium border border-[#cbd5e1] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next ▶
          </button>

        </div>

      </div>

    </div>



  );
}
