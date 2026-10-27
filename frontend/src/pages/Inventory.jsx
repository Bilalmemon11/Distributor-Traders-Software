import { useState, useMemo } from "react";
import Modal from "../components/Modal";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function Inventory() {
  const { products, updateStock } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const productCategories = useMemo(() => {
    return [...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);
  const [stockModal, setStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");

  const totalProducts = products.length;

  const stockValueCost = products.reduce((sum, p) => {
    const variantsSum = (p.variants || []).reduce(
      (vSum, v) => vSum + Number(v.cost_price || 0) * Number(v.stock_qty || 0),
      0
    );
    return sum + variantsSum;
  }, 0);

  const stockValueRetail = products.reduce((sum, p) => {
    const variantsSum = (p.variants || []).reduce(
      (vSum, v) => vSum + Number(v.price || 0) * Number(v.stock_qty || 0),
      0
    );
    return sum + variantsSum;
  }, 0);

  const getStockStatus = (v) => {
    if (Number(v.stock_qty) === 0)
      return {
        color: "bg-[#ef4444]",
        label: "Out of Stock",
        textColor: "text-[#ef4444]",
      };

    if (Number(v.stock_qty) <= Number(v.reorder_level))
      return {
        color: "bg-[#f59e0b]",
        label: "Low Stock",
        textColor: "text-[#f59e0b]",
      };

    return {
      color: "bg-[#22c55e]",
      label: "In Stock",
      textColor: "text-[#22c55e]",
    };
  };

  const getStockPct = (v) => {
    const max = Math.max(
      Number(v.reorder_level || 0) * 3,
      Number(v.stock_qty || 0),
      1
    );

    return Math.min((Number(v.stock_qty || 0) / max) * 100, 100);
  };

  const filteredProducts = products.filter((p) => {
    const keyword = p.name.toLowerCase().includes(search.toLowerCase()) ||
                    (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const category = !categoryFilter || p.category === categoryFilter;
    return keyword && category;
  });

  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    (p.variants || []).forEach((v) => {
      if (Number(v.stock_qty) === 0) {
        outOfStockCount++;
      } else if (Number(v.stock_qty) <= Number(v.reorder_level)) {
        lowStockCount++;
      }
    });
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Inventory" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full px-4 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] focus:outline-none focus:border-[#6c63ff]"
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] focus:outline-none focus:border-[#6c63ff]"
          >
            <option value="">All Categories</option>
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            sub="Active SKUs"
            color="accent"
            icon="📦"
          />
          <StatCard
            label="Stock Value (Cost)"
            value={fmt(stockValueCost)}
            sub="At purchase price"
            color="teal"
            icon="💵"
          />
          <StatCard
            label="Stock Value (Retail)"
            value={fmt(stockValueRetail)}
            sub="At selling price"
            color="green"
            icon="💎"
          />
          <StatCard
            label="Low Stock Variants"
            value={lowStockCount}
            sub="Need Restocking"
            color="yellow"
            icon="⚠️"
          />
          <StatCard
            label="Out of Stock Variants"
            value={outOfStockCount}
            sub="Immediate Action"
            color="red"
            icon="❌"
          />
        </div>

        <div className="space-y-4">
          {filteredProducts.map((p) => {
            const totalStock = (p.variants || []).reduce(
              (sum, v) => sum + Number(v.stock_qty || 0),
              0
            );

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#e2e8f0] p-5 hover:border-[#e2e8f0]/80 transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 pb-4 border-b border-[#e2e8f0]/50">
                  <div>
                    <h4 className="text-[#1e293b] font-semibold text-lg">{p.name}</h4>
                    <p className="text-[#64748b] text-sm mt-0.5">
                      {p.category || "-"} • {p.unit || "-"}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <p className="text-[#64748b] text-xs">Total Stock</p>
                    <p className="text-[#14b8a6] font-bold text-lg">
                      {totalStock} {p.unit || ""}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider">
                        <th className="pb-3 pr-4">Variant</th>
                        <th className="pb-3 pr-4">SKU</th>
                        <th className="pb-3 pr-4 text-center">Stock</th>
                        <th className="pb-3 pr-4 text-center">Reorder</th>
                        <th className="pb-3 pr-4">Value (Cost)</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3248]/30">
                      {(p.variants || []).map((v) => {
                        const status = getStockStatus(v);
                        const pct = getStockPct(v);
                        const stockValue = Number(v.cost_price) * Number(v.stock_qty);

                        return (
                          <tr key={v.id} className="hover:bg-[#f8fafc] transition-colors">
                            <td className="py-3 pr-4">
                              <span className="text-[#1e293b] font-medium">
                                {v.variant_name || "-"}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-[#64748b] font-mono">
                              {v.sku}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-col items-center">
                                <span className={`font-bold ${status.textColor}`}>
                                  {v.stock_qty || 0}
                                </span>
                                <div className="w-16 h-1 mt-1 bg-[#2a3248] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${status.color} rounded-full transition-all`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-center text-[#f59e0b]">
                              {v.reorder_level || 0}
                            </td>
                            <td className="py-3 pr-4 text-[#14b8a6]">
                              {fmt(stockValue)}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.textColor} ${status.color}/10`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setSelectedVariant(v);
                                  setAdjustQty("");
                                  setStockModal(true);
                                }}
                                className="text-xs bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 px-3 py-1.5 rounded transition-colors"
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="text-center text-[#64748b] py-16 bg-white rounded-xl border border-[#e2e8f0]">
              <span className="text-4xl block mb-3">📦</span>
              No products in inventory
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={stockModal}
        onClose={() => setStockModal(false)}
        title="Adjust Stock"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Product</p>
            <p className="font-semibold text-[#1e293b]">
              {selectedProduct?.name} <span className="text-gray-400">({selectedVariant?.variant_name})</span>
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-300">Stock Adjustment (Qty)</label>
            <input
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] focus:border-[#6c63ff] outline-none"
              placeholder="Example: 10 or -5"
            />
            <p className="text-xs text-gray-500 mt-1">Current Stock: {selectedVariant?.stock_qty}</p>
          </div>

          <button
            className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] py-2.5 rounded-lg text-white font-medium transition-colors"
            onClick={async () => {
              if (!adjustQty) return;
              await updateStock(
                selectedProduct.id,
                selectedVariant.id,
                Number(adjustQty)
              );
              setStockModal(false);
            }}
          >
            Save Adjustment
          </button>
        </div>
      </Modal>
    </div>
  );
}
