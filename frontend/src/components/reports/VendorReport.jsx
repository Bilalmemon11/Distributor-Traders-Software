import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function VendorReport({ filters }) {

  const { vendors } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("name");

  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ======================================
  // Filter
  // ======================================

  const filteredData = useMemo(() => {

    return vendors.filter((vendor) => {

      if (
        search &&
        !vendor.name.toLowerCase().includes(search.toLowerCase()) &&
        !vendor.phone.toLowerCase().includes(search.toLowerCase()) &&
        !vendor.city.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;

    });

  }, [vendors, search, filters]);

  // ======================================
  // Sorting
  // ======================================

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

  // ======================================
  // Summary
  // ======================================

  const totalVendors = filteredData.length;

  const totalPurchase = filteredData.reduce(
    (sum, v) => sum + Number(v.totalPurchase),
    0
  );

  const totalPayable = filteredData.reduce(
    (sum, v) => sum + Number(v.balance),
    0
  );

  const uniqueCities = new Set(
    filteredData.map((v) => v.city)
  ).size;

  const avgPurchase = totalVendors
    ? totalPurchase / totalVendors
    : 0;

  // ======================================
  // Sorting
  // ======================================

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

  // ======================================
  // Pagination
  // ======================================

  const totalPages = Math.ceil(
    sortedData.length / rowsPerPage
  );

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // ======================================
  // Columns
  // ======================================

  const columns = [
    {
      label: "Vendor",
      key: "name",
    },
    {
      label: "Phone",
      key: "phone",
    },
    {
      label: "City",
      key: "city",
    },
    {
      label: "Purchase",
      key: "totalPurchase",
    },
    {
      label: "Balance",
      key: "balance",
    },
    {
      label: "Status",
      key: "status",
    },
  ];

  // ======================================
  // Export Rows
  // ======================================

  const rows = paginatedData.map((vendor) => ({

    name: vendor.name,

    phone: vendor.phone,

    city: vendor.city,

    totalPurchase: fmt(vendor.totalPurchase),

    balance: fmt(vendor.balance),

    status:
      vendor.balance > 0
        ? "Payable"
        : "Paid",

  }));
  return (
  <div className="space-y-6">

    {/* Export */}

    <ExportButtons
      title="Vendor Report"
      columns={columns}
      rows={rows}
    />

    {/* Summary */}

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">

        <p className="text-sm text-[#64748b]">
          Total Vendors
        </p>

        <h2 className="text-3xl font-bold text-cyan-400 mt-2">
          {totalVendors}
        </h2>

      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">

        <p className="text-sm text-[#64748b]">
          Total Purchase
        </p>

        <h2 className="text-3xl font-bold text-green-400 mt-2">
          {fmt(totalPurchase)}
        </h2>

      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">

        <p className="text-sm text-[#64748b]">
          Total Payable
        </p>

        <h2 className="text-3xl font-bold text-red-400 mt-2">
          {fmt(totalPayable)}
        </h2>

      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">

        <p className="text-sm text-[#64748b]">
          Cities
        </p>

        <h2 className="text-3xl font-bold text-yellow-400 mt-2">
          {uniqueCities}
        </h2>

      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">

        <p className="text-sm text-[#64748b]">
          Avg Purchase
        </p>

        <h2 className="text-3xl font-bold text-purple-400 mt-2">
          {fmt(avgPurchase)}
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
      placeholder="Search vendor, phone or city..."
      className="w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b]"
    />

    {/* Table */}

    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">

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

                      {col.key === "status" ? (

                        row.status === "Paid" ? (

                          <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold">
                            Paid
                          </span>

                        ) : (

                          <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-semibold">
                            Payable
                          </span>

                        )

                      ) : (

                        row[col.key]

                      )}

                    </td>

                  ))}

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center text-[#64748b]"
                >
                  No Vendors Found
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

              <td className="px-4 py-4 text-white">
                {fmt(totalPurchase)}
              </td>

              <td className="px-4 py-4 text-white">
                {fmt(totalPayable)}
              </td>

              <td className="px-4 py-4 text-white">
                {totalVendors}
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
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-[#2a3248] hover:bg-[#3b4564] text-white font-medium border border-[#3b4564] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ◀ Prev
          </button>

          <button
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-[#2a3248] hover:bg-[#3b4564] text-white font-medium border border-[#3b4564] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next ▶
          </button>

        </div>

      </div>

    </div>

  

);
}
