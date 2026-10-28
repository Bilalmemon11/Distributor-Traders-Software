import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";
import { useNavigate } from "react-router-dom";

export default function Areas() {
  const { areas, addArea, updateArea, deleteArea, customers } = useApp();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [form, setForm] = useState({
    name: "",
    city: "Hyderabad",
    code: "",
    description: "",
    is_active: true,
  });

  const handleOpenAdd = () => {
    setEditingArea(null);
    setForm({
      name: "",
      city: "Hyderabad",
      code: "",
      description: "",
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (area) => {
    setEditingArea(area);
    setForm({
      name: area.name,
      city: area.city || "Hyderabad",
      code: area.code || "",
      description: area.description || "",
      is_active: area.is_active !== undefined ? area.is_active : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Area name is required");

    try {
      if (editingArea) {
        await updateArea(editingArea.id, form);
      } else {
        await addArea(form);
      }
      setShowModal(false);
    } catch {
      // Handled in context
    }
  };

  const handleDelete = async (id, name) => {
    const custCount = customers.filter((c) => c.areaId === id).length;
    if (custCount > 0) {
      return alert(
        `Cannot delete "${name}" because it is currently assigned to ${custCount} customer(s). Please reassign those customers first.`
      );
    }
    if (!window.confirm(`Are you sure you want to delete area "${name}"?`)) return;
    try {
      await deleteArea(id);
    } catch {
      alert("Failed to delete area.");
    }
  };

  // Stats
  const totalAreas = areas.length;
  const totalAssignedCustomers = customers.filter((c) => c.areaId).length;
  const activeAreas = areas.filter((a) => a.is_active !== false).length;

  const rows = areas.map((a) => {
    const custCount = customers.filter((c) => c.areaId === a.id).length;
    return [
      <div>
        <span className="font-bold text-[#1e293b]">{a.name}</span>
        {a.description && (
          <span className="text-xs text-[#64748b] block">{a.description}</span>
        )}
      </div>,
      <span className="font-semibold text-[#1e3a8a] bg-[#dbeafe] px-2 py-0.5 rounded text-xs">
        {a.city || "Hyderabad"}
      </span>,
      <span className="text-xs font-mono text-[#64748b]">{a.code || "—"}</span>,
      <span className="font-bold text-[#4338ca] bg-[#e0e7ff] px-2.5 py-0.5 rounded-full text-xs">
        {custCount} Customers
      </span>,
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          a.is_active !== false
            ? "bg-[#22c55e]/20 text-[#16a34a]"
            : "bg-[#ef4444]/20 text-[#ef4444]"
        }`}
      >
        {a.is_active !== false ? "Active" : "Inactive"}
      </span>,
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => navigate("/customers")}
          className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
          title="View Customers"
        >
          👥 View Customers
        </button>
        <button
          onClick={() => handleOpenEdit(a)}
          className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800 text-white font-medium"
        >
          ✏ Edit
        </button>
        <button
          onClick={() => handleDelete(a.id, a.name)}
          className="px-2 py-1 text-xs rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium"
        >
          🗑 Delete
        </button>
      </div>,
    ];
  });

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Hyderabad Areas & Routes"
        action={
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>+</span> Add New Area
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Hyderabad Areas"
            value={totalAreas}
            sub={`${activeAreas} Active sectors`}
            color="accent"
            icon="📍"
          />
          <StatCard
            label="Customers in Areas"
            value={totalAssignedCustomers}
            sub={`Out of ${customers.length} total customers`}
            color="green"
            icon="👥"
          />
          <StatCard
            label="Primary City"
            value="Hyderabad"
            sub="Sindh, Pakistan"
            color="purple"
            icon="🏙️"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div>
              <h3 className="text-[#1e293b] font-semibold text-base">
                Hyderabad Distribution Areas List
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Latifabad, Hussainabad, Qasimabad, Naseem Nagar, Citizen Colony, Saddar, etc.
              </p>
            </div>
            <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2.5 py-1 rounded-full font-medium">
              {areas.length} Areas Configured
            </span>
          </div>

          <Table
            headers={[
              "Area / Sector Name",
              "City",
              "Code",
              "Assigned Customers",
              "Status",
              "Actions",
            ]}
            rows={rows}
            emptyMessage="No areas found. Click 'Add New Area' to create Hyderabad sectors."
          />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingArea ? "Edit Area" : "Add Hyderabad Area"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Area / Sector Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Latifabad Unit 7, Hussainabad, Qasimabad Phase 1..."
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input
                type="text"
                disabled
                className={`${inputCls} bg-[#e2e8f0] font-semibold cursor-not-allowed`}
                value={form.city}
              />
            </div>
            <div>
              <label className={labelCls}>Area Code / Shortcut</label>
              <input
                type="text"
                placeholder="e.g. LTF, HSB, QSM"
                className={inputCls}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description / Landmarks (Optional)</label>
            <textarea
              rows="2"
              placeholder="e.g. Near Market, Auto Bhan road side..."
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              {editingArea ? "Update Area" : "Save Area"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
