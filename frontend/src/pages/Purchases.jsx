import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";
import { API_BASE_URL } from "../config";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function Purchases() {
  const { purchases, vendors, products, addPurchase, fetchPurchase, updatePurchase, deletePurchase } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewPurchase, setViewPurchase] = useState(null);
  const [showView, setShowView] = useState(false);
  
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
        let pPrice = foundVariant.cost_price || 0; // Purchase price is cost_price

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
    vendorId: "",
    date: new Date().toISOString().split("T")[0],
    paid: "",
    items: [
      {
        productId: "",
        variantId: "",
        qty: 1,
        unitCost: "",
      },
    ],
  });
  useEffect(() => {
    if (!editingPurchase) return;

    setForm({
      vendorId: editingPurchase.vendorId,
      date: editingPurchase.date,
      paid: editingPurchase.paid,
      items: editingPurchase.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        qty: item.qty,
        unitCost: item.unitCost,
      })),
    });
  }, [editingPurchase]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const totalPurchased = purchases.reduce((s, p) => s + p.total, 0);
  const totalPaid = purchases.reduce((s, p) => s + p.paid, 0);
  const totalBalance = purchases.reduce((s, p) => s + p.balance, 0);

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";
  const grandTotal = form.items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.unitCost || 0),
    0,
  );

  const balance = grandTotal - Number(form.paid || 0);

  const updateItem = (index, field, value) => {
    const items = [...form.items];

    items[index][field] = value;

    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          variantId: "",
          qty: 1,
          unitCost: "",
        },
      ],
    }));
  };

  const removeItemRow = (index) => {
    if (form.items.length === 1) return;

    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const vendor = vendors.find((v) => v.id == form.vendorId);

    if (!vendor) {
      alert("Select Vendor");
      return;
    }

    if (form.items.some((i) => !i.productId || !i.variantId)) {
      alert("Please select both Product and Variant for all items.");
      return;
    }

    const payload = {
      vendorId: Number(form.vendorId),
      date: form.date,
      paid: Number(form.paid || 0),

      items: form.items.map((i) => ({
        productId: Number(i.productId),
        variantId: Number(i.variantId),
        qty: Number(i.qty),
        unitCost: Number(i.unitCost),
      })),
    };

    try {
      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, payload);
      } else {
        await addPurchase(payload);
      }

      setForm({
        vendorId: "",
        date: new Date().toISOString().split("T")[0],
        paid: "",
        items: [
          {
            productId: "",
            qty: 1,
            unitCost: "",
          },
        ],
      });

      setEditingPurchase(null);
      setShowAdd(false);
    } catch (err) { }
  };


  const rows = purchases.map((p) => [
    <span className="text-[#1e3a8a] font-medium">{p.poNo}</span>,

    p.date,

    p.vendorName,

    <span className="text-[#64748b]">
      {p.items.length} Items
    </span>,

    <span className="font-semibold">
      {fmt(p.total)}
    </span>,

    <span className="text-[#22c55e]">
      {fmt(p.paid)}
    </span>,

    <span
      className={
        p.balance > 0
          ? "text-[#ef4444] font-semibold"
          : "text-[#64748b]"
      }
    >
      {fmt(p.balance)}
    </span>,

    <div className="flex gap-2">

      <button
        onClick={async () => {

          const data = await fetchPurchase(p.id);

          setViewPurchase(data);

          setShowView(true);

        }}
        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
      >

        👁 View

      </button>

      <button
        onClick={async () => {

          const data = await fetchPurchase(p.id);

          setEditingPurchase(data);

          setShowAdd(true);

        }}
        className="px-2 py-1 rounded bg-blue-600 text-white text-xs"
      >

        ✏ Edit

      </button>

      <button
          onClick={() => window.open(API_BASE_URL + "/purchases/" + p.id + "/print", "_blank")}
          className="px-2 py-1 rounded bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-medium transition-colors"
        >
          Print
        </button>

        <button
          onClick={async () => {

            if (!window.confirm("Delete Purchase?")) return;

          await deletePurchase(p.id);

        }}
        className="px-2 py-1 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-medium transition-colors"
      >

        🗑 Delete

      </button>

    </div>
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Purchase Stock"
        action={
          <button
            onClick={() => {
              setEditingPurchase(null);

              setForm({
                vendorId: "",
                date: new Date().toISOString().split("T")[0],
                paid: "",
                items: [
                  {
                    productId: "",
                    variantId: "",
                    qty: 1,
                    unitCost: "",
                  },
                ],
              });

              setShowAdd(true);
            }}
            className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> New Purchase
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Purchased"
            value={fmt(totalPurchased)}
            sub={`${purchases.length} orders`}
            color="accent"
            icon="🛒"
          />
          <StatCard
            label="Amount Paid"
            value={fmt(totalPaid)}
            sub="To vendors"
            color="green"
            icon="✅"
          />
          <StatCard
            label="Balance Due"
            value={fmt(totalBalance)}
            sub="Pending payment"
            color="red"
            icon="⏳"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <div className="p-4 border-b border-[#e2e8f0]">
            <h3 className="text-[#1e293b] font-semibold">
              All Purchase Orders
            </h3>
          </div>
          <Table
            headers={[
              "PO #",
              "Date",
              "Vendor",
              "Items",
              "Total",
              "Paid",
              "Balance",
              "Action",
            ]}
            rows={rows}
            emptyMessage="No purchases recorded yet"
          />
        </div>
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title={editingPurchase ? "Edit Purchase" : "New Purchase Order"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vendor *</label>
              <select
                className={inputCls}
                value={form.vendorId}
                onChange={(e) => set("vendorId", e.target.value)}
                required
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
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
          <div className="space-y-3">
            <div className="mb-4 bg-[#f8fafc] p-3 rounded-lg border border-[#1e3a8a]/30">
              <label className="text-[#1e293b] text-sm font-semibold mb-2 block">?? Scan Barcode / SKU</label>
              <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={handleBarcodeScan} placeholder="Click here & scan barcode..." className="w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#6c63ff]"/>
            </div>
            <div className="flex justify-between items-center">
              <label className={labelCls}>Purchase Items</label>

              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1 bg-[#1e3a8a] text-white rounded text-xs"
              >
                + Add Item
              </button>
            </div>

            {form.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <label className={labelCls}>Product</label>
                  <select
                    className={inputCls}
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <label className={labelCls}>Variant</label>
                  <select
                    className={inputCls}
                    value={item.variantId || ""}
                    onChange={(e) => {
                      updateItem(index, "variantId", e.target.value);
                      const prod = products.find(p => p.id == item.productId);
                      const vari = prod?.variants?.find(v => v.id == e.target.value);
                      if(vari) {
                         updateItem(index, "unitCost", vari.cost_price);
                      }
                    }}
                  >
                    <option value="">Select Variant</option>
                    {(products.find((p) => p.id == item.productId)?.variants || []).map((v) => (
                      <option key={v.id} value={v.id}>{v.variant_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={labelCls}>Qty</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={item.qty}
                    min="1"
                    onChange={(e) => updateItem(index, "qty", e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelCls}>Cost</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, "unitCost", e.target.value)}
                  />
                </div>

                <div className="col-span-1 text-center">
                  <label className={labelCls}>Total</label>
                  <div className="h-10 flex items-center justify-center text-[#1e293b] text-xs font-semibold overflow-hidden">
                    {fmt(item.qty * item.unitCost)}
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="text-red-500 text-xl h-10 w-full flex items-center justify-end"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div>
              <label className={labelCls}>Amount Paid</label>

              <input
                type="number"
                className={inputCls}
                value={form.paid}
                onChange={(e) => set("paid", e.target.value)}
              />
            </div>

            <div className="bg-[#f8fafc] rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Grand Total</span>
                <strong>{fmt(grandTotal)}</strong>
              </div>

              <div className="flex justify-between">
                <span>Paid</span>
                <strong>{fmt(form.paid)}</strong>
              </div>

              <div className="flex justify-between">
                <span>Balance</span>
                <strong className="text-red-400">{fmt(balance)}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowAdd(false); setEditingPurchase(null); }}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-medium transition-colors"
            >
              {editingPurchase ? "Update Purchase" : "Save Purchase"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={showView}
        onClose={() => {
          setShowView(false);
          setViewPurchase(null);
        }}
        title="Purchase Details"
      >

        {viewPurchase && (

          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">

              <div>

                <p className="text-gray-400 text-sm">
                  PO Number
                </p>

                <p className="font-semibold">
                  {viewPurchase.poNo}
                </p>

              </div>

              <div>

                <p className="text-gray-400 text-sm">
                  Vendor
                </p>

                <p className="font-semibold">
                  {viewPurchase.vendorName}
                </p>

              </div>

              <div>

                <p className="text-gray-400 text-sm">
                  Date
                </p>

                <p>
                  {viewPurchase.date}
                </p>

              </div>

              <div>

                <p className="text-gray-400 text-sm">
                  Paid
                </p>

                <p className="text-green-500">

                  {fmt(viewPurchase.paid)}

                </p>

              </div>

              <div>

                <p className="text-gray-400 text-sm">
                  Balance
                </p>

                <p className="text-red-500">

                  {fmt(viewPurchase.balance)}

                </p>

              </div>

              <div>

                <p className="text-gray-400 text-sm">
                  Grand Total
                </p>

                <p>

                  {fmt(viewPurchase.total)}

                </p>

              </div>

            </div>

            <div className="border rounded-lg overflow-hidden">

              <table className="w-full">

                <thead className="bg-[#1f2937] text-white">

                  <tr>

                    <th className="p-2 text-left">
                      Product
                    </th>

                    <th className="p-2">
                      Qty
                    </th>

                    <th className="p-2">
                      Cost
                    </th>

                    <th className="p-2">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {viewPurchase.items.map((item, index) => (

                    <tr
                      key={index}
                      className="border-t border-[#e2e8f0]"
                    >

                      <td className="p-2">
                        {item.productName}
                      </td>

                      <td className="text-center">
                        {item.qty}
                      </td>

                      <td className="text-center">
                        {fmt(item.unitCost)}
                      </td>

                      <td className="text-center">
                        {fmt(item.total)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </Modal>
    </div>
  );
}
