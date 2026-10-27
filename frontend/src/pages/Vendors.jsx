import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import VendorPaymentHistoryModal from "../components/vendors/VendorPaymentHistoryModal";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function Vendors() {
  const { vendors, addVendor, payVendor, updateVendor, deleteVendor } =
    useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [form, setForm] = useState({ name: "", city: "", phone: "" });

  const totalVendors = vendors.length;
  const totalPurchases = vendors.reduce((s, v) => s + v.totalPurchase, 0);
  const totalPayable = vendors.reduce((s, v) => s + v.balance, 0);

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  const [editVendor, setEditVendor] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
  });

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!form.name) return;
    addVendor(form);
    setForm({ name: "", city: "", phone: "" });
    setShowAdd(false);
  };

  const handlePayVendor = () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return alert("Enter valid amount");
    payVendor(payModal.id, amt, payDate);
    setPayModal(null);
    setPayAmount("");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Supplier"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Vendor
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Vendors"
            value={totalVendors}
            sub="Suppliers"
            color="accent"
            icon="🏪"
          />
          <StatCard
            label="Total Purchases"
            value={fmt(totalPurchases)}
            sub="All time"
            color="teal"
            icon="🛒"
          />
          <StatCard
            label="Total Payable"
            value={fmt(totalPayable)}
            sub="Amount owed"
            color="red"
            icon="💳"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0]">
            <h3 className="text-[#1e293b] font-semibold">All Vendors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  {[
                    "Vendor Name",
                    "City",
                    "Phone",
                    "Total Purchase",
                    "Balance (Baaki)",
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
                {vendors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[#e2e8f0]/50 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6] text-xs font-bold flex-shrink-0">
                          {v.name.charAt(0)}
                        </div>
                        <p className="text-[#1e293b] font-medium">{v.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{v.city}</td>
                    <td className="px-4 py-3 text-[#64748b]">{v.phone}</td>
                    <td className="px-4 py-3 text-[#1e293b] font-medium">
                      {fmt(v.totalPurchase)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          v.balance > 0
                            ? "text-[#ef4444] font-semibold"
                            : "text-[#22c55e] font-medium"
                        }
                      >
                        {v.balance > 0 ? fmt(v.balance) : "✅ Clear"}
                      </span>
                    </td>
                    <td className="px-4 py-4 flex items-center gap-2">
                      {v.balance > 0 && (
                        <button
                          onClick={() => {
                            setPayModal(v);
                            setPayAmount("");
                            setPayDate(new Date().toISOString().split("T")[0]);
                          }}
                          className="text-xs text-[#1e3a8a] border border-[#1e3a8a]/30 px-2 py-1 rounded-lg hover:bg-[#1e3a8a]/10 transition-all font-medium"
                        >
                          Pay Vendor
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedVendor(v);
                          setShowHistory(true);
                        }}
                        className="text-xs text-sky-400 border border-sky-500/40 px-2 py-1 rounded-lg hover:bg-sky-500/10 transition-all font-medium"
                      >
                        History
                      </button>
                      <button
                        onClick={() => {
                          setEditVendor(v);

                          setEditForm({
                            name: v.name,
                            phone: v.phone,
                            city: v.city,
                          });
                        }}
                        className="text-xs text-yellow-400 border border-yellow-500/40 px-2 py-1 rounded-lg hover:bg-yellow-500/10"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Delete this vendor?")) {
                            deleteVendor(v.id);
                          }
                        }}
                        className="text-xs text-red-400 border border-red-500/40 px-2 py-1 rounded-lg hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-[#64748b] py-12"
                    >
                      No vendors added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Vendor"
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div>
            <label className={labelCls}>Vendor Name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Al-Hamd Fabrics"
              required
            />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input
              className={inputCls}
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Faisalabad"
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
              placeholder="041-1234567"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
            >
              Add Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Vendor Modal */}
      <Modal
        isOpen={!!payModal}
        onClose={() => setPayModal(null)}
        title="Pay Vendor"
        size="sm"
      >
        {payModal && (
          <div className="space-y-4">
            <div className="bg-[#f8fafc] rounded-lg p-4">
              <p className="text-[#64748b] text-xs mb-1">Vendor</p>
              <p className="text-[#1e293b] font-semibold">{payModal.name}</p>
              <p className="text-[#ef4444] text-sm mt-1">
                Outstanding: {fmt(payModal.balance)}
              </p>
            </div>
            <div>
              <label className={labelCls}>Payment Date</label>
              <input
                type="date"
                className={inputCls}
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Amount (Rs.) *</label>
              <input
                type="number"
                className={inputCls}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={payModal.balance}
                min="1"
                placeholder="Enter amount..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPayModal(null)}
                className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayVendor}
                className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={!!editVendor}
        onClose={() => setEditVendor(null)}
        title="Edit Vendor"
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Vendor Name</label>

            <input
              className={inputCls}
              value={editForm.name}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className={labelCls}>Phone</label>

            <input
              className={inputCls}
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className={labelCls}>City</label>

            <input
              className={inputCls}
              value={editForm.city}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  city: e.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditVendor(null)}
              className="px-4 py-2 border border-[#e2e8f0] rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                updateVendor({
                  id: editVendor.id,
                  ...editForm,
                });

                setEditVendor(null);
              }}
              className="px-5 py-2 bg-[#1e3a8a] text-white rounded-lg"
            >
              Save Changes
            </button>

          </div>
        </div>
      </Modal>
      <VendorPaymentHistoryModal
        show={showHistory}
        onClose={() => setShowHistory(false)}
        vendor={selectedVendor}
      />
    </div>
  );
}
