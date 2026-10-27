import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import ExportButtons from "./ExportButtons";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function OutstandingReceivableReport({ filters }) {
  const { customers, invoices } = useApp();
  const [search, setSearch] = useState("");

  const data = useMemo(() => {
    // We want customers with balance > 0, OR unpaid invoices if filters apply
    // Actually, simple outstanding report is just Customer Balances.
    let list = customers.filter(c => Number(c.balance) > 0);

    if (search) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.phone && c.phone.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Calculate aging (optional)
    return list.map(c => {
      // Find their unpaid invoices to show some detail
      const unpaidInvoices = invoices.filter(i => i.customerId === c.id && i.balance > 0);
      return {
        ...c,
        unpaidInvoices: unpaidInvoices.length,
        oldestInvoiceDate: unpaidInvoices.length ? unpaidInvoices.sort((a,b) => new Date(a.date) - new Date(b.date))[0].date : '-'
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [customers, invoices, search]);

  const totalOutstanding = data.reduce((sum, c) => sum + Number(c.balance), 0);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-[#1e293b] font-semibold text-lg">Outstanding Receivables (Customer Udhaar)</h2>
          <p className="text-[#64748b] text-sm mt-1">Total Outstanding: <span className="text-red-400 font-bold">{fmt(totalOutstanding)}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#f4f7fb] border border-[#e2e8f0] text-[#1e293b] px-3 py-2 rounded-lg text-sm focus:border-[#6c63ff] outline-none"
          />
          <ExportButtons 
            title="Outstanding-Receivables-Report"
            columns={[
              { label: "Customer Name", key: "name" },
              { label: "Phone", key: "phone" },
              { label: "Type", key: "type" },
              { label: "Unpaid Invoices", key: "unpaidInvoices" },
              { label: "Oldest Invoice", key: "oldestInvoiceDate" },
              { label: "Total Balance Due", key: "balance" }
            ]}
            rows={data}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#1b2233]">
            <tr className="border-b border-[#e2e8f0] text-white text-sm">
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-center">Unpaid Invoices</th>
              <th className="px-4 py-3 text-center">Oldest Invoice Date</th>
              <th className="px-4 py-3 text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3248]">
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-[#64748b]">
                  No outstanding receivables found.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3 text-[#1e293b] font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-[#64748b]">{c.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-[#2a3248] text-xs text-white capitalize">
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-amber-400 font-medium">
                    {c.unpaidInvoices}
                  </td>
                  <td className="px-4 py-3 text-center text-[#64748b]">
                    {c.oldestInvoiceDate}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold">
                    {fmt(c.balance)}
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
