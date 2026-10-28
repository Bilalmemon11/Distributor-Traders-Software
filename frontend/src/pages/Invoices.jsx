import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function InvoiceModal({ isOpen, onClose, invoice, initialData }) {
  const { customers, products, addInvoice, updateInvoice, holdInvoice, salesmen, deliveryMen } = useApp();
  const [barcode, setBarcode] = useState("");
  const [scanFeedback, setScanFeedback] = useState("");
  const barcodeInputRef = useRef(null);

  const [form, setForm] = useState({
    customer_id: "",
    salesman_id: salesmen?.[0]?.id || "",
    delivery_man_id: deliveryMen?.[0]?.id || 1,
    delivery_status: "delivered",
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
    cashPaid: 0,
    onlinePaid: 0,
    onlineMethod: "JazzCash",
    paymentNotes: "",
    type: "cash",
  });

  const [showCreditLimitModal, setShowCreditLimitModal] = useState(false);
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (invoice) {
      setForm({
        customer_id: invoice.customerId,
        salesman_id: invoice.salesmanId || salesmen?.[0]?.id || "",
        delivery_man_id: invoice.deliveryManId || deliveryMen?.[0]?.id || 1,
        delivery_status: invoice.deliveryStatus || "delivered",
        date: invoice.date,
        items: (invoice.items || []).map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          qty: item.qty,
          price: item.price,
          total: item.total,
        })),
        discount: invoice.discount || 0,
        discountType: invoice.discountType || "amount",
        paid: invoice.paid || 0,
        cashPaid: invoice.cashPaid || 0,
        onlinePaid: invoice.onlinePaid || 0,
        onlineMethod: invoice.onlineMethod || "JazzCash",
        paymentNotes: invoice.paymentNotes || "",
        type: invoice.type || "cash",
      });
    } else if (initialData) {
      setForm({
        customer_id: initialData.customer_id || "",
        salesman_id: initialData.salesman_id || salesmen?.[0]?.id || "",
        delivery_man_id: initialData.delivery_man_id || deliveryMen?.[0]?.id || 1,
        delivery_status: initialData.delivery_status || "delivered",
        date: initialData.date || new Date().toISOString().split("T")[0],
        items: initialData.items && initialData.items.length > 0 ? initialData.items : [
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
        discount: initialData.discount || 0,
        discountType: initialData.discountType || "amount",
        paid: initialData.paid || 0,
        cashPaid: initialData.cashPaid || 0,
        onlinePaid: initialData.onlinePaid || 0,
        onlineMethod: initialData.onlineMethod || "JazzCash",
        paymentNotes: initialData.paymentNotes || "",
        type: initialData.type || "cash",
      });
    } else {
      setForm({
        customer_id: "",
        salesman_id: salesmen?.[0]?.id || "",
        delivery_man_id: deliveryMen?.[0]?.id || 1,
        delivery_status: "delivered",
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
        cashPaid: 0,
        onlinePaid: 0,
        onlineMethod: "JazzCash",
        paymentNotes: "",
        type: "cash",
      });
    }
  }, [invoice, initialData, isOpen, salesmen, deliveryMen]);

  // Play audio beep on successful barcode scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleBarcodeSubmit = (e) => {
    if (e) e.preventDefault();
    const code = barcode.trim();
    if (!code) return;

    let foundProduct = null;
    let foundVariant = null;

    for (const p of products) {
      // 1. Check variant barcode
      const bMatch = (p.variants || []).find(
        (v) => v.barcode && v.barcode.toLowerCase() === code.toLowerCase()
      );
      if (bMatch) {
        foundProduct = p;
        foundVariant = bMatch;
        break;
      }

      // 2. Check variant SKU
      const vMatch = (p.variants || []).find(
        (v) => v.sku && v.sku.toLowerCase() === code.toLowerCase()
      );
      if (vMatch) {
        foundProduct = p;
        foundVariant = vMatch;
        break;
      }

      // 3. Check product SKU
      if (p.sku && p.sku.toLowerCase() === code.toLowerCase()) {
        foundProduct = p;
        foundVariant = (p.variants || [])[0];
        break;
      }
    }

    if (foundProduct && foundVariant) {
      playBeep();
      const existingIdx = form.items.findIndex(
        (i) => i.productId == foundProduct.id && i.variantId == foundVariant.id
      );

      let newItems = [...form.items];
      const pPrice = Number(foundVariant.price || foundVariant.sale_price || 0);

      if (existingIdx >= 0) {
        const newQty = Number(newItems[existingIdx].qty || 0) + 1;
        newItems[existingIdx].qty = newQty;
        newItems[existingIdx].total = newQty * Number(newItems[existingIdx].price || pPrice);
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

      setForm((prev) => ({
        ...prev,
        items: newItems,
      }));

      setScanFeedback(`✓ Added: ${foundProduct.name} (${foundVariant.variant_name})`);
      setTimeout(() => setScanFeedback(""), 2200);
      setBarcode("");
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    } else {
      alert(`Product with Barcode / SKU "${code}" not found.`);
      setBarcode("");
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }
  };

  const setItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: val };

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

    if (key === "variantId") {
      const product = products.find((p) => p.id == items[idx].productId);
      const variant = product?.variants?.find((v) => v.id == val);
      if (variant) {
        items[idx].variantName = variant.variant_name;
        items[idx].price = Number(variant.price);
        items[idx].total = Number(variant.price) * Number(items[idx].qty);
      }
    }

    if (key === "qty") {
      items[idx].total = Number(items[idx].price) * Number(val);
    }

    if (key === "price") {
      items[idx].total = Number(val) * Number(items[idx].qty);
    }

    setForm((prev) => ({ ...prev, items }));
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

  const total = Math.max(0, subtotal - discountAmount);

  // Auto-sync payment values based on payment type
  const handlePaymentTypeChange = (newType) => {
    if (newType === "cash") {
      setForm((p) => ({ ...p, type: newType, paid: total, cashPaid: total, onlinePaid: 0 }));
    } else if (newType === "online") {
      setForm((p) => ({ ...p, type: newType, paid: total, onlinePaid: total, cashPaid: 0 }));
    } else if (newType === "credit") {
      setForm((p) => ({ ...p, type: newType, paid: 0, cashPaid: 0, onlinePaid: 0 }));
    } else if (newType === "split") {
      const half = Math.floor(total / 2);
      setForm((p) => ({
        ...p,
        type: newType,
        cashPaid: half,
        onlinePaid: total - half,
        paid: total,
      }));
    }
  };

  let effectivePaid = 0;
  if (form.type === "split") {
    effectivePaid = Number(form.cashPaid || 0) + Number(form.onlinePaid || 0);
  } else if (form.type === "online") {
    effectivePaid = Number(form.onlinePaid || 0);
  } else if (form.type === "credit") {
    effectivePaid = Number(form.paid || 0);
  } else {
    effectivePaid = Number(form.cashPaid !== undefined && form.cashPaid !== "" ? form.cashPaid : (form.paid || 0));
  }

  const balance = Math.max(0, total - effectivePaid);
  const customer = customers.find((c) => c.id == form.customer_id);

  // Credit Limit Calculations
  const creditLimit = Number(customer?.creditLimit || 0);
  const currentBalance = Number(customer?.balance || 0);
  const newProjectedBalance = currentBalance + balance;
  const isOverCreditLimit = creditLimit > 0 && newProjectedBalance > creditLimit && balance > 0;
  const exceededAmount = isOverCreditLimit ? newProjectedBalance - creditLimit : 0;

  const handleHold = async () => {
    const validItems = form.items.filter((i) => i.productId && i.variantId);
    if (validItems.length === 0) {
      return alert("Please add at least one product before holding the invoice.");
    }

    const defaultName = customer ? `${customer.name} (Hold)` : "Counter Hold";
    const holdName = window.prompt("Enter customer name or note for holding this invoice:", defaultName);
    if (holdName === null) return; // cancelled

    try {
      await holdInvoice({
        hold_name: holdName || defaultName,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        customer_name: customer?.name || holdName || "Walk-in Customer",
        total: total,
        items_count: validItems.length,
        invoice_data: {
          ...form,
          subtotal,
          total,
          balance,
        },
      });

      alert("Invoice parked / held successfully!");
      onClose();
    } catch {
      // error handled in context
    }
  };

  const handleSubmit = async (e, forceApprove = false) => {
    if (e) e.preventDefault();

    if (!form.customer_id) {
      return alert("Select Customer");
    }

    if (form.items.some((i) => !i.productId || !i.variantId)) {
      return alert("Please select Product & Variant for all items.");
    }

    if (isOverCreditLimit && !forceApprove) {
      setShowCreditLimitModal(true);
      return;
    }

    const payload = {
      customerId: Number(form.customer_id),
      salesman_id: form.salesman_id ? Number(form.salesman_id) : (salesmen?.[0]?.id || null),
      delivery_man_id: form.delivery_man_id ? Number(form.delivery_man_id) : (deliveryMen?.[0]?.id || 1),
      delivery_status: form.delivery_status || "delivered",
      date: form.date,
      subtotal,
      discount: Number(discountAmount),
      total,
      paid: effectivePaid,
      cashPaid: form.type === "split" ? Number(form.cashPaid || 0) : form.type === "cash" ? effectivePaid : 0,
      onlinePaid: form.type === "split" ? Number(form.onlinePaid || 0) : form.type === "online" ? effectivePaid : 0,
      onlineMethod: form.type === "split" || form.type === "online" ? form.onlineMethod : null,
      paymentNotes: form.paymentNotes || null,
      balance: Math.max(0, balance),
      type: form.type,
      allow_exceed_credit_limit: isOverCreditLimit ? true : false,
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
      setShowCreditLimitModal(false);
      onClose();
    } catch {
      // error handled in context
    }
  };

  const inputCls =
    "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none transition-colors";
  const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? "Edit Invoice" : "New Sales Invoice"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {c.name} {c.phone ? `(${c.phone})` : ""} {c.creditLimit > 0 ? `[Limit: Rs ${Number(c.creditLimit).toLocaleString()}]` : ""}
                </option>
              ))}
            </select>
            {customer && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#64748b]">
                  Current Udhar: <strong className={customer.balance > 0 ? "text-amber-600" : "text-[#16a34a]"}>{fmt(customer.balance)}</strong>
                </span>
                <span className="text-[#cbd5e1]">•</span>
                <span className="text-[#64748b]">
                  Credit Limit: <strong className="text-[#1e293b]">{customer.creditLimit > 0 ? fmt(customer.creditLimit) : "Unlimited"}</strong>
                </span>
                {isOverCreditLimit && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[11px]">
                    ⚠️ Over Limit (+{fmt(exceededAmount)})
                  </span>
                )}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Salesman / Booker</label>
            <select
              className={inputCls}
              value={form.salesman_id || ""}
              onChange={(e) => set("salesman_id", e.target.value)}
            >
              <option value="">Direct / Self (Admin)</option>
              {salesmen?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.commission_rate > 0 ? `(${s.commission_rate}%)` : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#64748b] block mt-1">
              {form.salesman_id && salesmen?.find(s => s.id === Number(form.salesman_id))?.commission_rate > 0 
                ? `Commission: ${salesmen.find(s => s.id === Number(form.salesman_id)).commission_rate}% (Rs. ${Math.round((subtotal * salesmen.find(s => s.id === Number(form.salesman_id)).commission_rate) / 100)})`
                : "Default: Direct Sale (Self)"}
            </span>
          </div>
          <div>
            <label className={labelCls}>🚚 Supply / Delivery Staff</label>
            <select
              className={inputCls}
              value={form.delivery_man_id || ""}
              onChange={(e) => set("delivery_man_id", e.target.value)}
            >
              <option value="">Self / Direct (Counter)</option>
              {deliveryMen?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.vehicle_no ? `(${d.vehicle_no})` : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#64748b] block mt-1">
              Default: Self / Warehouse Counter
            </span>
          </div>
          <div>
            <label className={labelCls}>Invoice Date</label>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
        </div>

        {/* Barcode Scanner Box (Gun + Manual) */}
        <div className="bg-[#f0f4ff] border border-[#c7d2fe] p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#1e3a8a] flex items-center gap-1.5">
              <span>📷</span> Barcode Scanner / SKU Quick Add
            </span>
            {scanFeedback && (
              <span className="text-xs font-semibold text-[#16a34a] animate-pulse">
                {scanFeedback}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleBarcodeSubmit();
                }
              }}
              placeholder="Scan with barcode gun or type SKU / Barcode & press Enter..."
              className="flex-1 bg-white border border-[#c7d2fe] text-[#1e293b] text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#4f46e5] font-mono shadow-sm"
            />
            <button
              type="button"
              onClick={handleBarcodeSubmit}
              className="px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>+</span> Add
            </button>
          </div>
          <p className="text-[11px] text-[#64748b] mt-1.5">
            Scanner gun automatically adds item. If you don't have a scanner, type the code and click <strong>Add</strong> or press <strong>Enter</strong>.
          </p>
        </div>

        {/* Invoice Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Items / Products *</label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-[#1e3a8a] hover:text-[#1e40af] font-semibold flex items-center gap-1"
            >
              <span>+</span> Add Product Manually
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2.5 items-center"
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
                <div className="col-span-3">
                  <select
                    className={inputCls}
                    value={item.variantId}
                    onChange={(e) => setItem(idx, "variantId", e.target.value)}
                  >
                    <option value="">Select Variant</option>
                    {(
                      products.find((p) => p.id == item.productId)?.variants ||
                      []
                    ).map((v) => {
                      let expWarning = "";
                      if (v.expiry_date) {
                        const diffDays = Math.ceil((new Date(v.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                        if (diffDays < 0) expWarning = " 🔴 EXPIRED!";
                        else if (diffDays <= 30) expWarning = ` ⚠️ Exp in ${diffDays}d!`;
                      }
                      return (
                        <option key={v.id} value={v.id}>
                          {v.variant_name} (Stock: {v.stock_qty}){v.batch_no ? ` [B: ${v.batch_no}]` : ""}{expWarning}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-span-1">
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
                <div className="col-span-2">
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
                <div className="col-span-1 text-right">
                  <span className="text-[#15803d] text-xs font-bold block">
                    {fmt(item.total)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-[#ef4444] hover:text-red-700 text-sm font-bold p-1"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Limit Warning Alert */}
        {isOverCreditLimit && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
            <span className="text-xl">⚠️</span>
            <div className="text-xs text-amber-900 flex-1">
              <div className="font-bold text-sm text-amber-800 flex items-center justify-between">
                <span>Credit Limit Warning (Udhar Hadd Se Zyada)</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold text-[11px]">
                  Approval Required
                </span>
              </div>
              <p className="mt-1 text-amber-800">
                Customer ki credit limit <strong>{fmt(creditLimit)}</strong> hai. Maujooda Udhar <strong>{fmt(currentBalance)}</strong> hai aur is bill ka udhar <strong>{fmt(balance)}</strong> mila kar kul <strong>{fmt(newProjectedBalance)}</strong> banega.
              </p>
              <p className="text-red-600 font-bold mt-1">
                Limit se zyada raqam: <strong>{fmt(exceededAmount)}</strong>. Bill save karne ke liye Admin Approval confirmation darkar hogi.
              </p>
            </div>
          </div>
        )}

        {/* Totals & Split Payment Section */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-24 bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-2 text-sm font-medium"
                  value={form.discountType}
                  onChange={(e) => set("discountType", e.target.value)}
                >
                  <option value="amount">Rs.</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Payment Method / Mode</label>
              <select
                className={`${inputCls} font-semibold text-[#1e3a8a]`}
                value={form.type}
                onChange={(e) => handlePaymentTypeChange(e.target.value)}
              >
                <option value="cash">💵 Full Cash</option>
                <option value="online">📱 Full Online (Bank / JazzCash / EasyPaisa)</option>
                <option value="split">⚡ Split Payment (Cash + Online)</option>
                <option value="credit">⏳ Credit (Udhar / Pay Later)</option>
              </select>
            </div>
          </div>

          {/* Conditional Payment Inputs */}
          {form.type === "split" && (
            <div className="bg-white border border-[#c7d2fe] p-3.5 rounded-lg space-y-3">
              <span className="text-xs font-bold text-[#4338ca] block">
                ⚡ Split Payment Details (Cash + Online)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>💵 Cash Received (Rs.)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.cashPaid}
                    min="0"
                    onChange={(e) => set("cashPaid", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelCls}>📱 Online Received (Rs.)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.onlinePaid}
                    min="0"
                    onChange={(e) => set("onlinePaid", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Online Gateway</label>
                  <select
                    className={inputCls}
                    value={form.onlineMethod}
                    onChange={(e) => set("onlineMethod", e.target.value)}
                  >
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Raast">Raast</option>
                    <option value="SadaPay">SadaPay / NayaPay</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Payment Note / Trx ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Trx ID #123456 or Bank Alfalah Ref"
                  className={inputCls}
                  value={form.paymentNotes}
                  onChange={(e) => set("paymentNotes", e.target.value)}
                />
              </div>
            </div>
          )}

          {form.type === "online" && (
            <div className="bg-white border border-[#e2e8f0] p-3.5 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Online Amount Paid (Rs.)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.onlinePaid}
                    min="0"
                    onChange={(e) => set("onlinePaid", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Online Gateway</label>
                  <select
                    className={inputCls}
                    value={form.onlineMethod}
                    onChange={(e) => set("onlineMethod", e.target.value)}
                  >
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Raast">Raast</option>
                    <option value="SadaPay">SadaPay / NayaPay</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Payment Note / Trx ID</label>
                <input
                  type="text"
                  placeholder="e.g. Trx ID #987654"
                  className={inputCls}
                  value={form.paymentNotes}
                  onChange={(e) => set("paymentNotes", e.target.value)}
                />
              </div>
            </div>
          )}

          {form.type === "cash" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cash Amount Received (Rs.)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.cashPaid !== undefined ? form.cashPaid : form.paid}
                  min="0"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setForm((p) => ({ ...p, cashPaid: val, paid: val }));
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional note..."
                  className={inputCls}
                  value={form.paymentNotes}
                  onChange={(e) => set("paymentNotes", e.target.value)}
                />
              </div>
            </div>
          )}

          {form.type === "credit" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Advance Received (if any) Rs.</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.paid}
                  min="0"
                  onChange={(e) => set("paid", Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelCls}>Udhar Note</label>
                <input
                  type="text"
                  placeholder="e.g. Promised payment in 15 days"
                  className={inputCls}
                  value={form.paymentNotes}
                  onChange={(e) => set("paymentNotes", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-white p-3.5 rounded-lg border border-[#e2e8f0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <span className="text-[11px] text-[#64748b] uppercase block font-semibold">Subtotal</span>
              <span className="text-sm font-bold text-[#1e293b]">{fmt(subtotal)}</span>
            </div>
            <div>
              <span className="text-[11px] text-[#64748b] uppercase block font-semibold">Discount</span>
              <span className="text-sm font-bold text-[#ef4444]">- {fmt(discountAmount)}</span>
            </div>
            <div>
              <span className="text-[11px] text-[#64748b] uppercase block font-semibold">Total Received</span>
              <span className="text-sm font-bold text-[#15803d]">{fmt(effectivePaid)}</span>
            </div>
            <div>
              <span className="text-[11px] text-[#64748b] uppercase block font-semibold">Remaining Balance</span>
              <span className={`text-sm font-bold ${balance > 0 ? "text-[#f59e0b]" : "text-[#15803d]"}`}>
                {fmt(balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {!invoice && (
            <button
              type="button"
              onClick={handleHold}
              className="w-full sm:w-auto px-4 py-2 border border-[#f59e0b] text-[#d97706] hover:bg-[#fef3c7] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>⏸️</span> Hold / Park Invoice
            </button>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg font-bold transition-colors shadow-md"
            >
              {invoice ? "Update Invoice" : "Save Invoice"}
            </button>
          </div>
        </div>
      </form>

      {/* Credit Limit Exceeded Approval Modal */}
      {showCreditLimitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="text-red-600 font-bold text-base flex items-center gap-2">
                <span>⚠️</span> Admin Approval: Credit Limit Exceeded
              </h3>
              <button
                type="button"
                onClick={() => setShowCreditLimitModal(false)}
                className="text-[#64748b] hover:text-[#1e293b] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-[#1e293b]">
              <p className="font-bold text-amber-900 text-sm mb-2.5">
                Customer ki Udhaar Limit cross ho rahi hai!
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-amber-200/60">
                  <span className="text-[#64748b]">Customer:</span>
                  <span className="font-bold text-[#1e293b]">{customer?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-200/60">
                  <span className="text-[#64748b]">Allowed Credit Limit:</span>
                  <span className="font-semibold text-[#1e293b]">{fmt(creditLimit)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-200/60">
                  <span className="text-[#64748b]">Current Outstanding Udhar:</span>
                  <span className="font-semibold text-amber-700">{fmt(currentBalance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-200/60">
                  <span className="text-[#64748b]">This Bill Udhar (Balance):</span>
                  <span className="font-semibold text-blue-700">{fmt(balance)}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-sm text-red-700 border-b border-amber-200">
                  <span>New Total Udhar:</span>
                  <span>{fmt(newProjectedBalance)}</span>
                </div>
                <div className="flex justify-between pt-1 text-xs text-red-600 font-bold">
                  <span>Exceeded Amount:</span>
                  <span>+{fmt(exceededAmount)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#64748b] leading-relaxed">
              Customer ka udhar uski muqarrar karda hadd se barh raha hai. Kya aap is transaction ko ba-shart-e-manzoori (Admin Approval) approve karke invoice save karna chahte hain?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreditLimitModal(false)}
                className="px-4 py-2 text-sm border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-black/5 transition"
              >
                Cancel / Go Back
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(null, true)}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow"
              >
                <span>✓</span> Approve & Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Invoices() {
  const {
    invoices,
    fetchInvoice,
    deleteInvoice,
    printInvoice,
    heldInvoices,
    deleteHeldInvoice,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [viewInv, setViewInv] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [heldInitialData, setHeldInitialData] = useState(null);
  const [showHeldModal, setShowHeldModal] = useState(false);

  const handleView = async (inv) => {
    try {
      const full = await fetchInvoice(inv.id);
      setViewInv(full);
    } catch {
      setViewInv(inv);
    }
  };

  const handleResumeHeld = (held) => {
    setHeldInitialData(held.invoice_data);
    setShowHeldModal(false);
    setShowModal(true);
    deleteHeldInvoice(held.id);
  };

  const totalAmount = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const totalUdhar = invoices.reduce((s, i) => s + i.balance, 0);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await deleteInvoice(id);
    } catch {
      alert("Unable to delete invoice");
    }
  };

  const rows = invoices.map((inv) => [
    <span className="text-[#1e3a8a] font-bold">{inv.invoiceNo}</span>,
    inv.date,
    <div>
      <div className="font-medium text-[#1e293b]">{inv.customerName}</div>
      {inv.salesmanName && inv.salesmanName !== "Self / Admin" && (
        <span className="text-[11px] text-[#6366f1] bg-[#e0e7ff] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
          👤 {inv.salesmanName}
        </span>
      )}
      {inv.deliveryManName && !inv.deliveryManName.toLowerCase().includes("self") && (
        <span className="text-[11px] text-[#047857] bg-[#d1fae5] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5 ml-1">
          🚚 {inv.deliveryManName}
        </span>
      )}
    </div>,
    <span className="font-semibold">{fmt(inv.total)}</span>,
    <span className="text-[#16a34a] font-medium">{fmt(inv.paid)}</span>,
    <span
      className={
        inv.balance > 0 ? "text-[#f59e0b] font-semibold" : "text-[#64748b]"
      }
    >
      {fmt(inv.balance)}
    </span>,
    <span
      className={`rounded-full text-xs px-2 py-0.5 font-medium ${
        inv.type === "cash"
          ? "bg-[#22c55e]/20 text-[#16a34a]"
          : inv.type === "split"
          ? "bg-[#6366f1]/20 text-[#4f46e5]"
          : inv.type === "online"
          ? "bg-[#06b6d4]/20 text-[#0891b2]"
          : "bg-[#f59e0b]/20 text-[#d97706]"
      }`}
    >
      {inv.type === "cash"
        ? "Cash"
        : inv.type === "split"
        ? "Split"
        : inv.type === "online"
        ? "Online"
        : "Udhar"}
    </span>,
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => handleView(inv)}
        className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        👁 View
      </button>

      <button
        onClick={() => printInvoice(inv.id, "a4")}
        className="px-2 py-1 text-xs rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e3a8a] font-semibold"
      >
        📄 A4
      </button>
      <button
        onClick={() => printInvoice(inv.id, "thermal")}
        className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white font-medium"
      >
        🧾 Thermal
      </button>

      <button
        onClick={async () => {
          const data = await fetchInvoice(inv.id);
          setEditingInvoice(data);
          setShowModal(true);
        }}
        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800 text-white font-medium"
      >
        ✏ Edit
      </button>
      <button
        onClick={() => handleDelete(inv.id)}
        className="px-2 py-1 text-xs rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium"
      >
        🗑 Delete
      </button>
    </div>,
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Sales Invoices & POS"
        action={
          <div className="flex items-center gap-2">
            {heldInvoices.length > 0 && (
              <button
                onClick={() => setShowHeldModal(true)}
                className="px-3.5 py-2 bg-[#fef3c7] hover:bg-[#fde68a] border border-[#f59e0b]/50 text-[#b45309] text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>⏸️</span> Held Invoices
                <span className="bg-[#b45309] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {heldInvoices.length}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingInvoice(null);
                setHeldInitialData(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>+</span> New Invoice
            </button>
          </div>
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
          <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <h3 className="text-[#1e293b] font-semibold text-base">Invoices List</h3>
            {heldInvoices.length > 0 && (
              <span className="text-xs text-[#b45309] bg-[#fef3c7] px-2.5 py-1 rounded-full font-medium">
                {heldInvoices.length} invoice(s) currently held / parked
              </span>
            )}
          </div>
          <Table
            headers={[
              "Invoice #",
              "Date",
              "Customer",
              "Total",
              "Paid",
              "Balance",
              "Payment Mode",
              "Action",
            ]}
            rows={rows}
            emptyMessage="No invoices yet. Click 'New Invoice' to create one!"
          />
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingInvoice(null);
          setHeldInitialData(null);
        }}
        invoice={editingInvoice}
        initialData={heldInitialData}
      />

      {/* Held Invoices Modal */}
      <Modal
        isOpen={showHeldModal}
        onClose={() => setShowHeldModal(false)}
        title={`⏸️ Parked / Held Invoices (${heldInvoices.length})`}
        size="lg"
      >
        <div className="space-y-3">
          {heldInvoices.length === 0 ? (
            <div className="text-center py-8 text-[#64748b]">
              No held invoices right now.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
              {heldInvoices.map((h) => (
                <div
                  key={h.id}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#cbd5e1] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#1e293b]">
                        {h.hold_name || h.customer_name || "Counter Customer"}
                      </span>
                      <span className="text-[11px] bg-[#e0e7ff] text-[#4338ca] px-2 py-0.5 rounded-full font-semibold">
                        {h.items_count} Item(s)
                      </span>
                    </div>
                    <div className="text-xs text-[#64748b]">
                      Held at: {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Amount: <strong className="text-[#15803d]">{fmt(h.total)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResumeHeld(h)}
                      className="px-3.5 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>▶</span> Resume Bill
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Discard / delete this held invoice?")) {
                          deleteHeldInvoice(h.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] text-xs font-bold rounded-lg transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

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
                <span className="text-[#64748b]">Payment Mode:</span>{" "}
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    viewInv.type === "cash"
                      ? "bg-[#22c55e]/20 text-[#16a34a]"
                      : viewInv.type === "split"
                      ? "bg-[#6366f1]/20 text-[#4f46e5]"
                      : viewInv.type === "online"
                      ? "bg-[#06b6d4]/20 text-[#0891b2]"
                      : "bg-[#f59e0b]/20 text-[#d97706]"
                  }`}
                >
                  {viewInv.type === "split" ? "Split Payment" : viewInv.type}
                </span>
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-lg overflow-hidden border border-[#e2e8f0]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f1f5f9]">
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
                  {(viewInv.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-[#e2e8f0]">
                      <td className="px-4 py-2 text-[#1e293b]">
                        {item.productName} {item.variantName ? `(${item.variantName})` : ""}
                      </td>
                      <td className="px-4 py-2 text-right text-[#64748b]">
                        {item.qty}
                      </td>
                      <td className="px-4 py-2 text-right text-[#64748b]">
                        {fmt(item.price)}
                      </td>
                      <td className="px-4 py-2 text-right text-[#1e293b] font-medium">
                        {fmt(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm bg-[#f8fafc] p-3.5 rounded-lg border border-[#e2e8f0]">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="text-[#1e293b] font-semibold">{fmt(viewInv.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Discount</span>
                <span className="text-[#ef4444] font-semibold">
                  - {fmt(viewInv.discount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#e2e8f0] pt-2 font-bold text-base">
                <span className="text-[#1e293b]">Total</span>
                <span className="text-[#1e3a8a]">{fmt(viewInv.total)}</span>
              </div>

              {/* Payment Breakdown */}
              {viewInv.cashPaid > 0 && viewInv.onlinePaid > 0 ? (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-2.5 rounded-lg space-y-1 text-xs mt-2">
                  <div className="flex justify-between">
                    <span className="text-[#15803d] font-medium">Cash Paid:</span>
                    <span className="text-[#15803d] font-bold">{fmt(viewInv.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#15803d] font-medium">
                      Online Paid ({viewInv.onlineMethod || "Online"}):
                    </span>
                    <span className="text-[#15803d] font-bold">{fmt(viewInv.onlinePaid)}</span>
                  </div>
                  {viewInv.paymentNotes && (
                    <div className="text-[#64748b] text-[11px] pt-0.5">
                      Note: {viewInv.paymentNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-[#64748b]">
                    Paid {viewInv.onlineMethod ? `(${viewInv.onlineMethod})` : ""}
                  </span>
                  <span className="text-[#15803d] font-semibold">{fmt(viewInv.paid)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold border-t border-[#e2e8f0] pt-2">
                <span className="text-[#64748b]">Balance (Udhar)</span>
                <span
                  className={
                    viewInv.balance > 0 ? "text-[#f59e0b]" : "text-[#15803d]"
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
