import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function ExpenseReport({ filters }) {
  const { expenses } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ==========================
  // FILTER
  // ==========================

  const filteredData = useMemo(() => {
    return expenses.filter((exp) => {

      if (
        search &&
        !(exp.description || "")
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        !(exp.category || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.category &&
        filters.category !== "all" &&
        exp.category !== filters.category
      ) {
        return false;
      }

      if (filters.fromDate && exp.date < filters.fromDate) {
        return false;
      }

      if (filters.toDate && exp.date > filters.toDate) {
        return false;
      }

      if (
        filters.month &&
        exp.date.substring(5, 7) !== filters.month
      ) {
        return false;
      }

      if (
        filters.year &&
        exp.date.substring(0, 4) !== String(filters.year)
      ) {
        return false;
      }

      return true;
    });
  }, [expenses, filters, search]);

  // ==========================
  // SORTING
  // ==========================

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

  }, [filteredData, sortField, sortDirection]);

  // ==========================
  // SUMMARY
  // ==========================

  const totalExpense = filteredData.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const averageExpense =
    filteredData.length > 0
      ? totalExpense / filteredData.length
      : 0;

  const highestExpense =
    filteredData.length > 0
      ? Math.max(...filteredData.map((e) => Number(e.amount)))
      : 0;

  const expenseCount = filteredData.length;

  // ==========================
  // SORT CLICK
  // ==========================

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

  // ==========================
  // TABLE COLUMNS
  // ==========================

  const columns = [
    {
      label: "Date",
      key: "date",
    },
    {
      label: "Category",
      key: "category",
    },
    {
      label: "Description",
      key: "description",
    },
    {
      label: "Amount",
      key: "amount",
    },
  ];
    // ==========================
  // PAGINATION
  // ==========================

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / rowsPerPage)
  );

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // ==========================
  // EXPORT DATA
  // ==========================

  const rows = paginatedData.map((exp) => ({
    date: exp.date,
    category: exp.category || "-",
    description: exp.description || "-",
    amount: fmt(exp.amount),
  }));

  // ==========================
  // JSX
  // ==========================

  return (
    <div className="space-y-6">

      <ExportButtons
        title="Expense Report"
        columns={columns}
        rows={rows}
      />

      {/* SUMMARY */}

      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Total Expenses
          </p>

          <h2 className="text-3xl font-bold text-red-400">
            {fmt(totalExpense)}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Average Expense
          </p>

          <h2 className="text-3xl font-bold text-blue-400">
            {fmt(averageExpense)}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Highest Expense
          </p>

          <h2 className="text-3xl font-bold text-amber-400">
            {fmt(highestExpense)}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <p className="text-sm text-[#64748b]">
            Total Entries
          </p>

          <h2 className="text-3xl font-bold text-green-400">
            {expenseCount}
          </h2>
        </div>

      </div>

      {/* SEARCH */}

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search description or category..."
        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-4 py-3 text-[#1e293b]"
      />

      {/* TABLE */}

      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">

        <div className="overflow-auto max-h-[600px]">

          <table className="w-full">

            <thead className="sticky top-0 bg-[#f8fafc] z-20">

              <tr className="border-b border-[#e2e8f0]">

                {columns.map((col) => (

                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer px-4 py-3 text-left text-white hover:text-slate-200 select-none whitespace-nowrap"
                  >
                    {col.label}

                    {sortField === col.key &&
                      (sortDirection === "asc"
                        ? " ▲"
                        : " ▼")}
                  </th>

                ))}

              </tr>

                {paginatedData.length > 0 ? (
                paginatedData.map((exp, index) => (
                  <tr
                    key={exp.id || index}
                    className="border-b border-[#e2e8f0]/50 hover:bg-[#f8fafc] transition"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {exp.date}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-[#1e3a8a]/20 text-[#1e3a8a] text-xs">
                        {exp.category || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {exp.description || "-"}
                    </td>

                    <td className="px-4 py-3 text-right text-red-400 font-semibold">
                      {fmt(exp.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-[#64748b]"
                  >
                    No expense found.
                  </td>
                </tr>
              )}
            </thead>
            <tfoot>

              <tr className="bg-[#f8fafc] font-bold border-t border-[#e2e8f0]">

                <td
                  colSpan={3}
                  className="px-4 py-3"
                >
                  Total
                </td>

                <td className="px-4 py-3 text-right text-red-400">
                  {fmt(totalExpense)}
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
