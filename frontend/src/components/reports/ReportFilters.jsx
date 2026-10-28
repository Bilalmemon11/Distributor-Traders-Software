import { useApp } from "../../context/AppContext";

export default function ReportFilters({
  reportType,
  setReportType,
  filters,
  setFilters,
}) {
  const { customers, vendors } = useApp();

  const currentYear = new Date().getFullYear();

  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  const months = [
    { value: "", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">

      <div className="grid lg:grid-cols-4 gap-4">

        {/* Report Type */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            Report Type
          </label>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          >
            <option value="sales">Sales Report</option>
            <option value="velocity">⚡ Fast-Moving vs Dead Stock</option>
            <option value="expiry-alerts">⏰ Batch Number & Expiry Alerts</option>
            <option value="area-sales">📍 Hyderabad Area Wise Sales</option>
            <option value="area-recovery">💵 Hyderabad Area Wise Recovery</option>
            <option value="salesmen">👨‍💼 Salesmen & Booker Commission</option>
            <option value="supply-men">🚚 Supply Men & Delivery Report</option>
            <option value="purchase">Purchase Report</option>
            <option value="customer">Customer Report</option>
            <option value="vendor">Vendor Report</option>
            <option value="expense">Expense Report</option>
            <option value="invoice">Invoice Report</option>
            <option value="sale-return">Sale Return Report</option>
            <option value="purchase-return">Purchase Return Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="outstanding-receivable">Outstanding Receivables (Udhaar)</option>
            <option value="outstanding-payable">Outstanding Payables (Vendor Udhaar)</option>
          </select>
        </div>

        {/* From */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            From Date
          </label>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                fromDate: e.target.value,
              })
            }
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          />
        </div>

        {/* To */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            To Date
          </label>

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                toDate: e.target.value,
              })
            }
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          />
        </div>

        {/* Month */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            Month
          </label>

          <select
            value={filters.month}
            onChange={(e) =>
              setFilters({
                ...filters,
                month: e.target.value,
              })
            }
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            Year
          </label>

          <select
            value={filters.year}
            onChange={(e) =>
              setFilters({
                ...filters,
                year: e.target.value,
              })
            }
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Customer */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            Customer
          </label>

          <select
            value={filters.customer}
            onChange={(e) =>
              setFilters({
                ...filters,
                customer: e.target.value,
              })
            }
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          >
            <option value="">All Customers</option>

            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor */}

        <div>
          <label className="text-xs text-[#64748b] block mb-2">
            Vendor
          </label>

          <select
            value={filters.vendor}
            onChange={(e) =>
              setFilters({
                ...filters,
                vendor: e.target.value,
              })
            }
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#1e293b]"
          >
            <option value="">All Vendors</option>

            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}

        <div className="flex items-end">

          <button
            onClick={() =>
              setFilters({
                fromDate: "",
                toDate: "",
                month: "",
                year: currentYear,
                customer: "",
                vendor: "",
              })
            }
            className="w-full bg-[#374151] hover:bg-[#4b5563] rounded-lg py-2.5 text-white"
          >
            Reset Filters
          </button>

        </div>

      </div>

    </div>
  );
}
