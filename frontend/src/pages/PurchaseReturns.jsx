import { useState } from "react";
import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Table from "../components/Table";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function PurchaseReturns() {

    const {
        purchases,
        purchaseReturns,
        addPurchaseReturn,
        fetchPurchaseReturn,
        deletePurchaseReturn,
        printPurchaseReturn,

    } = useApp();

    const [viewReturn, setViewReturn] = useState(null);

    const [showView, setShowView] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const [purchaseId, setPurchaseId] = useState("");

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [reason, setReason] = useState("");

    const [items, setItems] = useState([]);

    const inputCls =
        "w-full bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-[#6c63ff] focus:outline-none";

    const labelCls =
        "block text-[#64748b] text-xs font-medium mb-1";

    const totalReturned = purchaseReturns.reduce(
        (sum, r) => sum + r.total,
        0
    );

    const totalItemsReturned = purchaseReturns.reduce(
        (sum, r) =>
            sum +
            r.items.reduce(
                (s, i) => s + i.qty,
                0
            ),
        0
    );

    const handlePurchaseChange = (e) => {

        const id = Number(e.target.value);

        setPurchaseId(id);

        const purchase = purchases.find(
            p => p.id === id
        );

        if (!purchase) {

            setItems([]);

            return;

        }

        setItems(

            purchase.items

                .filter(
                    i => i.remainingQty > 0
                )

                .map(i => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    productName: i.productName,
                    purchasedQty: i.qty,
                    returnedQty: i.returnedQty,
                    remainingQty: i.remainingQty,
                    qty: 0,
                    unitCost: i.unitCost
                }))

        );

    };

    const rows = purchaseReturns.map((r) => [

        <span className="text-[#1e3a8a] font-medium">
            {r.returnNo}
        </span>,

        r.date,

        r.vendorName,

        <span className="text-[#64748b]">
            {r.items.length} Items
        </span>,

        <span className="font-semibold">
            {fmt(r.total)}
        </span>,

        <div className="flex gap-2">

            <button
                onClick={async () => {

                    const data = await fetchPurchaseReturn(r.id);

                    console.log("VIEW DATA:", data);

                    setViewReturn(data);

                    setShowView(true);

                }}

                className="px-2 py-1 bg-green-600 rounded text-white"
            >
                👁 View
            </button>

            <button

                onClick={async () => {

                    if (

                        !window.confirm(

                            "Delete Purchase Return?"

                        )

                    ) return;

                    try {

                        await deletePurchaseReturn(

                            r.id

                        );

                    } catch (err) { }

                }}

                className="px-2 py-1 bg-red-600 rounded text-white"

            >

                🗑 Delete

            </button>

            <button
                onClick={() => printPurchaseReturn(r.id)}
                className="px-2 py-1 bg-indigo-600 rounded text-[#1e293b]"
            >
                🖨 Print
            </button>

        </div>

    ]);

    return (

        <div className="flex-1 overflow-y-auto">

            <Topbar
                title="Purchase Returns"
                action={

                    <button

                        onClick={() => {

                            setPurchaseId("");

                            setDate(
                                new Date().toISOString().split("T")[0]
                            );

                            setReason("");

                            setItems([]);

                            setShowAdd(true);

                        }}

                        className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm rounded-lg"

                    >

                        + New Purchase Return

                    </button>

                }
            />

            <div className="p-6 space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <StatCard
                        label="Total Returns"
                        value={purchaseReturns.length}
                        sub="Purchase Returns"
                        color="accent"
                        icon="↩️"
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

                            Purchase Return History

                        </h3>

                    </div>

                    <Table

                        headers={[

                            "Return #",

                            "Date",

                            "Vendor",

                            "Items",

                            "Total",

                            "Action"

                        ]}

                        rows={rows}

                        emptyMessage="No purchase returns yet"

                    />

                </div>

            </div>
            <Modal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                title="New Purchase Return"
            >

                <form
                    onSubmit={async (e) => {

                        e.preventDefault();

                            const returnItems = items
                                .filter(i => Number(i.qty) > 0)
                                .map(i => ({
                                    product_id: i.productId,
                                    variant_id: i.variantId,
                                    qty: Number(i.qty)
                                }));

                        if (!purchaseId) {
                            alert("Select Purchase");
                            return;
                        }

                        if (returnItems.length === 0) {
                            alert("Enter return quantity.");
                            return;
                        }

                        try {

                            await addPurchaseReturn({

                                purchase_id: purchaseId,

                                date,

                                reason,

                                items: returnItems

                            });

                            setShowAdd(false);

                            setPurchaseId("");

                            setReason("");

                            setItems([]);

                            setDate(
                                new Date().toISOString().split("T")[0]
                            );

                        } catch (err) { }

                    }}

                    className="space-y-4"
                >

                    <div>

                        <label className={labelCls}>

                            Purchase

                        </label>

                        <select
                            className={inputCls}
                            value={purchaseId}
                            onChange={handlePurchaseChange}
                        >

                            <option value="">
                                Select Purchase
                            </option>

                            {purchases.map(p => (

                                <option
                                    key={p.id}
                                    value={p.id}
                                >

                                    {p.poNo} - {p.vendorName}

                                </option>

                            ))}

                        </select>

                    </div>

                    <div>

                        <label className={labelCls}>
                            Date
                        </label>

                        <input
                            type="date"
                            className={inputCls}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />

                    </div>

                    <div>

                        <label className={labelCls}>
                            Reason
                        </label>

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

                                        <th className="text-left py-2">
                                            Product
                                        </th>

                                        <th>
                                            Purchased
                                        </th>

                                        <th>
                                            Returned
                                        </th>

                                        <th>
                                            Remaining
                                        </th>

                                        <th>
                                            Return Qty
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {items.map((item, index) => (

                                        <tr
                                            key={index}
                                            className="border-b border-[#e2e8f0]"
                                        >

                                            <td className="py-2">
                                                {item.productName}
                                            </td>

                                            <td className="text-center">
                                                {item.purchasedQty}
                                            </td>

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

                                                            item.remainingQty

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
                onClose={() => {
                    setShowView(false);
                    setViewReturn(null);
                }}
                title="Purchase Return Details"
            >
                {viewReturn && (
                    <div className="space-y-4 text-sm">

                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <strong>Return No:</strong><br />
                                {viewReturn.returnNo}
                            </div>

                            <div>
                                <strong>Date:</strong><br />
                                {String(viewReturn.date).split("T")[0]}
                            </div>

                            <div>
                                <strong>Vendor:</strong><br />
                                {viewReturn.vendorName}
                            </div>

                            <div>
                                <strong>Total:</strong><br />
                                {fmt(viewReturn.total)}
                            </div>

                            <div className="col-span-2">
                                <strong>Reason:</strong><br />
                                {viewReturn.reason || "-"}
                            </div>

                        </div>

                        <table className="w-full text-sm border border-[#e2e8f0]">

                            <thead className="bg-[#1d2433]">

                                <tr>

                                    <th className="p-2 text-left">Product</th>

                                    <th className="p-2">Qty</th>

                                    <th className="p-2">Unit Cost</th>

                                    <th className="p-2">Total</th>

                                </tr>

                            </thead>

                            <tbody>

                                {viewReturn.items.map((item, index) => (

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

                        <div className="flex justify-end">

                            <div className="text-lg font-bold">

                                Grand Total: {fmt(viewReturn.total)}

                            </div>

                        </div>

                    </div>
                )}
            </Modal>

        </div>

    );

}
