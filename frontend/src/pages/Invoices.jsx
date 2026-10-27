import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function InvoiceModal({ isOpen, onClose, invoice }) {
  const { customers, products, addInvoice, updateInvoice } = useApp();
  const [barcode, setBarcode] = useState("");

  const handleBarcodeScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcode.trim();
      if (!code) return;

      let foundProduct = null;
      let foundVariant = null;

      for (const p of products) {
        if (p.sku && p.sku.toLowerCase() === code.toLowerCase()) {
          foundProduct = p;
          foundVariant = p.variants?.[0];
          break;
        }
        const vMatch = p.variants?.find((v) => v.sku && v.sku.toLowerCase() === code.toLowerCase());
        if (vMatch) {
          foundProduct = p;
          foundVariant = vMatch;
          break;
        }
      }

      if (foundProduct && foundVariant) {
        const existingIdx = form.items.findIndex(
          (i) => i.productId == foundProduct.id && i.variantId == foundVariant.id
        );

        let newItems = [...form.items];
        let pPrice = foundVariant.sale_price || foundVariant.price || 0;

        if (existingIdx >= 0) {
          newItems[existingIdx].qty = Number(newItems[existingIdx].qty) + 1;
          newItems[existingIdx].total = newItems[existingIdx].qty * newItems[existingIdx].price;
        } else {
          const newItem = {
            productId: foundProduct.id,
            variantId: foundVariant.id,
            productName: foundProduct.name,
            variantName: foundVariant.variant_name,
            qty: 1,
            price: pPrice,
            total: pPrice,
          };
          if (newItems.length === 1 && !newItems[0].productId) {
            newItems = [newItem];
          } else {
            newItems.push(newItem);
          }
        }

        const subtotal = newItems.reduce((acc, i) => acc + Number(i.total || 0), 0);
        let discountAmt = 0;
        if (form.discountType === "percent") {
          discountAmt = (subtotal * Number(form.discount || 0)) / 100;
        } else {
          discountAmt = Number(form.discount || 0);
        }
        const total = subtotal - discountAmt;

        setForm({ ...form, items: newItems, subtotal, total, balance: total - Number(form.paid || 0) });
        setBarcode("");
      } else {
        alert("Product not found: " + code);
        setBarcode("");
      }
    }
  };

  const [form, setForm] = useState({
    customer_id: "",
    date: new Date().toISOString().split("T")[0],

    items: [
      {
        productId: "",
        variantId: "",

        productName: "",
        variantName: "",

        qty: 1,
        price: 0,
        total: 0,
      },
    ],

    discount: 0,
    discountType: "amount",
    paid: 0,
    type: "cash",
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (invoice) {
      setForm({
        customer_id: invoice.customer_id,
        date: invoice.date,

        items: invoice.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,

          productName: item.productName,
          variantName: item.variantName,

          qty: item.qty,
          price: item.price,
          total: item.total,
        })),

        discount: invoice.discount,
        discountType: invoice.discountType || "amount",
        paid: invoice.paid,
        type: invoice.type,
      });
    } else {
      setForm({
        customer_id: "",
        date: new Date().toISOString().split("T")[0],

        items: [
          {
            productId: "",
            variantId: "",

            productName: "",
            variantName: "",

            qty: 1,
            price: 0,
            total: 0,
          },
        ],

        discount: 0,
        discountType: "amount",
        paid: 0,
        type: "cash",
      });
    }
  }, [invoice]);

  const setItem = (idx, key, val) => {
    const items = [...form.items];

    items[idx] = {
      ...items[idx],
      [key]: val,
    };

    // Product Changed
    if (key === "productId") {
      const product = products.find((p) => p.id == val);

      if (product) {
        items[idx].productName = product.name;

        items[idx].variantId = "";
        items[idx].variantName = "";

        items[idx].price = 0;
        items[idx].total = 0;
      }
    }

    // Variant Changed
    if (key === "variantId") {
      const product = products.find((p) => p.id == items[idx].productId);

      const variant = product?.variants?.find((v) => v.id == val);
      console.log(variant);

      if (variant) {
        items[idx].variantName = variant.variant_name;

        items[idx].price = Number(variant.price);

        items[idx].total = Number(variant.price) * Number(items[idx].qty);
      }
    }

    // Qty Changed
    if (key === "qty") {
      items[idx].total = Number(items[idx].price) * Number(val);
    }

    // Price Changed
    if (key === "price") {
      items[idx].total = Number(val) * Number(items[idx].qty);
    }

    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  const addItem = () =>
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          variantId: "",

          productName: "",
          variantName: "",

          qty: 1,
          price: 0,
          total: 0,
        },
      ],
    }));

  const removeItem = (idx) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));

  const subtotal = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0);

  const discountAmount =
    form.discountType === "percent"
      ? subtotal * (Number(form.discount || 0) / 100)
      : Number(form.discount || 0);

  const total = subtotal - discountAmount;
  const balance = total - Number(form.paid || 0);
  const customer = customers.find((c) => c.id == form.customer_id);

  const handleSubmit = async (e) => {
    console.log(form.items);
    e.preventDefault();

    if (!form.customer_id) {
      return alert("Select Customer");
    }

    if (form.items.some((i) => !i.productId || !i.variantId)) {
      return alert("Select Product & Variant");
    }

    const payload = {
      customerId: Number(form.customer_id),

      date: form.date,

      subtotal,

      discount: Number(discountAmount),

      total,

      paid: Number(form.paid),

      balance: Math.max(0, balance),

      type: balance > 0 ? "credit" : "cash",

      items: form.items.map((i) => ({
        productId: Number(i.productId),

        variantId: Number(i.variantId),

        qty: Number(i.qty),

        price: Number(i.price),

        total: Number(i.total),
      })),
    };

    try {
      if (invoice) {
        await updateInvoice(invoice.id, payload);
      } else {
        await addInvoice(payload);
      }

      onClose();
    } catch (err) {
      console.log(err);

      alert("Unable to save invoice.");
    }
  };

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? "Edit Invoice" : "New Invoice"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Customer *</label>
            <select
              className={inputCls}
              value={form.customer_id}
              onChange={(e) => set("customer_id", e.target.value)}
              required
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="mb-4 bg-[#f8fafc] p-3 rounded-lg border border-[#1e3a8a]/30">
            <label className="text-[#1e293b] text-sm font-semibold mb-2 block">📷 Scan Barcode / SKU</label>
            <input 
              type="text" 
              value={barcode} 
              onChange={(e) => setBarcode(e.target.value)} 
              onKeyDown={handleBarcodeScan} 
              placeholder="Click here & scan barcode..." 
              className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#6c63ff]"
            />
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Items *</label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-[#1e3a8a] hover:text-[#1e40af] font-medium"
            >
              + Add Item
            </button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 bg-[#f8fafc] rounded-lg p-3"
              >
                <div className="col-span-4">
                  <select
                    className={inputCls}
                    value={item.productId}
                    onChange={(e) => setItem(idx, "productId", e.target.value)}
                  >
                    <option value="">Select Product</option>

                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <select
                    className={`${inputCls} mt-2`}
                    value={item.variantId}
                    onChange={(e) => setItem(idx, "variantId", e.target.value)}
                  >
                    <option value="">Select Variant</option>

                    {(
                      products.find((p) => p.id == item.productId)?.variants ||
                      []
                    ).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.variant_name}
                        {" | "}
                        Stock : {v.stock_qty}
                        {" | "}
                        Cost : Rs. {v.cost_price}
                        {" | "}
                        Sale : Rs. {v.sale_price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    className={inputCls}
                    value={item.qty}
                    min="1"
                    onChange={(e) =>
                      setItem(idx, "qty", Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Price"
                    className={inputCls}
                    value={item.price}
                    onChange={(e) =>
                      setItem(idx, "price", Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-[#22c55e] text-sm font-medium">
                    {fmt(item.total)}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-[#ef4444] hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-[#f8fafc] rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Discount</label>

            <div className="flex gap-2">
              <input
                type="number"
                className={inputCls}
                value={form.discount}
                min="0"
                onChange={(e) => set("discount", e.target.value)}
              />

              <select
                className="w-28 bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3"
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              >
                <option value="amount">Rs.</option>
                <option value="percent">%</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Amount Paid (Rs.)</label>
            <input
              type="number"
              className={inputCls}
              value={form.paid}
              min="0"
              max={total}
              onChange={(e) => set("paid", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Payment Type</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit (Udhar)</option>
            </select>
          </div>
          <div className="flex flex-col justify-center">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Subtotal:</span>
                <span className="text-[#1e293b]">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Discount:</span>
                <span className="text-[#ef4444]">- {fmt(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-[#e2e8f0] pt-1">
                <span className="text-[#1e293b]">Total:</span>
                <span className="text-[#1e3a8a]">{fmt(total)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-[#64748b]">Balance:</span>
                <span
                  className={balance > 0 ? "text-[#f59e0b]" : "text-[#22c55e]"}
                >
                  {fmt(Math.max(0, balance))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
          >
            {invoice ? "Update Invoice" : "Save Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Invoices() {
  const { invoices, fetchInvoice, deleteInvoice, printInvoice } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [viewInv, setViewInv] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const handleView = async (inv) => {
    try {
      const full = await fetchInvoice(inv.id);
      setViewInv(full);
    } catch {
      setViewInv(inv);
    }
  };

  const totalAmount = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const totalUdhar = invoices.reduce((s, i) => s + i.balance, 0);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;

    try {
      await deleteInvoice(id);
    } catch (err) {
      alert("Unable to delete invoice");
    }
  };

  const handleEdit = (invoice) => {
    alert("Edit invoice coming in next step...");
  };

  const rows = invoices.map((inv) => [
    <span className="text-[#1e3a8a] font-medium">{inv.invoiceNo}</span>,
    inv.date,
    inv.customerName,
    <span className="font-semibold">{fmt(inv.total)}</span>,
    <span className="text-[#22c55e]">{fmt(inv.paid)}</span>,
    <span
      className={
        inv.balance > 0 ? "text-[#f59e0b] font-semibold" : "text-[#64748b]"
      }
    >
      {fmt(inv.balance)}
    </span>,
    <span
      className={`rounded-full text-xs px-2 py-0.5 ${inv.type === "cash" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#f59e0b]/20 text-[#f59e0b]"}`}
    >
      {inv.type === "cash" ? "Cash" : "Udhar"}
    </span>,
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleView(inv)}
        className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white"
      >
        👁 View
      </button>

      <button onClick={() => printInvoice(inv.id, "a4")} className="px-2 py-1 text-xs rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e3a8a] font-semibold">??? A4</button> <button onClick={() => printInvoice(inv.id, "thermal")} className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white">?? Thermal</button>

      <button
        onClick={async () => {
          const data = await fetchInvoice(inv.id);
          setEditingInvoice(data);
          setShowModal(true);
        }}
        className="text-blue-400 hover:text-blue-300"
      >
        ✏ Edit
      </button>
      <button
        onClick={() => handleDelete(inv.id)}
        className="px-2 py-1 text-xs rounded bg-[#ef4444] hover:bg-[#dc2626] text-white"
      >
        🗑 Delete
      </button>
    </div>,
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Sales Invoice"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> New Invoice
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Invoices"
            value={invoices.length}
            sub="All time"
            color="accent"
            icon="🧾"
          />
          <StatCard
            label="Total Amount"
            value={fmt(totalAmount)}
            sub={`Paid: ${fmt(totalPaid)}`}
            color="green"
            icon="💰"
          />
          <StatCard
            label="Pending Udhar"
            value={fmt(totalUdhar)}
            sub="Outstanding balance"
            color="amber"
            icon="⏳"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0]">
            <h3 className="text-[#1e293b] font-semibold">All Invoices</h3>
          </div>
          <Table
            headers={[
              "Invoice #",
              "Date",
              "Customer",
              "Total",
              "Paid",
              "Balance",
              "Type",
              "Action",
            ]}
            rows={rows}
            emptyMessage="No invoices yet. Create your first invoice!"
          />
        </div>
      </div>

      {/* <InvoiceModal isOpen={showModal} onClose={() => setShowModal(false)} /> */}
      <InvoiceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingInvoice(null);
        }}
        invoice={editingInvoice}
      />

      {/* View Invoice Modal */}
      <Modal
        isOpen={!!viewInv}
        onClose={() => setViewInv(null)}
        title={`Invoice: ${viewInv?.invoiceNo}`}
        size="md"
      >
        {viewInv && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#64748b]">Customer:</span>{" "}
                <span className="text-[#1e293b] font-medium ml-1">
                  {viewInv.customerName}
                </span>
              </div>
              <div>
                <span className="text-[#64748b]">Date:</span>{" "}
                <span className="text-[#1e293b] ml-1">{viewInv.date}</span>
              </div>
              <div>
                <span className="text-[#64748b]">Type:</span>{" "}
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs ${viewInv.type === "cash" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#f59e0b]/20 text-[#f59e0b]"}`}
                >
                  {viewInv.type}
                </span>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left text-[#64748b] text-xs px-4 py-2">
                      Product
                    </th>
                    <th className="text-right text-[#64748b] text-xs px-4 py-2">
                      Qty
                    </th>
                    <th className="text-right text-[#64748b] text-xs px-4 py-2">
                      Price
                    </th>
                    <th className="text-right text-[#64748b] text-xs px-4 py-2">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {viewInv.items.map((item, i) => (
                    <tr key={i} className="border-b border-[#e2e8f0]">
                      <td className="px-4 py-2 text-[#1e293b]">
                        {item.productName}
                      </td>
                      <td className="px-4 py-2 text-right text-[#64748b]">
                        {item.qty}
                      </td>
                      <td className="px-4 py-2 text-right text-[#64748b]">
                        {fmt(item.price)}
                      </td>
                      <td className="px-4 py-2 text-right text-[#1e293b]">
                        {fmt(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="text-[#1e293b]">{fmt(viewInv.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Discount</span>
                <span className="text-[#ef4444]">
                  - {fmt(viewInv.discount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#e2e8f0] pt-2 font-bold">
                <span className="text-[#1e293b]">Total</span>
                <span className="text-[#1e3a8a]">{fmt(viewInv.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Paid</span>
                <span className="text-[#22c55e]">{fmt(viewInv.paid)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-[#64748b]">Balance</span>
                <span
                  className={
                    viewInv.balance > 0 ? "text-[#f59e0b]" : "text-[#22c55e]"
                  }
                >
                  {fmt(viewInv.balance)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
