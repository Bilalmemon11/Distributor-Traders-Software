import { useState, useEffect } from "react";
import api from "../services/api";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import RevenueExpenseChart from "../components/reports/RevenueExpenseChart";
import ExpenseBreakdown from "../components/reports/ExpenseBreakdown";
import ProfitTrend from "../components/reports/ProfitTrend";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function MarginBar({ label, value, color }) {
  const clamp = Math.min(Math.max(Number(value || 0), 0), 100);
  const colorMap = {
    green: "bg-[#22c55e]",
    accent: "bg-[#1e3a8a]",
    amber: "bg-[#f59e0b]",
    red: "bg-[#ef4444]",
    teal: "bg-[#14b8a6]",
  };
  const textMap = {
    green: "text-[#22c55e]",
    accent: "text-[#1e3a8a]",
    amber: "text-[#f59e0b]",
    red: "text-[#ef4444]",
    teal: "text-[#14b8a6]",
  };
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#64748b]">{label}</span>
        <span className={`font-bold ${textMap[color] || "text-[#1e3a8a]"}`}>
          {clamp}%
        </span>
      </div>
      <div className="h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color] || "bg-[#1e3a8a]"} rounded-full transition-all duration-700`}
          style={{ width: `${clamp}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfitLoss() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState("this_month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [monthlyFinancial, setMonthlyFinancial] = useState([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState([]);
  const [profitTrendData, setProfitTrendData] = useState([]);

  async function loadReports() {
    setLoading(true);

    try {
      const params = {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const [profit, monthly, expense, trend] = await Promise.all([
        api.get("/reports/profit-loss", { params }),
        api.get("/reports/monthly-financial", { params }),
        api.get("/reports/expense-breakdown", { params }),
        api.get("/reports/profit-trend", { params }),
      ]);

      setData(profit.data.data);
      setMonthlyFinancial(monthly.data.data || []);
      setExpenseBreakdownData(expense.data.data || []);
      setProfitTrendData(trend.data.data || []);
    } catch (err) {
      console.error("Error loading profit & loss data:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [fromDate, toDate]);

  const grossRevenue = Number(data?.gross_revenue ?? data?.total_revenue ?? 0);
  const discount = Number(data?.total_discount ?? 0);
  const returns = Number(data?.total_returns ?? 0);
  const revenue = Number(data?.total_revenue ?? 0);
  const cogs = Number(data?.total_cogs ?? 0);
  const grossProfit = Number(data?.gross_profit ?? 0);
  const totalExpenses = Number(data?.total_expenses ?? 0);
  const salesmanCommission = Number(data?.salesman_commission ?? 0);
  const damageLoss = Number(data?.damage_loss ?? 0);
  const netProfit = Number(data?.net_profit ?? 0);

  const grossMargin = Number(data?.gross_margin_pct ?? 0);
  const netMargin = Number(data?.net_margin_pct ?? 0);
  const expenseRatio = Number(data?.expense_ratio_pct ?? 0);
  const cogsRatio = Number(data?.cogs_ratio_pct ?? 0);

  const weekly = data?.weekly_avg || {};
  const topProducts = data?.top_profitable_products || [];
  const expenseBreakdown = data?.expense_breakdown || [];
  const cashCollected = Number(data?.total_cash_collected ?? 0);
  const cashInHandProfit = Number(data?.cash_in_hand_profit ?? 0);
  const dailyAvg = Number(data?.daily_avg ?? 0);
  const periodDays = Number(data?.period_days ?? 30);

  const handleQuickFilter = (value) => {
    setQuickFilter(value);

    const today = new Date();
    let from = "";
    let to = "";

    switch (value) {
      case "today":
        from = to = today.toISOString().split("T")[0];
        break;

      case "this_week": {
        const first = new Date(today);
        first.setDate(today.getDate() - today.getDay());
        from = first.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
      }

      case "this_month":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        to = today.toISOString().split("T")[0];
        break;

      case "this_year":
        from = `${today.getFullYear()}-01-01`;
        to = today.toISOString().split("T")[0];
        break;

      default:
        return;
    }

    setFromDate(from);
    setToDate(to);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-[#64748b]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Profit & Loss statement...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-12">
        <p className="font-semibold text-lg">Failed to load report data</p>
        <button
          onClick={loadReports}
          className="mt-3 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          nav, aside, header, .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          #printable-pl-statement {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      <Topbar
        title="Profit & Loss Statement"
        action={
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition active:scale-95"
            >
              <span>🖨️</span>
              <span>Print Statement</span>
            </button>
          </div>
        }
      />

      <div id="printable-pl-statement" className="p-6 space-y-6">
        {/* Filter Controls (Hidden on Print) */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 no-print shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:border-[#1e3a8a] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:border-[#1e3a8a] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
                Quick Preset
              </label>
              <select
                value={quickFilter}
                onChange={(e) => handleQuickFilter(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b] focus:border-[#1e3a8a] focus:outline-none"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] rounded-lg py-2 text-white font-medium text-sm transition shadow-sm"
                onClick={loadReports}
              >
                Filter Report
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setQuickFilter("this_month");
                }}
                className="w-full bg-[#64748b] hover:bg-[#475569] rounded-lg py-2 text-white font-medium text-sm transition shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Net Sales"
            value={fmt(revenue)}
            sub={`Gross: ${fmt(grossRevenue)}`}
            color="accent"
            icon="📈"
          />
          <StatCard
            label="Gross Profit"
            value={fmt(grossProfit)}
            sub={`Margin: ${grossMargin}%`}
            color={grossProfit >= 0 ? "green" : "red"}
            icon="💹"
          />
          <StatCard
            label="Operating Expenses"
            value={fmt(totalExpenses)}
            sub={`${expenseBreakdown.length} active categories`}
            color="amber"
            icon="💸"
          />
          <StatCard
            label="Net Profit"
            value={fmt(netProfit)}
            sub={`Margin: ${netMargin}%`}
            color={netProfit >= 0 ? "green" : "red"}
            icon="🏆"
          />
          <div className="col-span-2 lg:col-span-1">
            <StatCard
              label="Cash In Hand Profit"
              value={fmt(cashInHandProfit)}
              sub={`Collected: ${fmt(cashCollected)}`}
              color="teal"
              icon="💵"
            />
          </div>
        </div>

        {/* Main 2-Column Section: Income Statement & Analysis */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Income Statement */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-[#1e293b] font-bold text-base flex items-center gap-2">
                  <span>📋</span> Income Statement
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Detailed Revenue, Cost of Goods & Operational Deductions
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#f1f5f9] text-[#475569] rounded-full">
                Accrual Basis
              </span>
            </div>

            <div className="space-y-3 text-sm mt-4">
              {/* Gross Sales */}
              <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                <span className="text-[#475569]">Gross Invoiced Sales</span>
                <span className="text-[#1e293b] font-medium">{fmt(grossRevenue)}</span>
              </div>

              {/* Discounts */}
              {discount > 0 && (
                <div className="flex justify-between py-1 text-xs pl-3 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Less: Customer Discounts</span>
                  <span className="text-[#ef4444] font-medium">- {fmt(discount)}</span>
                </div>
              )}

              {/* Returns */}
              {returns > 0 && (
                <div className="flex justify-between py-1 text-xs pl-3 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Less: Sales Returns & Adjustments</span>
                  <span className="text-[#ef4444] font-medium">- {fmt(returns)}</span>
                </div>
              )}

              {/* Net Revenue */}
              <div className="flex justify-between py-2 border-b border-[#e2e8f0] font-semibold bg-[#f8fafc] px-2 rounded-lg">
                <span className="text-[#1e293b]">Net Sales Revenue</span>
                <span className="text-[#1e3a8a]">{fmt(revenue)}</span>
              </div>

              {/* Cost of Goods Sold */}
              <div className="flex justify-between py-2 border-b border-[#e2e8f0]">
                <div>
                  <span className="text-[#475569]">Cost of Goods Sold (COGS)</span>
                  <span className="text-xs text-[#64748b] ml-2">({cogsRatio}% of revenue)</span>
                </div>
                <span className="text-[#ef4444] font-semibold">- {fmt(cogs)}</span>
              </div>

              {/* Gross Profit */}
              <div className="flex justify-between py-2.5 border-b border-[#cbd5e1] font-bold bg-[#f1f5f9] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[#1e293b]">Gross Profit</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {grossMargin}%
                  </span>
                </div>
                <span className={grossProfit >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}>
                  {fmt(grossProfit)}
                </span>
              </div>

              {/* Operating Expenses Breakdown */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                  <span>Operating Expenses (Category Breakdown)</span>
                  <span>Amount</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {expenseBreakdown.length === 0 ? (
                    <div className="text-xs text-[#94a3b8] italic py-1 pl-3">
                      No expenses recorded for this period
                    </div>
                  ) : (
                    expenseBreakdown.map((row, idx) => {
                      const amount = Number(row.total || 0);
                      const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-1 pl-3 pr-1 text-xs rounded hover:bg-[#f8fafc]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                            <span className="text-[#334155] capitalize">{row.category}</span>
                            <span className="text-[10px] text-[#94a3b8]">({pct}%)</span>
                          </div>
                          <span className="text-[#ef4444] font-medium">- {fmt(amount)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-between py-2 border-t border-[#e2e8f0] text-xs font-semibold mt-2">
                  <span className="text-[#475569]">Subtotal Operating Expenses</span>
                  <span className="text-[#ef4444]">- {fmt(totalExpenses)}</span>
                </div>
              </div>

              {/* Additional Write-offs */}
              {salesmanCommission > 0 && (
                <div className="flex justify-between py-1.5 text-xs border-t border-[#f1f5f9]">
                  <span className="text-[#475569]">Salesman Commission Disbursed</span>
                  <span className="text-[#ef4444] font-medium">- {fmt(salesmanCommission)}</span>
                </div>
              )}

              {damageLoss > 0 && (
                <div className="flex justify-between py-1.5 text-xs border-t border-[#f1f5f9]">
                  <span className="text-[#475569]">Damaged / Expired Stock Write-off</span>
                  <span className="text-[#ef4444] font-medium">- {fmt(damageLoss)}</span>
                </div>
              )}

              {/* Net Profit Banner */}
              <div
                className={`flex justify-between items-center py-4 px-5 rounded-xl mt-4 transition ${
                  netProfit >= 0
                    ? "bg-[#f0fdf4] border-2 border-[#86efac]"
                    : "bg-[#fef2f2] border-2 border-[#fca5a5]"
                }`}
              >
                <div>
                  <span
                    className={`font-bold text-base block ${
                      netProfit >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                    }`}
                  >
                    {netProfit >= 0 ? "🏆 Net Profit" : "⚠️ Net Loss"}
                  </span>
                  <span className="text-xs text-[#64748b]">
                    Net Margin: {netMargin}% • Avg: {fmt(dailyAvg)}/day
                  </span>
                </div>
                <span
                  className={`font-black text-2xl ${
                    netProfit >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                  }`}
                >
                  {fmt(Math.abs(netProfit))}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Margin Performance & Cash vs Accrual */}
          <div className="space-y-6">
            {/* Margin Analysis */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
              <h3 className="text-[#1e293b] font-bold text-base mb-5 flex items-center gap-2">
                <span>📊</span> Margin & Efficiency Analysis
              </h3>
              <div className="space-y-4">
                <MarginBar
                  label="Gross Margin (% of sales kept as gross profit)"
                  value={grossMargin}
                  color="green"
                />
                <MarginBar
                  label="Net Margin (% of sales converted to net profit)"
                  value={netMargin}
                  color={netMargin >= 0 ? "accent" : "red"}
                />
                <MarginBar
                  label="Expense Ratio (% of sales spent on operational expenses)"
                  value={expenseRatio}
                  color="amber"
                />
                <MarginBar
                  label="COGS Ratio (% of sales consumed by inventory cost)"
                  value={cogsRatio}
                  color="teal"
                />
              </div>

              {/* Weekly & Daily Averages */}
              <div className="mt-6 bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[#64748b] text-xs font-semibold uppercase tracking-wider">
                    Running Averages ({periodDays} Days Scope)
                  </p>
                  <span className="text-xs font-bold text-[#1e3a8a]">
                    Daily Profit: {fmt(dailyAvg)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0]">
                    <span className="text-[#64748b] text-xs">Weekly Revenue</span>
                    <p className="text-[#1e293b] font-semibold text-xs mt-0.5">
                      {fmt(weekly.revenue)}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0]">
                    <span className="text-[#64748b] text-xs">Weekly COGS</span>
                    <p className="text-[#ef4444] font-semibold text-xs mt-0.5">
                      {fmt(weekly.cogs)}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0]">
                    <span className="text-[#64748b] text-xs">Weekly Expenses</span>
                    <p className="text-[#f59e0b] font-semibold text-xs mt-0.5">
                      {fmt(weekly.expenses)}
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0]">
                    <span className="text-[#64748b] text-xs">Weekly Net</span>
                    <p
                      className={`font-semibold text-xs mt-0.5 ${
                        Number(weekly.net_profit) >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                      }`}
                    >
                      {fmt(weekly.net_profit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash In-Hand Realization vs Book Accrual */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <div>
                  <h3 className="text-[#1e293b] font-bold text-base flex items-center gap-2">
                    <span>💵</span> Cash Realization vs Book Profit
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Physical cash collected (including recovery) vs invoiced sales profit
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Cash Flow
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Cash In-Hand Profit
                  </span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {fmt(cashInHandProfit)}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-2 leading-relaxed">
                    Total Cash Collected: <strong className="text-emerald-800">{fmt(cashCollected)}</strong>
                    <br />
                    Minus Operating Expenses: <strong className="text-red-600">{fmt(totalExpenses)}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider block">
                    Accrual Net Profit
                  </span>
                  <p className="text-2xl font-black text-[#1e3a8a] mt-1">
                    {fmt(netProfit)}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-2 leading-relaxed">
                    Based on total billed invoice value.
                    <br />
                    Diff represents market credit (udhaar) float.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Most Profitable Products */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#1e293b] font-bold text-base flex items-center gap-2">
                <span>🌟</span> Top 5 Most Profitable Products
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Highest gross profit contributors in this period (Revenue minus Purchase Cost)
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1e3a8a] bg-[#eff6ff] px-2.5 py-1 rounded-full border border-[#bfdbfe]">
              High Margins
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] text-xs font-semibold border-b border-[#e2e8f0]">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Variant / Pack</th>
                  <th className="py-2.5 px-4 text-center">Units Sold</th>
                  <th className="py-2.5 px-4 text-right">Revenue</th>
                  <th className="py-2.5 px-4 text-right">Cost (COGS)</th>
                  <th className="py-2.5 px-4 text-right">Gross Profit</th>
                  <th className="py-2.5 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-6 text-center text-xs text-[#94a3b8]">
                      No product sales recorded in this period
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#f8fafc] transition">
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-600/10 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1e293b]">
                        {p.product_name}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#64748b]">
                        {p.variant_name || "-"}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-[#1e293b]">
                        {p.total_qty}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#1e293b]">
                        {fmt(p.total_revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#ef4444] text-xs">
                        {fmt(p.total_cogs)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#16a34a]">
                        {fmt(p.profit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.margin_pct}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section (Hidden on Print or gracefully rendered) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 no-print">
          <div className="h-[360px]">
            <RevenueExpenseChart data={monthlyFinancial} />
          </div>

          <div className="h-[360px]">
            <ExpenseBreakdown data={expenseBreakdown.length > 0 ? expenseBreakdown : expenseBreakdownData} />
          </div>
        </div>

        <div className="mt-6 h-[360px] no-print">
          <ProfitTrend data={profitTrendData} />
        </div>
      </div>
    </div>
  );
}
