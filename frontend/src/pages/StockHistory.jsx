import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StockHistory() {
  const { inventoryTransactions, printStockHistory } = useApp();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(() => {
    return inventoryTransactions.filter((t) => {
      const keyword =
        (t.productName || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.sku || "").toLowerCase().includes(search.toLowerCase());

      const d = new Date(t.createdAt);

      const from = !fromDate || d >= new Date(fromDate);

      const to = !toDate || d <= new Date(toDate + "T23:59:59");

      const transaction = !type || t.type === type;

      return keyword && from && to && transaction;
    });
  }, [inventoryTransactions, search, fromDate, toDate, type]);

  const badgeColor = (type) => {
    switch (type) {
      case "opening":
        return "bg-blue-500/20 text-blue-400";

      case "purchase":
        return "bg-green-500/20 text-green-600";

      case "purchase_return":
        return "bg-orange-500/20 text-orange-400";

      case "purchase_delete":
        return "bg-red-500/20 text-red-600";

      case "sale":
        return "bg-purple-500/20 text-purple-400";

      case "sale_return":
        return "bg-pink-500/20 text-pink-400";

      case "adjustment":
        return "bg-yellow-500/20 text-yellow-400";

      case "damage":
        return "bg-red-600/20 text-red-500";

      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const badgeText = (type) => {
    switch (type) {
      case "opening":
        return "Opening";

      case "purchase":
        return "Purchase";

      case "purchase_return":
        return "Purchase Return";

      case "purchase_delete":
        return "Purchase Delete";

      case "sale":
        return "Sale";

      case "sale_return":
        return "Sale Return";

      case "adjustment":
        return "Adjustment";

      case "damage":
        return "Damage";

      default:
        return type;
    }
  };

  const exportExcel = () => {
    const data = filtered.map((t) => ({
      Date: new Date(t.createdAt).toLocaleString(),
      SKU: t.sku,
      Product: t.productName,
      Type: badgeText(t.type),
      Quantity: t.qty,
      "Stock Before": t.stockBefore,
      "Stock After": t.stockAfter,
      Notes: t.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock History");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Stock-History-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Qadri Distributors", 14, 18);

    doc.setFontSize(11);
    doc.text("Stock History Report", 14, 26);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      33
    );

    autoTable(doc, {
      startY: 40,

      head: [[
        "Date",
        "SKU",
        "Product",
        "Type",
        "Qty",
        "Before",
        "After",
        "Notes",
      ]],

      body: filtered.map((t) => [
        new Date(t.createdAt).toLocaleDateString(),
        t.sku,
        t.productName,
        t.type,
        t.qty,
        t.stockBefore,
        t.stockAfter,
        t.notes,
      ]),
    });

    doc.save("StockHistory.pdf");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Stock History"
        action={
          <div className="flex gap-3">
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
            >
              📊 Export Excel
            </button>

            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
              Export PDF
            </button>
          </div>
        }
      />{" "}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-gray-600 text-xs">Total Records</p>
            <h2 className="text-2xl font-bold text-[#1e293b]">{filtered.length}</h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-gray-600 text-xs">Purchase</p>
            <h2 className="text-green-600 text-2xl font-bold">
              {filtered.filter((x) => x.type === "purchase").length}
            </h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-gray-600 text-xs">Sale</p>
            <h2 className="text-purple-400 text-2xl font-bold">
              {filtered.filter((x) => x.type === "sale").length}
            </h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <p className="text-gray-600 text-xs">Returns</p>
            <h2 className="text-red-600 text-2xl font-bold">
              {
                filtered.filter(
                  (x) =>
                    x.type === "sale_return" || x.type === "purchase_return",
                ).length
              }
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Product / SKU..."
            className="px-4 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b]"
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b]"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b]"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b]"
          >
            <option value="">All Types</option>

            <option value="opening">Opening</option>

            <option value="purchase">Purchase</option>

            <option value="purchase_return">Purchase Return</option>

            <option value="purchase_delete">Purchase Delete</option>

            <option value="sale">Sale</option>

            <option value="sale_return">Sale Return</option>

            <option value="adjustment">Adjustment</option>

            <option value="damage">Damage</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-auto max-h-[700px]">
          <table className="w-full text-sm">
            <thead className="bg-[#111622] sticky top-0 z-10 text-white">
              <tr>
                <th className="text-left p-3">Date</th>

                <th className="text-left p-3">SKU</th>

                <th className="text-left p-3">Product</th>

                <th className="text-left p-3">Type</th>

                <th className="text-right p-3">Qty</th>

                <th className="text-right p-3">Before</th>

                <th className="text-right p-3">After</th>

                <th className="text-left p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9]"
                >
                  <td className="p-3">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-cyan-700 font-mono">{t.sku}</td>
                  <td className="p-3">{t.productName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${badgeColor(
                        t.type,
                      )}`}
                    >
                      {badgeText(t.type)}
                    </span>
                  </td>
                  <td
                    className={`p-3 text-right font-semibold ${t.type.includes("purchase") ||
                        t.type === "opening" ||
                        t.type === "sale_return"
                        ? "text-green-600"
                        : "text-red-600"
                      }`}
                  >
                    {t.type.includes("purchase") ||
                      t.type === "opening" ||
                      t.type === "sale_return"
                      ? "+"
                      : "-"}
                    {t.qty}
                  </td>
                  <td className="p-3 text-right">{t.stockBefore}</td>
                  <td className="p-3 text-right">{t.stockAfter}</td>
                  <td className="p-3 text-[#1e293b] font-medium">{t.notes}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-600">
                    No Stock History
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
