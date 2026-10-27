import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function InvoiceReport({ filters }) {
  const { invoices, customers } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("date");

  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return invoices.filter((invoice) => {
      const customer =
        customers.find((c) => c.id === invoice.customerId)?.name || "";

      if (
        search &&
        !customer.toLowerCase().includes(search.toLowerCase()) &&
        !(invoice.invoice || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.customer &&
        Number(filters.customer) !== Number(invoice.customerId)
      ) {
        return false;
      }

      if (filters.fromDate && invoice.date < filters.fromDate) {
        return false;
      }

      if (filters.toDate && invoice.date > filters.toDate) {
        return false;
      }

      if (
        filters.month &&
        invoice.date.substring(5, 7) !==
          String(filters.month).padStart(2, "0")
      ) {
        return false;
      }

      if (
        filters.year &&
        invoice.date.substring(0, 4) !== String(filters.year)
      ) {
        return false;
      }

      // Hide fully returned invoices
      const isFullyReturned = invoice.items?.length > 0 && invoice.items.every(i => i.qty === i.returnedQty);
      if (isFullyReturned) {
        return false;
      }

      return true;
    });
  }, [invoices, customers, filters, search]);

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

  const totalInvoices = filteredData.length;

  const totalSales = filteredData.reduce(
    (s, i) => s + Number(i.total),
    0
  );

  const totalPaid = filteredData.reduce(
    (s, i) => s + Number(i.paid),
    0
  );

  const totalPending = filteredData.reduce(
    (s, i) => s + Number(i.balance),
    0
  );

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
    { label: "Invoice #", key: "invoice" },
    { label: "Customer", key: "customer" },
    { label: "Date", key: "date" },
    { label: "Total", key: "total" },
    { label: "Paid", key: "paid" },
    { label: "Balance", key: "balance" },
  ];

const rows = paginatedData.map((invoice) => ({
  invoice: invoice.invoiceNo,
  customer:
    customers.find((c) => c.id === invoice.customerId)?.name || "-",
  date: invoice.date,
  total: fmt(invoice.total),
  paid: fmt(invoice.paid),
  balance: fmt(invoice.balance),
}));

return (
    <div className="space-y-6">

      <ExportButtons
        title="Invoice Report"
        columns={columns}
        rows={rows}
      />

      {/* Summary */}

      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Total Invoices
          </p>

          <h2 className="text-3xl font-bold text-[#1e3a8a]">
            {totalInvoices}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Total Sales
          </p>

          <h2 className="text-3xl font-bold text-green-400">
            {fmt(totalSales)}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Paid Amount
          </p>

          <h2 className="text-3xl font-bold text-blue-400">
            {fmt(totalPaid)}
          </h2>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <p className="text-sm text-[#64748b]">
            Pending Amount
          </p>

          <h2 className="text-3xl font-bold text-red-400">
            {fmt(totalPending)}
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
        placeholder="Search Invoice or Customer..."
        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b] outline-none focus:border-[#6c63ff]"
      />

      {/* Table */}

      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">

        <div className="overflow-auto max-h-[650px]">

          <table className="w-full">

            <thead className="sticky top-0 bg-[#1b2233] z-20 text-white">

              <tr className="border-b border-[#e2e8f0]">

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
                    No Invoices Found
                  </td>
                </tr>
              )}

            </tbody>

            {/* Sticky Footer */}

            <tfoot className="sticky bottom-0 bg-[#f8fafc] border-t border-[#e2e8f0]">

              <tr className="font-bold">

                <td colSpan={3} className="px-4 py-4">
                  Totals
                </td>

                <td className="px-4 py-4 text-green-400">
                  {fmt(totalSales)}
                </td>

                <td className="px-4 py-4 text-blue-400">
                  {fmt(totalPaid)}
                </td>

                <td className="px-4 py-4 text-red-400">
                  {fmt(totalPending)}
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
