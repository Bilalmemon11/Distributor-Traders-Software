import { useState, useMemo } from "react";
import Modal from "../components/Modal";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { Link } from "react-router-dom";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function Inventory() {
  const { products, updateStock, updateVariantBatchExpiry } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockTabFilter, setStockTabFilter] = useState("all");

  const productCategories = useMemo(() => {
    return [...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  // Adjust stock modal
  const [stockModal, setStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");

  // Edit batch & expiry modal
  const [batchModal, setBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batch_no: "",
    expiry_date: "",
    mfg_date: "",
  });
  const [savingBatch, setSavingBatch] = useState(false);

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

  const getExpiryStatus = (v) => {
    if (!v.expiry_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(v.expiry_date);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        type: "expired",
        label: `🔴 Expired (${Math.abs(daysLeft)}d ago)`,
        daysLeft,
        badgeCls: "bg-red-100 text-red-700 font-bold border border-red-300",
      };
    }
    if (daysLeft <= 30) {
      return {
        type: "expiring_soon",
        label: daysLeft === 0 ? "⚠️ Expiring Today!" : `⚠️ Expiring in ${daysLeft}d`,
        daysLeft,
        badgeCls: "bg-amber-100 text-amber-800 font-bold border border-amber-300 animate-pulse",
      };
    }
    return {
      type: "valid",
      label: `🟢 ${daysLeft}d left`,
      daysLeft,
      badgeCls: "bg-green-100 text-green-700 font-medium",
    };
  };

  // Global counts
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;

  products.forEach((p) => {
    (p.variants || []).forEach((v) => {
      const sQty = Number(v.stock_qty || 0);
      if (sQty === 0) {
        outOfStockCount++;
      } else if (sQty <= Number(v.reorder_level || 0)) {
        lowStockCount++;
      }
      const exp = getExpiryStatus(v);
      if (exp?.type === "expired" && sQty > 0) expiredCount++;
      if (exp?.type === "expiring_soon" && sQty > 0) expiringSoonCount++;
    });
  });

  const filteredProducts = products.filter((p) => {
    const keyword =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.variants || []).some(
        (v) =>
          (v.sku && v.sku.toLowerCase().includes(search.toLowerCase())) ||
          (v.batch_no && v.batch_no.toLowerCase().includes(search.toLowerCase()))
      );
    const category = !categoryFilter || p.category === categoryFilter;

    if (!keyword || !category) return false;

    if (stockTabFilter === "expiring_soon") {
      return (p.variants || []).some((v) => {
        const exp = getExpiryStatus(v);
        return exp?.type === "expiring_soon" && Number(v.stock_qty) > 0;
      });
    }

    if (stockTabFilter === "expired") {
      return (p.variants || []).some((v) => {
        const exp = getExpiryStatus(v);
        return exp?.type === "expired" && Number(v.stock_qty) > 0;
      });
    }

    if (stockTabFilter === "low_stock") {
      return (p.variants || []).some(
        (v) => Number(v.stock_qty) > 0 && Number(v.stock_qty) <= Number(v.reorder_level)
      );
    }

    if (stockTabFilter === "out_of_stock") {
      return (p.variants || []).some((v) => Number(v.stock_qty) === 0);
    }

    return true;
  });

  const getFilteredVariants = (p) => {
    return (p.variants || []).filter((v) => {
      if (stockTabFilter === "expiring_soon") {
        const exp = getExpiryStatus(v);
        return exp?.type === "expiring_soon" && Number(v.stock_qty) > 0;
      }
      if (stockTabFilter === "expired") {
        const exp = getExpiryStatus(v);
        return exp?.type === "expired" && Number(v.stock_qty) > 0;
      }
      if (stockTabFilter === "low_stock") {
        return Number(v.stock_qty) > 0 && Number(v.stock_qty) <= Number(v.reorder_level);
      }
      if (stockTabFilter === "out_of_stock") {
        return Number(v.stock_qty) === 0;
      }
      return true;
    });
  };

  const openBatchModal = (p, v) => {
    setSelectedProduct(p);
    setSelectedVariant(v);
    setBatchForm({
      batch_no: v.batch_no || "",
      expiry_date: v.expiry_date || "",
      mfg_date: v.mfg_date || "",
    });
    setBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!selectedVariant) return;
    try {
      setSavingBatch(true);
      await updateVariantBatchExpiry(selectedVariant.id, {
        batch_no: batchForm.batch_no || null,
        expiry_date: batchForm.expiry_date || null,
        mfg_date: batchForm.mfg_date || null,
      });
      setBatchModal(false);
    } catch (err) {
      alert("Error updating batch: " + err.message);
    } finally {
      setSavingBatch(false);
    }
  };

  const visibleProducts = filteredProducts.filter(
    (p) => getFilteredVariants(p).length > 0
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Inventory & Godown Stock" />
      <div className="p-6 space-y-6">
        {/* Urgent Expiry Warning Banner (30 days alert) */}
        {(expiredCount > 0 || expiringSoonCount > 0) && (
          <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              <div>
                <h4 className="text-sm font-bold text-red-800">
                  Batch Expiry Warning & Alerts (30 Days Threshold)
                </h4>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {expiredCount > 0 && (
                    <strong className="text-red-600 mr-2">
                      🔴 {expiredCount} variant(s) Expired!
                    </strong>
                  )}
                  {expiringSoonCount > 0 && (
                    <strong className="text-amber-700">
                      🟡 {expiringSoonCount} variant(s) expiring within 30 days!
                    </strong>
                  )}
                  {" "}Please inspect shampoos, cosmetic items, and liquids.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStockTabFilter("expiring_soon")}
                className="px-3.5 py-1.5 text-xs bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold rounded-lg shadow-md transition whitespace-nowrap"
              >
                View Expiring Soon
              </button>
              <Link
                to="/reports"
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm"
              >
                Full Expiry Report ➔
              </Link>
            </div>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full px-4 py-2.5 rounded-xl bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] focus:outline-none focus:border-[#1e3a8a] text-sm"
            placeholder="Search by Product Name, SKU, or Batch #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] focus:outline-none focus:border-[#1e3a8a] text-sm"
          >
            <option value="">All Categories</option>
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            sub="Active Catalog"
            color="accent"
            icon="📦"
          />
          <StatCard
            label="Stock Value (Cost)"
            value={fmt(stockValueCost)}
            sub="Capital in Godown"
            color="teal"
            icon="💵"
          />
          <StatCard
            label="Stock Value (Retail)"
            value={fmt(stockValueRetail)}
            sub="Selling Worth"
            color="green"
            icon="💎"
          />
          <StatCard
            label="Expiring Soon (<30d)"
            value={expiringSoonCount}
            sub="30 Days Alert"
            color="yellow"
            icon="⏰"
          />
          <StatCard
            label="Expired Items"
            value={expiredCount}
            sub="Immediate Action"
            color="red"
            icon="🔴"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#e2e8f0] pb-3">
          <button
            onClick={() => setStockTabFilter("all")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border ${
              stockTabFilter === "all"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:bg-[#e2e8f0]"
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setStockTabFilter("expiring_soon")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              stockTabFilter === "expiring_soon"
                ? "bg-[#f59e0b] text-white border-[#d97706] shadow-md"
                : "bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            }`}
          >
            <span>🟡</span> Expiring Soon &lt; 30d ({expiringSoonCount})
          </button>
          <button
            onClick={() => setStockTabFilter("expired")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              stockTabFilter === "expired"
                ? "bg-[#ef4444] text-white border-[#dc2626] shadow-md"
                : "bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
            }`}
          >
            <span>🔴</span> Expired ({expiredCount})
          </button>
          <button
            onClick={() => setStockTabFilter("low_stock")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              stockTabFilter === "low_stock"
                ? "bg-[#d97706] text-white border-[#b45309] shadow-md"
                : "bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100"
            }`}
          >
            <span>⚠️</span> Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockTabFilter("out_of_stock")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
              stockTabFilter === "out_of_stock"
                ? "bg-slate-700 text-white border-slate-700 shadow-md"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>❌</span> Out of Stock ({outOfStockCount})
          </button>
        </div>

        {/* Product Cards & Tables */}
        <div className="space-y-4">
          {visibleProducts.map((p) => {
            const visibleVariants = getFilteredVariants(p);

            const totalStock = visibleVariants.reduce(
              (sum, v) => sum + Number(v.stock_qty || 0),
              0
            );

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#e2e8f0] p-5 hover:border-[#e2e8f0]/80 transition-all shadow-sm"
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
                        <th className="pb-3 pr-4">Batch / Expiry (Alert)</th>
                        <th className="pb-3 pr-4 text-center">Stock</th>
                        <th className="pb-3 pr-4 text-center">Reorder</th>
                        <th className="pb-3 pr-4">Value (Cost)</th>
                        <th className="pb-3 pr-4">Stock Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {visibleVariants.map((v) => {
                        const status = getStockStatus(v);
                        const pct = getStockPct(v);
                        const stockValue = Number(v.cost_price) * Number(v.stock_qty);
                        const expStatus = getExpiryStatus(v);

                        return (
                          <tr key={v.id} className="hover:bg-[#f8fafc] transition-colors">
                            <td className="py-3 pr-4">
                              <span className="text-[#1e293b] font-medium">
                                {v.variant_name || "-"}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-[#64748b] font-mono text-xs">
                              {v.sku}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-col gap-1">
                                {v.batch_no && (
                                  <span className="text-xs font-mono font-bold text-[#4338ca]">
                                    Batch: {v.batch_no}
                                  </span>
                                )}
                                {expStatus ? (
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full inline-block w-fit ${expStatus.badgeCls}`}
                                  >
                                    {expStatus.label} ({v.expiry_date})
                                  </span>
                                ) : (
                                  <span className="text-xs text-[#94a3b8] italic">
                                    No Expiry Set
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-col items-center">
                                <span className={`font-bold ${status.textColor}`}>
                                  {v.stock_qty || 0}
                                </span>
                                <div className="w-16 h-1 mt-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${status.color} rounded-full transition-all`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-center text-[#f59e0b] font-semibold text-xs">
                              {v.reorder_level || 0}
                            </td>
                            <td className="py-3 pr-4 text-[#14b8a6] font-semibold">
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
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openBatchModal(p, v)}
                                  className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                  title="Edit Batch & Expiry Date"
                                >
                                  ⏰ Batch/Exp
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setSelectedVariant(v);
                                    setAdjustQty("");
                                    setStockModal(true);
                                  }}
                                  className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                >
                                  Adjust
                                </button>
                              </div>
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
          {visibleProducts.length === 0 && (
            <div className="text-center text-[#64748b] py-16 bg-white rounded-xl border border-[#e2e8f0]">
              <span className="text-4xl block mb-3">
                {stockTabFilter === "expired" ? "✅" : stockTabFilter === "expiring_soon" ? "🟢" : "📦"}
              </span>
              <p className="font-bold text-base text-[#1e293b]">
                {stockTabFilter === "expired"
                  ? "No Expired Products Found"
                  : stockTabFilter === "expiring_soon"
                  ? "No Products Expiring Soon (< 30 Days)"
                  : stockTabFilter === "low_stock"
                  ? "No Low Stock Products"
                  : stockTabFilter === "out_of_stock"
                  ? "No Out of Stock Products"
                  : "No products found matching the criteria"}
              </p>
              <p className="text-xs text-[#64748b] mt-1">
                {stockTabFilter === "expired"
                  ? "Good news! No expired items are currently sitting in your godown."
                  : stockTabFilter === "expiring_soon"
                  ? "All monitored shampoo, liquid, and cosmetic inventory is currently valid."
                  : "Try clearing search or filters to see other products."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={stockModal}
        onClose={() => setStockModal(false)}
        title="Adjust Stock Qty"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#64748b]">Product</p>
            <p className="font-semibold text-[#1e293b]">
              {selectedProduct?.name} <span className="text-[#64748b]">({selectedVariant?.variant_name})</span>
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#64748b]">Stock Adjustment (Qty)</label>
            <input
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] focus:border-[#6c63ff] outline-none"
              placeholder="Example: 10 or -5"
            />
            <p className="text-xs text-[#64748b] mt-1">Current Stock: {selectedVariant?.stock_qty}</p>
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

      {/* Edit Batch & Expiry Modal */}
      {batchModal && (
        <Modal
          isOpen={batchModal}
          onClose={() => setBatchModal(false)}
          title={`Batch & Expiry Date: ${selectedProduct?.name} (${selectedVariant?.variant_name})`}
          size="md"
        >
          <form onSubmit={handleSaveBatch} className="space-y-4">
            <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] text-xs space-y-1">
              <div>
                Product: <strong className="text-[#1e293b]">{selectedProduct?.name}</strong>
              </div>
              <div>
                Variant: <strong className="text-[#1e293b]">{selectedVariant?.variant_name}</strong>
              </div>
              <div>
                Godown Stock: <strong className="text-blue-700">{selectedVariant?.stock_qty}</strong>
              </div>
            </div>

            <div>
              <label className="block text-[#64748b] text-xs font-medium mb-1">
                Batch Number (Shampoo, Cream, Liquid, etc.)
              </label>
              <input
                type="text"
                placeholder="e.g. BATCH-2026-A1 or LOT-505"
                value={batchForm.batch_no}
                onChange={(e) => setBatchForm({ ...batchForm, batch_no: e.target.value })}
                className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#64748b] text-xs font-medium mb-1">
                  Manufacturing Date (Mfg)
                </label>
                <input
                  type="date"
                  value={batchForm.mfg_date}
                  onChange={(e) => setBatchForm({ ...batchForm, mfg_date: e.target.value })}
                  className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#64748b] text-xs font-medium mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                  className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchModal(false)}
                className="px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg text-sm hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingBatch}
                className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm hover:bg-[#1e40af] font-semibold"
              >
                {savingBatch ? "Saving..." : "Save Batch & Expiry"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
