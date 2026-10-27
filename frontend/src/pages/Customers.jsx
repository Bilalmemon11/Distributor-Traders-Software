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
  const { customers, addCustomer, updateCustomer, deleteCustomer,receivePayment,} = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const [payModal, setPayModal] = useState(null);

  const [showHistory, setShowHistory] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [editingCustomer, setEditingCustomer] = useState(null);

  const [payAmount, setPayAmount] = useState("");

  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [payNotes, setPayNotes] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    type: "retail",
  });

  const totalCustomers = customers.length;
  const totalSales = customers.reduce((s, c) => s + c.totalBuy, 0);
  const totalUdhar = customers.reduce((s, c) => s + c.balance, 0);

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  // const handleAddCustomer = (e) => {
  //   e.preventDefault();
  //   if (!form.name) return;
  //   addCustomer(form);
  //   setForm({ name: '', phone: '', type: 'retail' });
  //   setShowAdd(false);
  // };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    if (!form.name) return;

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, form);

      setEditingCustomer(null);
    } else {
      await addCustomer(form);
    }

    setForm({
      name: "",
      phone: "",
      address: "",
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
          <div className="p-4 border-b border-[#e2e8f0]">
            <h3 className="text-[#1e293b] font-semibold">All Customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  {[
                    "Customer",
                    "Phone",
                    "Type",
                    "Total Purchase",
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
                {customers.map((c, idx) => (
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
                    <td className="px-4 py-3 text-[#64748b]">{c.phone}</td>
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
                      <div className="flex gap-2">
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
                            className="text-xs text-[#22c55e] border border-[#22c55e]/30 px-2 py-1 rounded-lg"
                          >
                            Receive Payment
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowHistory(true);
                          }}
                          className="text-xs text-sky-400 border border-sky-500/30 px-2 py-1 rounded-lg"
                        >
                          History
                        </button>

                        {/* <a
          href={`${API_BASE_URL}/customers/${c.id}/ledger`}
          target="_blank"
          rel="noreferrer"
          className="text-xs border border-purple-500 text-purple-400 px-2 py-1 rounded-lg hover:bg-purple-500 hover:text-[#1e293b] transition"
        >
        Ledger
        </a> */}

                        <button
                          onClick={() => handleEdit(c)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-[#64748b] py-12"
                    >
                      No customers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Customer"
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
              <label className={labelCls}>Address</label>
              <input
                className={inputCls}
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Enter Address"
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
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
            >
              Add Customer
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
    </div>
  );
}

