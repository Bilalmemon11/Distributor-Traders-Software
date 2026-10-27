import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function SalesReport({ filters }) {
  const { invoices, customers } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return invoices.filter((inv) => {
      const customer = customers.find((c) => c.id === inv.customerId);

      const customerName = customer?.name || "";

      if (
        search &&
        !customerName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (filters.customer && Number(filters.customer) !== inv.customerId) {
        return false;
      }

      if (filters.fromDate && inv.date < filters.fromDate) {
        return false;
      }

      if (filters.toDate && inv.date > filters.toDate) {
        return false;
      }

      if (filters.month && inv.date.substring(5, 7) !== filters.month) {
        return false;
      }

      if (filters.year && inv.date.substring(0, 4) !== String(filters.year)) {
        return false;
      }

      // Hide fully returned invoices
      const isFullyReturned = inv.items?.length > 0 && inv.items.every(i => i.qty === i.returnedQty);
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
        aValue = customers.find((c) => c.id === a.customerId)?.name || "";

        bValue = customers.find((c) => c.id === b.customerId)?.name || "";
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

  const totalSales = filteredData.reduce((s, i) => s + Number(i.total), 0);

  const totalPaid = filteredData.reduce((s, i) => s + Number(i.paid), 0);

  const totalPending = filteredData.reduce((s, i) => s + Number(i.balance), 0);

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
      <ExportButtons title="Sales Report" columns={columns} rows={rows} />

      {/* Summary */}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Sales</p>

          <h2 className="text-3xl font-bold text-green-400">
            {fmt(totalSales)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Paid</p>

          <h2 className="text-3xl font-bold text-blue-400">{fmt(totalPaid)}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Pending</p>

          <h2 className="text-3xl font-bold text-red-400">
            {fmt(totalPending)}
          </h2>
        </div>
      </div>

      {/* Search */}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Customer..."
        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b]"
      />

      {/* Table */}
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      <div className="overflow-auto max-h-[650px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#1b2233] z-20 text-white">
            <tr className="border-b border-[#e2e8f0]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className="cursor-pointer select-none px-4 py-3 text-left text-white hover:text-slate-200"
                >
                  {c.label}

                  {sortField === c.key &&
                    (sortDirection === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-b border-[#e2e8f0]/50 hover:bg-[#f8fafc]"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f8fafc] font-bold">
              <td colSpan={3} className="px-4 py-3">
                Totals
              </td>

              <td className="px-4 py-3 text-green-400">{fmt(totalSales)}</td>

              <td className="px-4 py-3 text-blue-400">{fmt(totalPaid)}</td>

              <td className="px-4 py-3 text-red-400">{fmt(totalPending)}</td>
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
