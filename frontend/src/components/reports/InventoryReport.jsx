import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function InventoryReport({ filters }) {
  const { products } = useApp();

  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("name");

  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return products.filter((product) => {
      if (
        search &&
        !product.name.toLowerCase().includes(search.toLowerCase()) &&
        !product.sku.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.category &&
        Number(filters.category) !== product.category_id
      ) {
        return false;
      }

      return true;
    });
  }, [products, search, filters]);

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

  const totalProducts = filteredData.length;

  const totalStock = filteredData.reduce(
    (sum, p) => sum + Number(p.stock_qty),
    0,
  );

  const inventoryValue = filteredData.reduce(
    (sum, p) => sum + Number(p.stock_qty) * Number(p.cost_price),
    0,
  );

  const lowStock = filteredData.filter(
    (p) =>
      Number(p.stock_qty) > 0 && Number(p.stock_qty) <= Number(p.reorder_level),
  ).length;

  const outOfStock = filteredData.filter(
    (p) => Number(p.stock_qty) === 0,
  ).length;

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
      label: "SKU",
      key: "sku",
    },

    {
      label: "Product",
      key: "name",
    },

    {
      label: "Category",
      key: "category",
    },

    {
      label: "Stock",
      key: "stock",
    },

    {
      label: "Cost",
      key: "cost",
    },

    {
      label: "Value",
      key: "value",
    },

    {
      label: "Status",
      key: "status",
    },
  ];

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,

    currentPage * rowsPerPage,
  );

  const rows = paginatedData.map((p) => ({
    sku: p.sku,

    name: p.name,

    category:
      typeof p.category === "object" ? p.category?.name : p.category || "-",
    stock: p.stock_qty,

    cost: fmt(p.cost_price),

    value: fmt(Number(p.stock_qty) * Number(p.cost_price)),

    status:
      Number(p.stock_qty) === 0
        ? "Out of Stock"
        : Number(p.stock_qty) <= Number(p.reorder_level)
          ? "Low Stock"
          : "In Stock",
  }));
  return (
    <div className="space-y-6">
      <ExportButtons title="Inventory Report" columns={columns} rows={rows} />

      {/* Summary Cards */}

      <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Total Products</p>

          <h2 className="text-3xl font-bold text-[#1e293b]">{totalProducts}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Stock Qty</p>

          <h2 className="text-3xl font-bold text-blue-400">{totalStock}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Inventory Value</p>

          <h2 className="text-3xl font-bold text-green-400">
            {fmt(inventoryValue)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Low Stock</p>

          <h2 className="text-3xl font-bold text-yellow-400">{lowStock}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">Out of Stock</p>

          <h2 className="text-3xl font-bold text-red-400">{outOfStock}</h2>
        </div>
      </div>

      {/* Search */}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Product or SKU..."
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
                      {col.key === "status" ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            row.status === "In Stock"
                              ? "bg-green-500/20 text-green-400"
                              : row.status === "Low Stock"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {row.status}
                        </span>
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="bg-[#1b2233] font-bold">
                <td colSpan={3} className="px-4 py-4">
                  Totals
                </td>

                <td className="px-4 py-4 text-blue-400">{totalStock}</td>

                <td></td>

                <td className="px-4 py-4 text-green-400">
                  {fmt(inventoryValue)}
                </td>

                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      {/* Pagination */}

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
            className="px-3 py-1 rounded bg-[#2a3248] disabled:opacity-40"
          >
            Prev
          </button>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-[#2a3248] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
