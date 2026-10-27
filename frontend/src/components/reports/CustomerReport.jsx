import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function CustomerReport({ filters }) {
  const { customers } = useApp();

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");

  const [sortField, setSortField] = useState("name");

  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ==========================================
  // Filter
  // ==========================================

  const filteredData = useMemo(() => {
    return customers.filter((customer) => {

      if (
        search &&
        !customer.name
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        !customer.phone
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        typeFilter !== "all" &&
        customer.type !== typeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    customers,
    search,
    typeFilter,
    filters,
  ]);

  // ==========================================
  // Sorting
  // ==========================================

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

  // ==========================================
  // Summary
  // ==========================================

  const totalCustomers = filteredData.length;

  const totalPurchase = filteredData.reduce(
    (sum, c) => sum + Number(c.totalBuy),
    0
  );

  const totalOutstanding = filteredData.reduce(
    (sum, c) => sum + Number(c.balance),
    0
  );

  const wholesaleCustomers = filteredData.filter(
    (c) => c.type === "wholesale"
  ).length;

  const retailCustomers = filteredData.filter(
    (c) => c.type === "retail"
  ).length;

  // ==========================================
  // Sorting Handler
  // ==========================================

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

  // ==========================================
  // Pagination
  // ==========================================

  const totalPages = Math.ceil(
    sortedData.length / rowsPerPage
  );

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // ==========================================
  // Columns
  // ==========================================

  const columns = [
    {
      label: "Customer",
      key: "name",
    },
    {
      label: "Phone",
      key: "phone",
    },
    {
      label: "Type",
      key: "type",
    },
    {
      label: "Purchase",
      key: "totalBuy",
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

  // ==========================================
  // Export Rows
  // ==========================================

  const rows = paginatedData.map((customer) => ({
    name: customer.name,
    phone: customer.phone,
    type: customer.type,
    totalBuy: fmt(customer.totalBuy),
    balance: fmt(customer.balance),
    status:
      customer.balance > 0
        ? "Due"
        : "Paid",
  }));

  return (
    <div className="space-y-6">

      {/* Export */}

      <ExportButtons
        title="Customer Report"
        columns={columns}
        rows={rows}
      />

      {/* Summary */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Total Customers
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            {totalCustomers}
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
            Outstanding
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            {fmt(totalOutstanding)}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Wholesale
          </p>

          <h2 className="text-3xl font-bold text-yellow-400 mt-2">
            {wholesaleCustomers}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Retail
          </p>

          <h2 className="text-3xl font-bold text-purple-400 mt-2">
            {retailCustomers}
          </h2>
        </div>

      </div>

      {/* Search & Filter */}

      <div className="flex flex-col md:flex-row gap-4">

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search customer name or phone..."
          className="flex-1 bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b]"
        />

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b]"
        >
          <option value="all">All Customers</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </select>

      </div>

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
                              Due
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
                    No Customers Found
                  </td>

                </tr>

              )}

            </tbody>

            <tfoot>

              <tr className="bg-[#1b2233] font-bold">

                <td
                  colSpan={3}
                  className="px-4 py-4"
                >
                  Totals
                </td>

                <td className="px-4 py-4 text-green-400">
                  {fmt(totalPurchase)}
                </td>

                <td className="px-4 py-4 text-red-400">
                  {fmt(totalOutstanding)}
                </td>

                <td className="px-4 py-4 text-cyan-400">
                  {totalCustomers}
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
            className="px-4 py-2 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-medium border border-[#cbd5e1] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ◀ Prev
          </button>

          <button
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-medium border border-[#cbd5e1] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next ▶
          </button>

        </div>

      </div>

    </div>

  );
}  
