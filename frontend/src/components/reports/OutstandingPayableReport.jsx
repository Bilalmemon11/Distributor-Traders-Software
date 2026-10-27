import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function OutstandingPayableReport({ filters }) {
  const { vendors, purchases } = useApp();
  const [search, setSearch] = useState("");

  const data = useMemo(() => {
    let list = vendors.filter(v => Number(v.balance) > 0);

    if (search) {
      list = list.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase()) || 
        (v.phone && v.phone.toLowerCase().includes(search.toLowerCase())) ||
        (v.company && v.company.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    return list.map(v => {
      const unpaidPurchases = purchases.filter(p => p.vendorId === v.id && p.balance > 0);
      return {
        ...v,
        unpaidPurchases: unpaidPurchases.length,
        oldestPurchaseDate: unpaidPurchases.length ? unpaidPurchases.sort((a,b) => new Date(a.date) - new Date(b.date))[0].date : '-'
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [vendors, purchases, search]);

  const totalOutstanding = data.reduce((sum, v) => sum + Number(v.balance), 0);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-[#1e293b] font-semibold text-lg">Outstanding Payables (Vendor Udhaar)</h2>
          <p className="text-[#64748b] text-sm mt-1">Total Payable: <span className="text-red-400 font-bold">{fmt(totalOutstanding)}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search Vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] px-3 py-2 rounded-lg text-sm focus:border-[#6c63ff] outline-none"
          />
          <ExportButtons 
            title="Outstanding-Payables-Report"
            columns={[
              { label: "Vendor Name", key: "name" },
              { label: "Company", key: "company" },
              { label: "Phone", key: "phone" },
              { label: "Unpaid POs", key: "unpaidPurchases" },
              { label: "Oldest PO Date", key: "oldestPurchaseDate" },
              { label: "Total Payable", key: "balance" }
            ]}
            rows={data}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#1b2233]">
            <tr className="border-b border-[#e2e8f0] text-white text-sm">
              <th className="px-4 py-3">Vendor / Company</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-center">Unpaid POs</th>
              <th className="px-4 py-3 text-center">Oldest PO Date</th>
              <th className="px-4 py-3 text-right">Payable Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3248]">
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-[#64748b]">
                  No outstanding payables found. Great job!
                </td>
              </tr>
            ) : (
              data.map((v) => (
                <tr key={v.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-[#1e293b] font-medium">{v.name}</div>
                    <div className="text-[#64748b] text-xs">{v.company || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-[#64748b]">{v.phone || '-'}</td>
                  <td className="px-4 py-3 text-center text-amber-400 font-medium">
                    {v.unpaidPurchases}
                  </td>
                  <td className="px-4 py-3 text-center text-[#64748b]">
                    {v.oldestPurchaseDate}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold">
                    {fmt(v.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
