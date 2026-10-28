import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function Salesmen() {
  const { salesmen, addSalesman, updateSalesman, deleteSalesman, invoices } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    cnic: "",
    commission_rate: 0,
    address: "",
    is_active: true,
  });

  const handleOpenAdd = () => {
    setEditingSalesman(null);
    setForm({
      name: "",
      phone: "",
      cnic: "",
      commission_rate: 0,
      address: "",
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSalesman(s);
    setForm({
      name: s.name,
      phone: s.phone || "",
      cnic: s.cnic || "",
      commission_rate: s.commission_rate || 0,
      address: s.address || "",
      is_active: s.is_active !== undefined ? s.is_active : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Salesman / Booker name is required");

    try {
      if (editingSalesman) {
        await updateSalesman(editingSalesman.id, {
          ...form,
          commission_rate: Number(form.commission_rate || 0),
        });
      } else {
        await addSalesman({
          ...form,
          commission_rate: Number(form.commission_rate || 0),
        });
      }
      setShowModal(false);
    } catch {
      // Handled in context
    }
  };

  const handleDelete = async (id, name) => {
    if (id === 1 || name.toLowerCase().includes("self") || name.toLowerCase().includes("admin")) {
      return alert("The default 'Self / Admin' entry cannot be deleted as it is required for direct counter sales.");
    }
    const invCount = invoices.filter((i) => i.salesmanId === id).length;
    if (invCount > 0) {
      return alert(
        `Cannot delete "${name}" because there are ${invCount} invoice(s) associated with this salesman. You can set them to 'Inactive' instead.`
      );
    }
    if (!window.confirm(`Are you sure you want to delete salesman "${name}"?`)) return;
    try {
      await deleteSalesman(id);
    } catch {
      alert("Failed to delete salesman.");
    }
  };

  // Stats calculation
  const totalSalesmen = salesmen.length;
  const activeSalesmen = salesmen.filter((s) => s.is_active !== false).length;
  const totalCommission = invoices.reduce((s, i) => s + (Number(i.commissionAmount) || 0), 0);

  const rows = salesmen.map((s) => {
    const sInvoices = invoices.filter((i) => i.salesmanId === s.id);
    const totalSales = sInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const commEarned = sInvoices.reduce((sum, inv) => sum + (Number(inv.commissionAmount) || 0), 0);
    const isDefault = s.id === 1 || s.name.toLowerCase().includes("self");

    return [
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1e293b]">{s.name}</span>
          {isDefault && (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              Default (Direct)
            </span>
          )}
        </div>
        {s.address && (
          <span className="text-xs text-[#64748b] block">{s.address}</span>
        )}
      </div>,
      <span className="text-sm font-medium text-[#1e293b]">{s.phone || "—"}</span>,
      <span className="font-bold text-[#4338ca] bg-[#e0e7ff] px-2.5 py-0.5 rounded-full text-xs">
        {s.commission_rate || 0}%
      </span>,
      <span className="font-semibold text-slate-700 text-sm">
        {sInvoices.length} Bills
      </span>,
      <span className="font-semibold text-[#16a34a] text-sm">
        {fmt(totalSales)}
      </span>,
      <span className="font-bold text-amber-600 text-sm">
        {fmt(commEarned)}
      </span>,
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          s.is_active !== false
            ? "bg-[#22c55e]/20 text-[#16a34a]"
            : "bg-[#ef4444]/20 text-[#ef4444]"
        }`}
      >
        {s.is_active !== false ? "Active" : "Inactive"}
      </span>,
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleOpenEdit(s)}
          className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800 text-white font-medium"
        >
          ✏ Edit
        </button>
        {!isDefault && (
          <button
            onClick={() => handleDelete(s.id, s.name)}
            className="px-2 py-1 text-xs rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium"
          >
            🗑 Delete
          </button>
        )}
      </div>,
    ];
  });

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Salesmen & Order Bookers"
        action={
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>+</span> Add Salesman / Booker
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Salesmen / Bookers"
            value={totalSalesmen}
            sub={`${activeSalesmen} Active team members`}
            color="accent"
            icon="👨‍💼"
          />
          <StatCard
            label="Default Sales Mode"
            value="Self / Direct"
            sub="No commission overhead"
            color="green"
            icon="⚡"
          />
          <StatCard
            label="Total Commission Tracked"
            value={fmt(totalCommission)}
            sub="Calculated across all invoices"
            color="amber"
            icon="💵"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div>
              <h3 className="text-[#1e293b] font-semibold text-base">
                Salesmen & Field Bookers Directory
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Manage order bookers, commission rates, and field tracking
              </p>
            </div>
            <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2.5 py-1 rounded-full font-medium">
              {salesmen.length} Registered
            </span>
          </div>

          <Table
            headers={[
              "Salesman / Booker",
              "Phone",
              "Commission %",
              "Total Invoices",
              "Total Sales",
              "Commission Earned",
              "Status",
              "Actions",
            ]}
            rows={rows}
            emptyMessage="No salesmen registered yet. Click 'Add Salesman / Booker' to get started."
          />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSalesman ? "Edit Salesman / Booker" : "Add Salesman / Booker"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Aslam / Ali Khan"
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone / WhatsApp</label>
              <input
                type="text"
                placeholder="e.g. 0300-1234567"
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g. 2.5 or 5"
                className={inputCls}
                value={form.commission_rate}
                onChange={(e) =>
                  setForm({ ...form, commission_rate: e.target.value })
                }
              />
              <span className="text-[10px] text-[#64748b] block mt-0.5">
                Set 0% for direct sales / salaried staff
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls}>CNIC / ID Card (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 41303-xxxxxxx-x"
              className={inputCls}
              value={form.cnic}
              onChange={(e) => setForm({ ...form, cnic: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Assigned Territory / Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Covers Latifabad & Hussainabad routes..."
              className={inputCls}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={form.is_active ? "1" : "0"}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.value === "1" })
              }
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg text-sm hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm hover:bg-[#1e40af] font-semibold"
            >
              {editingSalesman ? "Update Salesman" : "Save Salesman"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
