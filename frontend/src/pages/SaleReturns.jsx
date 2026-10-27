import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function SaleReturns() {
    const {
        invoices,
        saleReturns,
        addSaleReturn,
        deleteSaleReturn,
        fetchSaleReturn,
        printSaleReturn,
    } = useApp();

    const [viewReturn, setViewReturn] = useState(null);

    const [showView, setShowView] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const [invoiceId, setInvoiceId] = useState("");

    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const [reason, setReason] = useState("");

    const [items, setItems] = useState([]);

    const inputCls =
        "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none";

    const labelCls = "block text-[#64748b] text-xs font-medium mb-1";

    const totalReturned = saleReturns.reduce(
        (sum, r) => sum + Number(r.total),
        0,
    );

    const totalItemsReturned = saleReturns.reduce(
        (sum, r) => sum + r.items.reduce((s, i) => s + Number(i.qty), 0),
        0,
    );

    const handleInvoiceChange = (e) => {
        const id = Number(e.target.value);

        setInvoiceId(id);

        const invoice = invoices.find((i) => i.id === id);

        if (!invoice) {
            setItems([]);

            return;
        }

        setItems(
            invoice.items.map((item) => ({
                productId: item.productId,

                productVariantId: item.variantId,

                productName: item.productName,

                variantName: item.variantName,

                purchasedQty: item.qty,

                returnedQty: item.returnedQty || 0,

                remainingQty: item.remainingQty || item.qty,

                qty: 0,

                price: item.price,
            })),
        );
    };

    const rows = saleReturns.map((r) => [
        <span className="text-[#1e3a8a] font-medium">{r.returnNo}</span>,

        String(r.date).split("T")[0],

        r.customerName,

        `${r.items.length} Items`,

        fmt(r.total),

        <div className="flex gap-2">
            <button
                onClick={async () => {
                    const data = await fetchSaleReturn(r.id);

                    setViewReturn(data);

                    setShowView(true);
                }}
                className="px-2 py-1 bg-green-600 rounded text-white"
            >
                👁 View
            </button>

            <button
                onClick={() => printSaleReturn(r.id)}
                className="px-2 py-1 bg-blue-600 rounded text-white"
            >
                🖨 Print
            </button>

            <button
                onClick={async () => {
                    if (!window.confirm("Delete Sale Return?")) return;

                    await deleteSaleReturn(r.id);
                }}
                className="px-2 py-1 bg-red-600 rounded text-white"
            >
                🗑 Delete
            </button>
        </div>,
    ]);

    return (
        <div className="flex-1 overflow-y-auto">
            <Topbar
                title="Sale Returns"
                action={
                    <button
                        onClick={() => {
                            setInvoiceId("");

                            setDate(new Date().toISOString().split("T")[0]);

                            setReason("");

                            setItems([]);

                            setShowAdd(true);
                        }}
                        className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm rounded-lg"
                    >
                        + New Sale Return
                    </button>
                }
            />

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                        label="Total Returns"
                        value={saleReturns.length}
                        sub="Sale Returns"
                        color="accent"
                        icon="↩"
                    />

                    <StatCard
                        label="Returned Amount"
                        value={fmt(totalReturned)}
                        sub={`${totalItemsReturned} Items Returned`}
                        color="red"
                        icon="📦"
                    />
                </div>

                <div className="bg-white rounded-xl border border-[#e2e8f0]">
                    <div className="p-4 border-b border-[#e2e8f0]">
                        <h3 className="text-[#1e293b] font-semibold">
                            Sale Return History
                        </h3>
                    </div>

                    <Table
                        headers={[
                            "Return #",

                            "Date",

                            "Customer",

                            "Items",

                            "Total",

                            "Action",
                        ]}
                        rows={rows}
                        emptyMessage="No sale returns yet"
                    />
                </div>
            </div>
            <Modal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                title="New Sale Return"
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();

                        const returnItems = items
                            .filter((i) => Number(i.qty) > 0)
                            .map(i => ({
                                product_id: i.productId,

                                product_variant_id: i.productVariantId,

                                qty: Number(i.qty),
                            }))
                        if (!invoiceId) {
                            alert("Select Purchase");
                            return;
                        }

                        if (returnItems.length === 0) {
                            alert("Enter return quantity.");
                            return;
                        }

                        try {
                            await addSaleReturn({
                                invoice_id: invoiceId,

                                date,

                                reason,

                                items: returnItems,
                            });

                            setShowAdd(false);

                            setInvoiceId("");

                            setReason("");

                            setItems([]);

                            setDate(new Date().toISOString().split("T")[0]);
                        } catch (err) { }
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className={labelCls}>Invoice</label>

                        <select
                            className={inputCls}
                            value={invoiceId}
                            onChange={handleInvoiceChange}
                        >
                            <option value="">Select Invoice</option>

                            {invoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoiceNo} - {inv.customerName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Date</label>

                        <input
                            type="date"
                            className={inputCls}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Reason</label>

                        <textarea
                            className={inputCls}
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {items.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#e2e8f0]">
                                        <th className="text-left py-2">Product</th>

                                        <th>Purchased</th>

                                        <th>Returned</th>

                                        <th>Remaining</th>

                                        <th>Return Qty</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-b border-[#e2e8f0]">
                                            <td className="py-2">{item.productName}</td>

                                            <td className="text-center">{item.purchasedQty}</td>

                                            <td className="text-center text-red-400">
                                                {item.returnedQty}
                                            </td>

                                            <td className="text-center text-green-400">
                                                {item.remainingQty}
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.remainingQty}
                                                    value={item.qty}
                                                    className={inputCls}
                                                    onChange={(e) => {
                                                        const value = Math.min(
                                                            Number(e.target.value),

                                                            item.remainingQty,
                                                        );

                                                        const copy = [...items];

                                                        copy[index].qty = value;

                                                        setItems(copy);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAdd(false)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-[#1e3a8a] text-white rounded-lg"
                        >
                            Save Return
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showView}
                onClose={() => setShowView(false)}
                title={`Sale Return: ${viewReturn?.returnNo || ""}`}
            >
                {viewReturn && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-[#64748b] mb-1">Customer</p>

                                <p className="text-[#1e293b] font-medium">
                                    {viewReturn.customerName}
                                </p>
                            </div>

                            <div>
                                <p className="text-[#64748b] mb-1">Date</p>

                                <p className="text-[#1e293b] font-medium">
                                    {String(viewReturn.date).split("T")[0]}
                                </p>
                            </div>

                            <div>
                                <p className="text-[#64748b] mb-1">Invoice</p>

                                <p className="text-[#1e293b] font-medium">{viewReturn.invoiceNo}</p>
                            </div>

                            <div>
                                <p className="text-[#64748b] mb-1">Reason</p>

                                <p className="text-[#1e293b] font-medium">
                                    {viewReturn.reason || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#1d2333]">
                                    <tr>
                                        <th className="text-left p-3">Product</th>

                                        <th className="text-center p-3">Qty</th>

                                        <th className="text-center p-3">Price</th>

                                        <th className="text-right p-3">Total</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {viewReturn.items.map((item) => (
                                        <tr key={item.id} className="border-t border-[#e2e8f0]">
                                            <td className="p-3">{item.productName}</td>

                                            <td className="text-center">{item.qty}</td>

                                            <td className="text-center">{fmt(item.price)}</td>

                                            <td className="text-right p-3 font-medium">
                                                {fmt(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-[#e2e8f0] pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span>Total Returned</span>

                                <span className="font-semibold text-red-400">
                                    {fmt(viewReturn.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
