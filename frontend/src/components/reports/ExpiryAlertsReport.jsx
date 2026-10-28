import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import ExportButtons from "./ExportButtons";
import Modal from "../Modal";
import { useApp } from "../../context/AppContext";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function ExpiryAlertsReport({ filters }) {
  const { updateVariantBatchExpiry } = useApp();
  const [data, setData] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [thresholdDays, setThresholdDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("urgency");
  const [sortDirection, setSortDirection] = useState("asc");

  // Edit Batch Modal state
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({
    batch_no: "",
    expiry_date: "",
    mfg_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpiryData();
  }, [thresholdDays]);

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("threshold_days", thresholdDays);
      const res = await fetch(`${API_BASE_URL}/reports/expiry-alerts?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch expiry alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  const openEditBatch = (item) => {
    setEditModal(item);
    setEditForm({
      batch_no: item.batch_no !== "—" ? item.batch_no : "",
      expiry_date: item.expiry_date || "",
      mfg_date: item.mfg_date || "",
    });
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      setSaving(true);
      await updateVariantBatchExpiry(editModal.variant_id, {
        batch_no: editForm.batch_no || null,
        expiry_date: editForm.expiry_date || null,
        mfg_date: editForm.mfg_date || null,
      });
      setEditModal(null);
      await fetchExpiryData();
    } catch (err) {
      alert("Failed to update batch and expiry: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    return (data.items || []).filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const match =
          item.product_name.toLowerCase().includes(q) ||
          item.variant_name.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.batch_no && item.batch_no.toLowerCase().includes(q)) ||
          (item.category_name && item.category_name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [data.items, statusFilter, search]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "urgency") {
        const rank = { expired: 1, expiring_soon: 2, valid: 3, no_expiry: 4 };
        aVal = rank[a.status] || 99;
        bVal = rank[b.status] || 99;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? Number(aVal || 0) - Number(bVal || 0)
        : Number(bVal || 0) - Number(aVal || 0);
    });
    return list;
  }, [filteredItems, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const columns = [
    { label: "Product & Variant", key: "full_name" },
    { label: "Category", key: "category_name" },
    { label: "Batch No", key: "batch_no" },
    { label: "Expiry Date", key: "expiry_date" },
    { label: "Status & Days Left", key: "status_label" },
    { label: "Godown Stock", key: "stock_qty" },
    { label: "Stock Cost Value", key: "stock_value_cost" },
  ];

  const exportRows = sortedItems.map((i) => ({
    full_name: i.full_name,
    category_name: i.category_name,
    batch_no: i.batch_no,
    expiry_date: i.expiry_date || "Not Set",
    status_label: i.status_label,
    stock_qty: i.stock_qty,
    stock_value_cost: fmt(i.stock_value_cost),
  }));

  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      <ExportButtons
        title={`Batch Number & Expiry Alerts Report (Threshold: ${thresholdDays} Days)`}
        columns={columns}
        rows={exportRows}
      />

      {/* Summary Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expired Alert Card */}
        <div className="bg-red-50/80 border-2 border-red-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                🔴 Expired Stock (Immediate Action)
              </p>
              <h2 className="text-2xl font-black text-red-700 mt-1">
                {summary.expired_count || 0} Items
              </h2>
            </div>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="mt-2 text-xs text-red-600 font-semibold">
            Value at Loss: <strong>{fmt(summary.expired_stock_value || 0)}</strong>. Do not sell! Return to vendor or dispose.
          </div>
        </div>

        {/* Expiring Soon (< 30 Days Warning) Card */}
        <div className="bg-amber-50/80 border-2 border-amber-300 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                🟡 Expiring in &lt; {thresholdDays} Days (Warning)
              </p>
              <h2 className="text-2xl font-black text-amber-800 mt-1">
                {summary.expiring_soon_count || 0} Items
              </h2>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-semibold">
            Stock Value at Risk: <strong>{fmt(summary.expiring_soon_stock_value || 0)}</strong>. Clear fast or return!
          </div>
        </div>

        {/* Valid Safe Items */}
        <div className="bg-green-50/80 border-2 border-green-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                🟢 Valid & Fresh Stock
              </p>
              <h2 className="text-2xl font-black text-green-800 mt-1">
                {summary.valid_count || 0} Items
              </h2>
            </div>
            <span className="text-2xl">✓</span>
          </div>
          <div className="mt-2 text-xs text-green-700 font-medium">
            Expiry date is well ahead (&gt; {thresholdDays} days). Safe for distribution.
          </div>
        </div>

        {/* Untracked / No Expiry */}
        <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                ⚪ No Expiry Set
              </p>
              <h2 className="text-2xl font-black text-slate-700 mt-1">
                {summary.no_expiry_count || 0} Items
              </h2>
            </div>
            <span className="text-2xl">📋</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Non-perishable items or batches without expiry registered yet.
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
              statusFilter === "all"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm"
                : "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0] hover:bg-[#e2e8f0]"
            }`}
          >
            All Items ({data.items?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("expired")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1.5 ${
              statusFilter === "expired"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            <span>🔴</span> Expired ({summary.expired_count || 0})
          </button>
          <button
            onClick={() => setStatusFilter("expiring_soon")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1.5 ${
              statusFilter === "expiring_soon"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span>🟡</span> Expiring Soon ({summary.expiring_soon_count || 0})
          </button>
          <button
            onClick={() => setStatusFilter("valid")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1.5 ${
              statusFilter === "valid"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm"
                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            }`}
          >
            <span>🟢</span> Valid ({summary.valid_count || 0})
          </button>
          <button
            onClick={() => setStatusFilter("no_expiry")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border flex items-center gap-1.5 ${
              statusFilter === "no_expiry"
                ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm"
                : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚪</span> No Expiry ({summary.no_expiry_count || 0})
          </button>
        </div>

        {/* Warning Threshold & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748b]">Warning Period:</span>
            <select
              value={thresholdDays}
              onChange={(e) => setThresholdDays(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#1e3a8a]"
            >
              <option value="15">15 Days Before Expiry</option>
              <option value="30">30 Days Before Expiry (Recommended)</option>
              <option value="60">60 Days Before Expiry</option>
              <option value="90">90 Days Before Expiry</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search product, batch, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-[#f8fafc] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#1e3a8a]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#64748b] flex flex-col items-center gap-2">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading batch numbers and calculating expiry dates...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1e293b]">
              <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0] uppercase">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("full_name")}
                  >
                    Product & Variant {sortField === "full_name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Batch #</th>
                  <th className="p-3.5">Mfg Date</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("expiry_date")}
                  >
                    Expiry Date {sortField === "expiry_date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#1e3a8a]"
                    onClick={() => handleSort("urgency")}
                  >
                    Alert Status {sortField === "urgency" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="p-3.5">Godown Stock</th>
                  <th className="p-3.5">Stock Cost Value</th>
                  <th className="p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-[#64748b]">
                      No items found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        item.status === "expired" && item.stock_qty > 0
                          ? "bg-red-50/30"
                          : item.status === "expiring_soon" && item.stock_qty > 0
                          ? "bg-amber-50/20"
                          : ""
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-[#1e293b]">{item.product_name}</div>
                        <div className="text-xs text-[#64748b]">Variant: {item.variant_name}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {item.category_name}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-bold text-[#4338ca]">
                        {item.batch_no}
                      </td>
                      <td className="p-3.5 text-xs text-[#64748b]">
                        {item.mfg_date || "—"}
                      </td>
                      <td className="p-3.5 text-xs font-semibold">
                        {item.expiry_date ? (
                          <span className={item.status === "expired" ? "text-red-600 font-bold" : "text-slate-800"}>
                            {item.expiry_date}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8] italic">Not Set</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {item.status === "expired" && (
                          <span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 animate-pulse">
                            <span>🔴</span> {item.status_label}
                          </span>
                        )}
                        {item.status === "expiring_soon" && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            <span>⚠️</span> {item.status_label}
                          </span>
                        )}
                        {item.status === "valid" && (
                          <span className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
                            <span>🟢</span> {item.status_label}
                          </span>
                        )}
                        {item.status === "no_expiry" && (
                          <span className="text-xs text-[#94a3b8]">No Expiry Date</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-sm">
                        <span className={item.stock_qty <= 0 ? "text-slate-400" : "text-slate-800"}>
                          {item.stock_qty}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-xs">
                        <span className={item.status === "expired" ? "text-red-600 font-bold" : "text-[#1e293b]"}>
                          {fmt(item.stock_value_cost)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => openEditBatch(item)}
                          className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition flex items-center gap-1"
                        >
                          <span>✏️</span> Edit Batch
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Batch Modal */}
      {editModal && (
        <Modal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          title={`Edit Batch & Expiry: ${editModal.product_name} (${editModal.variant_name})`}
          size="md"
        >
          <form onSubmit={handleSaveBatch} className="space-y-4">
            <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0] text-xs space-y-1">
              <div>
                Product: <strong className="text-[#1e293b]">{editModal.product_name}</strong>
              </div>
              <div>
                Variant: <strong className="text-[#1e293b]">{editModal.variant_name}</strong>
              </div>
              <div>
                Current Godown Stock: <strong className="text-blue-700">{editModal.stock_qty}</strong>
              </div>
            </div>

            <div>
              <label className="block text-[#64748b] text-xs font-medium mb-1">
                Batch Number (e.g. B-2026A / LOT-994)
              </label>
              <input
                type="text"
                placeholder="e.g. BATCH-2026-X"
                value={editForm.batch_no}
                onChange={(e) => setEditForm({ ...editForm, batch_no: e.target.value })}
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
                  value={editForm.mfg_date}
                  onChange={(e) => setEditForm({ ...editForm, mfg_date: e.target.value })}
                  className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#64748b] text-xs font-medium mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg text-sm hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm hover:bg-[#1e40af] font-semibold"
              >
                {saving ? "Saving..." : "Save Batch & Expiry"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
