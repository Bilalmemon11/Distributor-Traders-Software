import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function SaleReturnReport({ filters }) {
  const { saleReturns, customers, invoices } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("date");

  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return saleReturns.filter((item) => {
      const customer =
        customers.find((c) => c.id === item.customerId)?.name || "";

      if (
        search &&
        !customer.toLowerCase().includes(search.toLowerCase()) &&
        !(item.returnNo || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.customer &&
        Number(filters.customer) !== Number(item.customerId)
      ) {
        return false;
      }

      if (filters.fromDate && item.date < filters.fromDate) return false;

      if (filters.toDate && item.date > filters.toDate) return false;

      if (
        filters.month &&
        item.date.substring(5, 7) !== String(filters.month).padStart(2, "0")
      ) {
        return false;
      }

      if (
        filters.year &&
        item.date.substring(0, 4) !== String(filters.year)
      ) {
        return false;
      }

      return true;
    });
  }, [saleReturns, customers, filters, search]);

  const sortedData = useMemo(() => {
    const data = [...filteredData];

    data.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "customer") {
        aValue =
          customers.find((c) => c.id === a.customerId)?.name || "";

        bValue =
          customers.find((c) => c.id === b.customerId)?.name || "";
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
  }, [filteredData, customers, sortField, sortDirection]);

  const totalReturnAmount = filteredData.reduce(
    (sum, i) => sum + Number(i.total || 0),
    0
  );

const totalQty = filteredData.reduce(

  (sum, r) =>
    sum +
    (r.items || []).reduce(
      (s, i) => s + Number(i.qty || 0),
      0
    ),

  0

);
  const averageReturn =
    filteredData.length > 0
      ? totalReturnAmount / filteredData.length
      : 0;

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

const columns = [

  {
    label: "Return #",
    key: "returnNo",
  },

  {
    label: "Invoice",
    key: "invoice",
  },

  {
    label: "Customer",
    key: "customer",
  },

  {
    label: "Date",
    key: "date",
  },

  {
    label: "Qty",
    key: "qty",
  },

  {
    label: "Amount",
    key: "total",
  },

];

const rows = paginatedData.map((item) => ({

  returnNo: item.returnNo || item.id,

  invoice: item.invoiceNo || "-",

  customer: item.customerName || "-",

  date: item.date,

  qty: (item.items || []).reduce(
    (sum, i) => sum + Number(i.qty || 0),
    0
  ),

  total: fmt(item.total),

}));

return (
    <div className="space-y-6">

      <ExportButtons
        title="Sale Return Report"
        columns={columns}
        rows={rows}
      />

      {/* Summary */}

      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">Total Returns</p>

          <h2 className="text-3xl font-bold text-red-400">
            {filteredData.length}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">Returned Amount</p>

          <h2 className="text-3xl font-bold text-yellow-400">
            {fmt(totalReturnAmount)}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">Returned Qty</p>

          <h2 className="text-3xl font-bold text-blue-400">
            {totalQty}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">Average Return</p>

          <h2 className="text-3xl font-bold text-green-400">
            {fmt(averageReturn)}
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
        placeholder="Search Return # or Customer..."
        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b] outline-none focus:border-[#6c63ff]"
      />

      {/* Table */}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">

        <div className="overflow-auto max-h-[650px]">

          <table className="w-full">

            <thead className="sticky top-0 z-20">

              <tr className="border-b border-[#e2e8f0] bg-blue-600">

                {columns.map((column) => (

                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="cursor-pointer select-none px-4 py-3 text-left text-white hover:text-slate-200 whitespace-nowrap"
                  >

                    {column.label}

                    {sortField === column.key &&
                      (sortDirection === "asc" ? " ▲" : " ▼")}

                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {rows.map((row, index) => (

                <tr
                  key={index}
                  className="border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition"
                >

                  {columns.map((column) => (

                    <td
                      key={column.key}
                      className="px-4 py-3 whitespace-nowrap"
                    >
                      {row[column.key]}
                    </td>

                  ))}

                </tr>

              ))}
                {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-[#64748b]"
                  >
                    No Sale Returns Found
                  </td>
                </tr>
              )}

            </tbody>

            {/* Sticky Footer */}

            <tfoot className="sticky bottom-0 bg-[#f8fafc] border-t border-[#e2e8f0]">

              <tr className="font-bold">

                <td colSpan={4} className="px-4 py-4">
                  Totals
                </td>

                <td className="px-4 py-4 text-blue-400">
                  {totalQty}
                </td>

                <td className="px-4 py-4 text-red-400">
                  {fmt(totalReturnAmount)}
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
