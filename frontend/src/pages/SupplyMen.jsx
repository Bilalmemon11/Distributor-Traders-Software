import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";
import api from "../services/api";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function SupplyMen() {
  const { deliveryMen, addDeliveryMan, updateDeliveryMan, deleteDeliveryMan, updateInvoiceDeliveryStatus, invoices, areas } = useApp();

  const [activeTab, setActiveTab] = useState("dispatch"); // 'dispatch' or 'staff'
  const [showModal, setShowModal] = useState(false);
  const [editingMan, setEditingMan] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle_no: "",
    notes: "",
    status: true,
  });

  // Dispatch sheet state
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dispatchData, setDispatchData] = useState([]);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [statusUpdateModal, setStatusUpdateModal] = useState(null);
  const [statusForm, setStatusForm] = useState({
    delivery_status: "delivered",
    delivery_man_id: 1,
    delivery_notes: "",
  });

  const loadDispatchSheet = async () => {
    setDispatchLoading(true);
    try {
      const params = {};
      if (dispatchDate) {
        params.start_date = dispatchDate;
        params.end_date = dispatchDate;
      }
      if (selectedDriver !== "all") params.delivery_man_id = selectedDriver;
      if (selectedArea !== "all") params.area_id = selectedArea;
      if (selectedStatus !== "all") params.delivery_status = selectedStatus;

      const res = await api.get("/dispatch-sheet", { params });
      setDispatchData(res.data.data?.invoices || []);
    } catch (err) {
      console.error("Failed to load dispatch sheet", err);
    } finally {
      setDispatchLoading(false);
    }
  };

  useEffect(() => {
    loadDispatchSheet();
  }, [dispatchDate, selectedDriver, selectedArea, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingMan(null);
    setForm({
      name: "",
      phone: "",
      vehicle_no: "",
      notes: "",
      status: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMan(m);
    setForm({
      name: m.name,
      phone: m.phone || "",
      vehicle_no: m.vehicle_no || "",
      notes: m.notes || "",
      status: m.status !== undefined ? m.status : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Supply man / Driver name is required");

    try {
      if (editingMan) {
        await updateDeliveryMan(editingMan.id, form);
      } else {
        await addDeliveryMan(form);
      }
      setShowModal(false);
    } catch {
      // Handled in context
    }
  };

  const handleDelete = async (id, name) => {
    if (id === 1 || name.toLowerCase().includes("self") || name.toLowerCase().includes("counter")) {
      return alert("The default 'Self / Direct' entry cannot be deleted as it is required for warehouse counter sales.");
    }
    const invCount = invoices.filter((i) => i.deliveryManId === id).length;
    if (invCount > 0) {
      return alert(
        `Cannot delete "${name}" because there are ${invCount} invoice(s) assigned to this supply man. You can change their status to 'Inactive' instead.`
      );
    }
    if (!window.confirm(`Are you sure you want to delete supply man "${name}"?`)) return;
    try {
      await deleteDeliveryMan(id);
    } catch {
      alert("Failed to delete supply man.");
    }
  };

  const handleOpenStatusModal = (inv) => {
    setStatusUpdateModal(inv);
    setStatusForm({
      delivery_status: inv.delivery_status || "delivered",
      delivery_man_id: inv.delivery_man_id || 1,
      delivery_notes: inv.delivery_notes || "",
    });
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusUpdateModal) return;
    try {
      await updateInvoiceDeliveryStatus(statusUpdateModal.id, statusForm);
      setStatusUpdateModal(null);
      loadDispatchSheet();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintDispatchSheet = () => {
    window.print();
  };

  // Stats
  const totalStaff = deliveryMen.length;
  const activeStaff = deliveryMen.filter((m) => m.status !== false).length;
  const pendingDeliveries = invoices.filter((i) => i.deliveryStatus === "pending_delivery" || i.deliveryStatus === "dispatched").length;
  const totalDelivered = invoices.filter((i) => i.deliveryStatus === "delivered").length;

  const staffColumns = [
    { key: "name", label: "Supply Man / Driver Name" },
    { key: "contact", label: "Phone & Vehicle" },
    { key: "deliveries", label: "Total Assigned" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const staffRows = deliveryMen.map((m) => {
    const assignedInvoices = invoices.filter((i) => i.deliveryManId === m.id);
    const isDefault = m.id === 1 || m.name.toLowerCase().includes("self");

    return {
      name: (
        <div>
          <p className="font-bold text-[#1e293b] flex items-center gap-2">
            <span>🚚</span> {m.name}
            {isDefault && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                Default (Counter)
              </span>
            )}
          </p>
          {m.notes && <p className="text-xs text-[#64748b]">{m.notes}</p>}
        </div>
      ),
      contact: (
        <div>
          <p className="font-medium text-sm text-[#1e293b]">{m.phone || "No Phone"}</p>
          {m.vehicle_no && (
            <p className="text-xs text-slate-500 font-medium">🚗 {m.vehicle_no}</p>
          )}
        </div>
      ),
      deliveries: (
        <div>
          <span className="font-bold text-sm text-blue-600">{assignedInvoices.length} Invoices</span>
        </div>
      ),
      status: (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            m.status !== false
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {m.status !== false ? "Active" : "Inactive"}
        </span>
      ),
      actions: (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenEdit(m)}
            className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
          >
            Edit
          </button>
          {!isDefault && (
            <button
              onClick={() => handleDelete(m.id, m.name)}
              className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
            >
              Delete
            </button>
          )}
        </div>
      ),
    };
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Topbar title="Supply Men & Warehouse Dispatch" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Title & Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">
              🚚 Supply Men & Warehouse Delivery
            </h1>
            <p className="text-sm text-[#64748b] mt-0.5">
              Warehouse se dukaano par maal deliver karne wale staff aur daily delivery gate-pass sheet manage karein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("dispatch")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition border ${
                activeTab === "dispatch"
                  ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:bg-slate-50"
              }`}
            >
              📋 Daily Dispatch Sheet
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition border ${
                activeTab === "staff"
                  ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:bg-slate-50"
              }`}
            >
              🚚 Supply Men Staff ({deliveryMen.length})
            </button>
            {activeTab === "staff" && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow transition flex items-center gap-1.5"
              >
                <span>+</span> Add Supply Man
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Supply Men"
            value={totalStaff}
            icon="🚚"
            subtext={`${activeStaff} active staff`}
          />
          <StatCard
            label="Pending Deliveries"
            value={pendingDeliveries}
            icon="⏳"
            subtext="Maal deliver hona baqi hai"
          />
          <StatCard
            label="Completed Deliveries"
            value={totalDelivered}
            icon="✅"
            subtext="Dukaano par pahunch gaya"
          />
          <StatCard
            label="Today's Dispatched Orders"
            value={dispatchData.length}
            icon="📦"
            subtext="Selected date orders"
          />
        </div>

        {/* Tab 1: Daily Dispatch Sheet */}
        {activeTab === "dispatch" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748b] mb-1">
                    Booking / Dispatch Date:
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs text-[#1e293b] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748b] mb-1">
                    Supply Man / Driver:
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs text-[#1e293b] font-medium"
                  >
                    <option value="all">All Supply Men / Direct</option>
                    {deliveryMen.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.vehicle_no ? `(${d.vehicle_no})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748b] mb-1">
                    Customer Area:
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs text-[#1e293b] font-medium"
                  >
                    <option value="all">All Hyderabad Areas</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748b] mb-1">
                    Delivery Status:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs text-[#1e293b] font-medium"
                  >
                    <option value="all">All Delivery Statuses</option>
                    <option value="pending_delivery">⏳ Pending Delivery</option>
                    <option value="dispatched">🚚 On The Way (Dispatched)</option>
                    <option value="delivered">✅ Delivered</option>
                    <option value="returned">↩️ Returned</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDispatchSheet}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow transition flex items-center gap-1.5"
                >
                  <span>🖨️</span> Print Dispatch Sheet / Gate Pass
                </button>
              </div>
            </div>

            {/* Print Header for Warehouse Gate Pass */}
            <div className="hidden print:block p-4 border-b-2 border-slate-900 mb-4">
              <h2 className="text-xl font-black text-slate-900">QADRI DISTRIBUTORS - WAREHOUSE DISPATCH SHEET</h2>
              <div className="flex justify-between text-xs mt-2 text-slate-700">
                <span><strong>Date:</strong> {dispatchDate}</span>
                <span><strong>Supply Man:</strong> {deliveryMen.find((d) => String(d.id) === String(selectedDriver))?.name || "All Staff"}</span>
                <span><strong>Area:</strong> {areas.find((a) => String(a.id) === String(selectedArea))?.name || "All Areas"}</span>
                <span><strong>Total Invoices:</strong> {dispatchData.length}</span>
              </div>
            </div>

            {/* Dispatch Table */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1e3a8a] text-white text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Inv #</th>
                      <th className="py-3.5 px-4 font-bold">Shop / Customer & Area</th>
                      <th className="py-3.5 px-4 font-bold">Items Qty</th>
                      <th className="py-3.5 px-4 font-bold">Total Bill</th>
                      <th className="py-3.5 px-4 font-bold">Cash to Collect</th>
                      <th className="py-3.5 px-4 font-bold">Supply Staff</th>
                      <th className="py-3.5 px-4 font-bold">Delivery Status</th>
                      <th className="py-3.5 px-4 font-bold print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] text-xs">
                    {dispatchLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#64748b]">
                          Loading dispatch sheet...
                        </td>
                      </tr>
                    ) : dispatchData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#64748b]">
                          No invoices found for the selected date and filters.
                        </td>
                      </tr>
                    ) : (
                      dispatchData.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-black text-blue-900 whitespace-nowrap">
                            {inv.invoice_no}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#1e293b]">{inv.customer_name}</p>
                            <p className="text-[11px] text-[#64748b]">
                              📍 {inv.customer_area || "Hyderabad"} • 📞 {inv.customer_phone || "-"}
                            </p>
                            {inv.customer_address && (
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">{inv.customer_address}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {inv.total_items_qty || 0} pcs
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {fmt(inv.total)}
                          </td>
                          <td className="py-3 px-4 font-black">
                            {inv.balance > 0 ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {fmt(inv.balance)} (Collect Udhaar)
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Paid (Rs. 0 Baqi)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              🚚 {inv.delivery_man_name || "Self / Direct"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                inv.delivery_status === "delivered"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : inv.delivery_status === "dispatched"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : inv.delivery_status === "returned"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {inv.delivery_status === "delivered" && "✅ Delivered"}
                              {inv.delivery_status === "dispatched" && "🚚 On The Way"}
                              {inv.delivery_status === "pending_delivery" && "⏳ Pending"}
                              {inv.delivery_status === "returned" && "↩️ Returned"}
                            </span>
                          </td>
                          <td className="py-3 px-4 print:hidden">
                            <button
                              onClick={() => handleOpenStatusModal(inv)}
                              className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {dispatchData.length > 0 && (
                    <tfoot className="bg-[#1e3a8a] text-white font-bold text-xs">
                      <tr>
                        <td colSpan={2} className="py-3 px-4 text-white">
                          Total {dispatchData.length} Invoices
                        </td>
                        <td className="py-3 px-4 text-white">
                          {dispatchData.reduce((s, i) => s + (Number(i.total_items_qty) || 0), 0)} pcs
                        </td>
                        <td className="py-3 px-4 text-white">
                          {fmt(dispatchData.reduce((s, i) => s + (Number(i.total) || 0), 0))}
                        </td>
                        <td className="py-3 px-4 text-yellow-300">
                          {fmt(dispatchData.reduce((s, i) => s + (Number(i.balance) || 0), 0))} Cash to Collect
                        </td>
                        <td colSpan={3} className="py-3 px-4 text-right text-slate-200">
                          Warehouse Outward Gatepass Checked ✓
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Supply Men Staff List */}
        {activeTab === "staff" && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden p-4">
            <h3 className="text-base font-bold text-[#1e293b] mb-4">
              Registered Supply Men & Delivery Staff
            </h3>
            <Table columns={staffColumns} data={staffRows} />
          </div>
        )}

        {/* Add/Edit Staff Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingMan ? "Edit Supply Man / Driver" : "Add New Supply Man / Driver"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748b] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tariq Loader, Akram Suzuki Driver"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b] focus:outline-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#64748b] mb-1">
                  Phone / Mobile #
                </label>
                <input
                  type="text"
                  placeholder="0300-1234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b] focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748b] mb-1">
                  Vehicle / Loader No
                </label>
                <input
                  type="text"
                  placeholder="Suzuki HY-4521 / Motorcycle"
                  value={form.vehicle_no}
                  onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })}
                  className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b] focus:outline-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] mb-1">
                Route / Warehouse Notes
              </label>
              <textarea
                placeholder="e.g. Latifabad & Auto Bhan routes delivery loader"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b] focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] mb-1">
                Staff Status
              </label>
              <select
                value={form.status ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, status: e.target.value === "active" })}
                className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b] focus:outline-blue-600"
              >
                <option value="active">Active (Available for delivery)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-[#cbd5e1] text-[#64748b] hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow transition"
              >
                {editingMan ? "Save Changes" : "Create Supply Staff"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Update Delivery Status Modal */}
        <Modal
          isOpen={!!statusUpdateModal}
          onClose={() => setStatusUpdateModal(null)}
          title={`Update Delivery Status: ${statusUpdateModal?.invoice_no}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-200">
              <p><strong>Shop / Customer:</strong> {statusUpdateModal?.customer_name}</p>
              <p><strong>Area:</strong> {statusUpdateModal?.customer_area || "Hyderabad"}</p>
              <p><strong>Total Bill:</strong> {fmt(statusUpdateModal?.total)} | <strong>Cash to Collect:</strong> {fmt(statusUpdateModal?.balance)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] mb-1">
                Assigned Supply Man / Driver:
              </label>
              <select
                value={statusForm.delivery_man_id}
                onChange={(e) => setStatusForm({ ...statusForm, delivery_man_id: Number(e.target.value) })}
                className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b]"
              >
                {deliveryMen.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.vehicle_no ? `(${d.vehicle_no})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] mb-1">
                Current Delivery Status:
              </label>
              <select
                value={statusForm.delivery_status}
                onChange={(e) => setStatusForm({ ...statusForm, delivery_status: e.target.value })}
                className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b]"
              >
                <option value="delivered">✅ Delivered (Dukaan par maal pahunch gaya)</option>
                <option value="dispatched">🚚 On The Way (Warehouse se nikal gaya)</option>
                <option value="pending_delivery">⏳ Pending Delivery (Abhi godown me hai)</option>
                <option value="returned">↩️ Returned (Dukaan band thi / Maal wapis aya)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] mb-1">
                Delivery Notes / Feedback:
              </label>
              <input
                type="text"
                placeholder="e.g. Received by shopkeeper cash Rs. 5000"
                value={statusForm.delivery_notes}
                onChange={(e) => setStatusForm({ ...statusForm, delivery_notes: e.target.value })}
                className="w-full border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-[#1e293b]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setStatusUpdateModal(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-[#cbd5e1] text-[#64748b] hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow transition"
              >
                Save Delivery Status
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
