import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import CustomerPaymentHistoryModal from "../components/Customer/CustomerPaymentHistoryModal";
import { API_BASE_URL } from "../config";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const avatarColors = [
  "bg-[#1e3a8a]",
  "bg-[#14b8a6]",
  "bg-[#f59e0b]",
  "bg-[#ef4444]",
  "bg-[#22c55e]",
];

export default function Customers() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    receivePayment,
    areas,
    addArea,
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("all");
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payNotes, setPayNotes] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    area_id: "",
    credit_limit: 0,
    type: "retail",
  });

  const [waModal, setWaModal] = useState(null);
  const [waMsg, setWaMsg] = useState("");

  const formatWhatsAppNumber = (phone) => {
    if (!phone) return "";
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0092")) {
      clean = "92" + clean.slice(4);
    } else if (clean.startsWith("0")) {
      clean = "92" + clean.slice(1);
    } else if (clean.length === 10 && clean.startsWith("3")) {
      clean = "92" + clean;
    }
    return clean;
  };

  const handleOpenWhatsApp = (customer) => {
    const phone = formatWhatsAppNumber(customer.phone);
    const storeName = "QADRI DISTRIBUTOR & TRADERS";
    const balanceFmt = fmt(customer.balance);
    const msg = `Assalam-o-Alaikum ${customer.name},\n\nYeh ek muazziz reminder hai ke ${storeName} ki taraf aapka baqi udhar (Balance) *${balanceFmt}* wajib-ul-ada hai.\n\nBarah-e-karam jald az jald payment clear farma dein.\n\nShukriya!\n*${storeName}*\nHyderabad`;
    setWaModal({ customer, phone, originalPhone: customer.phone });
    setWaMsg(msg);
  };

  const handleSendWhatsApp = () => {
    if (!waModal?.phone) {
      alert("Customer ka phone number mojood nahi hai ya ghalat hai.");
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=${waModal.phone}&text=${encodeURIComponent(waMsg)}`;
    window.open(url, "_blank");
    setWaModal(null);
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      await addArea({ name: newAreaName.trim(), city: "Hyderabad" });
      setNewAreaName("");
      setShowAddAreaModal(false);
    } catch {
      // error handled in context
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (selectedAreaFilter === "all") return true;
    if (selectedAreaFilter === "unassigned") return !c.areaId;
    return String(c.areaId) === String(selectedAreaFilter);
  });

  const totalCustomers = customers.length;
  const totalSales = customers.reduce((s, c) => s + c.totalBuy, 0);
  const totalUdhar = customers.reduce((s, c) => s + c.balance, 0);

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    if (!form.name) return;

    const payload = {
      ...form,
      area_id: form.area_id ? Number(form.area_id) : null,
      credit_limit: Number(form.credit_limit || 0),
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, payload);
      setEditingCustomer(null);
    } else {
      await addCustomer(payload);
    }

    setForm({
      name: "",
      phone: "",
      address: "",
      area_id: "",
      credit_limit: 0,
      type: "retail",
    });

    setShowAdd(false);
  };

  // const handleReceivePayment = () => {
  //   const amt = Number(payAmount);
  //   if (!amt || amt <= 0) return alert('Enter valid amount');
  //   receivePayment(payModal.id, amt);
  //   setPayModal(null);
  //   setPayAmount('');
  // };

  const handleReceivePayment = async (print = false) => {
    const amt = Number(payAmount);

    if (!amt || amt <= 0) {
      return alert("Enter valid amount");
    }

    await receivePayment({
      customerId: payModal.id,

      amount: amt,

      date: payDate,

      notes: payNotes,
    });

    if (print) {
      // PDF next step me connect hoga

      console.log("Print Receipt");
    }

    setPayModal(null);

    setPayAmount("");

    setPayNotes("");

    setPayDate(new Date().toISOString().split("T")[0]);
  };

  const handleSave = async () => {
    await receivePayment({
      customerId: payModal.id,
      amount: Number(payAmount),
      date: payDate,
      notes: payNotes,
    });

    setPayModal(null);
  };

  const handleSaveAndPrint = async () => {
    const res = await receivePayment({
      customerId: payModal.id,
      amount: Number(payAmount),
      date: payDate,
      notes: payNotes,
    });

    window.open(
      `${API_BASE_URL}/customers/${payModal.id}/receipt/${res.payment.id}`,
      "_blank",
    );

    setPayModal(null);
  };
  const handleEdit = (customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
      area_id: customer.areaId || "",
      credit_limit: customer.creditLimit || 0,
      type: customer.type,
    });

    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    await deleteCustomer(id);
  };
  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Shop"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Customer
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Customers"
            value={totalCustomers}
            sub="Registered clients"
            color="accent"
            icon="👥"
          />
          <StatCard
            label="Total Sales"
            value={fmt(totalSales)}
            sub="All time purchases"
            color="green"
            icon="💰"
          />
          <StatCard
            label="Total Udhar"
            value={fmt(totalUdhar)}
            sub="Outstanding receivable"
            color="amber"
            icon="⏳"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[#1e293b] font-semibold">All Customers</h3>
              <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-full font-bold">
                {filteredCustomers.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748b] font-medium whitespace-nowrap">📍 Filter by Area:</span>
              <select
                value={selectedAreaFilter}
                onChange={(e) => setSelectedAreaFilter(e.target.value)}
                className="bg-[#f8fafc] border border-[#cbd5e1] text-[#1e293b] rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#1e3a8a]"
              >
                <option value="all">All Hyderabad Areas ({customers.length})</option>
                <option value="unassigned">Direct / Unassigned Area</option>
                {areas.map((a) => {
                  const count = customers.filter((c) => String(c.areaId) === String(a.id)).length;
                  return (
                    <option key={a.id} value={a.id}>
                      {a.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  {[
                    "Customer",
                    "Area (Hyderabad)",
                    "Phone",
                    "Type",
                    "Total Purchase",
                    "Credit Limit",
                    "Udhar Balance",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[#64748b] text-xs font-semibold uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#e2e8f0]/50 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[#1e293b] text-xs font-bold flex-shrink-0`}
                        >
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="text-[#1e293b] font-medium">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.areaName ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                          <span>📍</span> {c.areaName}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8] text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{c.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full text-xs px-2 py-0.5 ${c.type === "wholesale" ? "bg-[#1e3a8a]/20 text-[#1e3a8a]" : "bg-[#14b8a6]/20 text-[#14b8a6]"}`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1e293b] font-medium">
                      {fmt(c.totalBuy)}
                    </td>
                    <td className="px-4 py-3">
                      {c.creditLimit > 0 ? (
                        <div>
                          <span className="text-[#1e293b] font-semibold">{fmt(c.creditLimit)}</span>
                          {c.balance > c.creditLimit && (
                            <span className="block text-[11px] text-red-600 font-bold mt-0.5">
                              ⚠️ Exceeded by {fmt(c.balance - c.creditLimit)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94a3b8] text-xs">No Limit</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.balance > 0
                            ? "text-[#f59e0b] font-semibold"
                            : "text-[#22c55e]"
                        }
                      >
                        {fmt(c.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {c.balance > 0 && (
                          <button
                            onClick={() => handleOpenWhatsApp(c)}
                            className="text-xs text-[#16a34a] border border-[#16a34a]/30 hover:bg-[#16a34a]/10 px-2 py-1 rounded-lg flex items-center gap-1 transition font-medium"
                            title="Send WhatsApp Payment Reminder"
                          >
                            <span>💬</span> WhatsApp
                          </button>
                        )}

                        {c.balance > 0 && (
                          <button
                            onClick={() => {
                              setPayModal(c);
                              setPayAmount("");
                              setPayNotes("");
                              setPayDate(
                                new Date().toISOString().split("T")[0],
                              );
                            }}
                            className="text-xs text-[#22c55e] border border-[#22c55e]/30 px-2 py-1 rounded-lg hover:bg-[#22c55e]/10 transition"
                          >
                            Receive Payment
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowHistory(true);
                          }}
                          className="text-xs text-sky-500 border border-sky-500/30 px-2 py-1 rounded-lg hover:bg-sky-50 transition"
                        >
                          History
                        </button>

                        <button
                          onClick={() => handleEdit(c)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white px-2 py-1 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center text-[#64748b] py-12"
                    >
                      No customers found for selected area
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className={labelCls}>Customer Name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Fatima Boutique"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="0300-1234567"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={labelCls}>Area / Route (Hyderabad)</label>
              <button
                type="button"
                onClick={() => setShowAddAreaModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                + Add New Area
              </button>
            </div>
            <select
              className={inputCls}
              value={form.area_id}
              onChange={(e) => setForm((p) => ({ ...p, area_id: e.target.value }))}
            >
              <option value="">Select Area in Hyderabad...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Shop Address / Street</label>
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              placeholder="e.g. Main Road, Near Bank"
            />
          </div>
          <div>
            <label className={labelCls}>
              Credit Limit (Rs.) <span className="text-[#94a3b8] font-normal">(0 = No Limit / Unlimited)</span>
            </label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.credit_limit}
              onChange={(e) =>
                setForm((p) => ({ ...p, credit_limit: e.target.value }))
              }
              placeholder="e.g. 50000 (0 for unlimited)"
            />
          </div>
          <div>
            <label className={labelCls}>Customer Type</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setEditingCustomer(null);
              }}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
            >
              {editingCustomer ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </form>
      </Modal>
      {/* Receive Payment Modal */}
      <Modal
        isOpen={!!payModal}
        onClose={() => setPayModal(null)}
        title="Receive Payment"
        size="sm"
      >
        {payModal && (
          <div className="space-y-5">
            {/* Customer Info */}
            <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
              <p className="text-[#64748b] text-xs">Customer</p>

              <p className="text-[#1e293b] font-semibold text-lg">
                {payModal.name}
              </p>

              <p className="text-[#f59e0b] mt-2 font-medium">
                Outstanding :
                <span className="ml-2">{fmt(payModal.balance)}</span>
              </p>
            </div>

            {/* Payment Date */}
            <div>
              <label className={labelCls}>Payment Date</label>

              <input
                type="date"
                className={inputCls}
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div>
              <label className={labelCls}>Amount</label>

              <input
                type="number"
                className={inputCls}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={payModal.balance}
                min="1"
                placeholder="Enter amount..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>

              <textarea
                rows="3"
                className={inputCls}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setPayModal(null)}
                className="px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition"
              >
                Cancel
              </button>

              <button
                onClick={() => handleReceivePayment(false)}
                className="px-5 py-2 bg-[#22c55e] hover:bg-green-500 text-[#1e293b] rounded-lg transition"
              >
                Save
              </button>

              <button
                onClick={() => handleReceivePayment(true)}
                className="px-5 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg transition"
              >
                Save & Print
              </button>
            </div>
          </div>
        )}
      </Modal>
      <CustomerPaymentHistoryModal
        show={showHistory}
        onHide={() => setShowHistory(false)}
        customer={selectedCustomer}
      />

      {/* WhatsApp Payment Reminder Modal */}
      <Modal
        isOpen={!!waModal}
        onClose={() => setWaModal(null)}
        title="Send WhatsApp Payment Reminder"
        size="md"
      >
        {waModal && (
          <div className="space-y-4">
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#64748b] uppercase">Customer</span>
                <span className="text-xs text-[#1e3a8a] bg-[#1e3a8a]/10 px-2 py-0.5 rounded font-medium">
                  {waModal.customer.type}
                </span>
              </div>
              <p className="text-base font-bold text-[#1e293b]">{waModal.customer.name}</p>
              <div className="mt-2 flex flex-wrap justify-between items-center text-xs gap-2">
                <span className="text-[#64748b]">
                  Phone: <strong className="text-[#1e293b]">{waModal.originalPhone || "Not set"}</strong>
                  {waModal.phone && (
                    <span className="text-[#16a34a] ml-1">(WhatsApp: +{waModal.phone})</span>
                  )}
                </span>
                <span className="text-amber-600 font-bold">
                  Pending Udhar: {fmt(waModal.customer.balance)}
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls}>WhatsApp Message (Aap isay zaroorat ke mutabiq edit bhi kar sakte hain)</label>
              <textarea
                rows={6}
                className={inputCls}
                value={waMsg}
                onChange={(e) => setWaMsg(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWaModal(null)}
                className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-black/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 text-sm bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
              >
                <span>💬</span> Open in WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Add Area Modal */}
      <Modal
        isOpen={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        title="Add New Area in Hyderabad"
        size="sm"
      >
        <form onSubmit={handleCreateArea} className="space-y-4">
          <div>
            <label className={labelCls}>Area Name (e.g. Naseem Nagar, Latifabad Unit 7) *</label>
            <input
              type="text"
              className={inputCls}
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="e.g. Citizen Colony Phase 1"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddAreaModal(false)}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-bold shadow"
            >
              Save Area
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

