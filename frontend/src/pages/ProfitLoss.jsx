import { useState, useEffect } from "react";
import api from "../services/api";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import RevenueExpenseChart from "../components/reports/RevenueExpenseChart";
import ExpenseBreakdown from "../components/reports/ExpenseBreakdown";
import ProfitTrend from "../components/reports/ProfitTrend";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

const EXPENSE_CATS = [
  "Rent",
  "Salary",
  "Electricity",
  "Transport",
  "Packing",
  "Other",
];

function MarginBar({ label, value, color }) {
  const clamp = Math.min(Math.max(value, 0), 100);
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
        <span className={`font-bold ${textMap[color]}`}>{clamp}%</span>
      </div>
      <div className="h-2.5 bg-[#2a3248] rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color]} rounded-full transition-all duration-700`}
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
      setMonthlyFinancial(monthly.data.data);
      setExpenseBreakdownData(expense.data.data);
      setProfitTrendData(trend.data.data);
    } catch (err) {
      console.error(err);

      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadReports();
  }, [fromDate, toDate]);

  const revenue = Number(data?.total_revenue ?? 0);
  const cogs = Number(data?.total_cogs ?? 0);
  const grossProfit = Number(data?.gross_profit ?? 0);
  const totalExpenses = Number(data?.total_expenses ?? 0);
  const netProfit = Number(data?.net_profit ?? 0);

  const grossMargin = Number(data?.gross_margin_pct ?? 0);
  const netMargin = Number(data?.net_margin_pct ?? 0);
  const expenseRatio = Number(data?.expense_ratio_pct ?? 0);
  const cogsRatio = Number(data?.cogs_ratio_pct ?? 0);

  const weekly = data?.weekly_avg || {};

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        Failed to load report
      </div>
    );
  }

  const expByCategory = {};
  EXPENSE_CATS.forEach((cat) => {
    expByCategory[cat] = 0;
  });
  (data?.expense_breakdown || []).forEach((row) => {
    expByCategory[row.category] = Number(row.total);
  });

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
  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Profit & Loss" />
      <div className="p-6 space-y-6">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="grid lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-[#64748b] mb-2 block">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b]"
              />
            </div>

            <div>
              <label className="text-xs text-[#64748b] mb-2 block">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b]"
              />
            </div>

            <div>
              <label className="text-xs text-[#64748b] mb-2 block">
                Quick Filter
              </label>

              <select
                value={quickFilter}
                onChange={(e) => handleQuickFilter(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#1e293b]"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="w-full bg-[#1e3a8a] hover:bg-[#5a52e0] rounded-lg py-2.5 text-white font-medium transition"
                onClick={loadReports}
              >
                Apply
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setQuickFilter("this_month");
                }}
                className="w-full bg-[#2a3248] hover:bg-[#3b4664] rounded-lg py-2.5 text-white font-medium transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Revenue"
            value={fmt(revenue)}
            sub="Total sales"
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
            label="Total Expenses"
            value={fmt(totalExpenses)}
            sub="All categories"
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-5">
              📋 Income Statement
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#e2e8f0]/50">
                <span className="text-[#64748b]">Revenue (Sales)</span>
                <span className="text-[#1e293b] font-semibold">
                  {fmt(revenue)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#e2e8f0]/50">
                <span className="text-[#64748b]">Cost of Goods Sold</span>
                <span className="text-[#ef4444]">- {fmt(cogs)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#e2e8f0] font-semibold">
                <span className="text-[#1e293b]">Gross Profit</span>
                <span
                  className={
                    grossProfit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                  }
                >
                  {fmt(grossProfit)}
                </span>
              </div>
              {EXPENSE_CATS.filter((cat) => expByCategory[cat] > 0).map(
                (cat) => (
                  <div key={cat} className="flex justify-between py-1.5 pl-4">
                    <span className="text-[#64748b] text-xs">{cat}</span>
                    <span className="text-[#ef4444] text-xs">
                      - {fmt(expByCategory[cat])}
                    </span>
                  </div>
                ),
              )}
              <div className="flex justify-between py-2 border-t border-[#e2e8f0] font-semibold">
                <span className="text-[#1e293b]">Total Expenses</span>
                <span className="text-[#ef4444]">- {fmt(totalExpenses)}</span>
              </div>
              <div
                className={`flex justify-between py-4 px-4 rounded-xl mt-2 ${netProfit >= 0 ? "bg-[#22c55e]/10 border border-[#22c55e]/20" : "bg-[#ef4444]/10 border border-[#ef4444]/20"}`}
              >
                <span
                  className={`font-bold ${netProfit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                >
                  {netProfit >= 0 ? "Net Profit" : "Net Loss"}
                </span>
                <span
                  className={`font-bold text-lg ${netProfit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                >
                  {fmt(Math.abs(netProfit))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h3 className="text-[#1e293b] font-semibold mb-5">
              📊 Margin Analysis
            </h3>
            <div className="space-y-5">
              <MarginBar
                label="Gross Margin"
                value={grossMargin}
                color="green"
              />
              <MarginBar
                label="Net Margin"
                value={netMargin}
                color={netMargin >= 0 ? "accent" : "red"}
              />
              <MarginBar
                label="Expense Ratio"
                value={expenseRatio}
                color="amber"
              />
              <MarginBar label="COGS Ratio" value={cogsRatio} color="teal" />
            </div>
            <div className="mt-6 bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
              <p className="text-[#64748b] text-xs font-semibold uppercase tracking-wider mb-3">
                Weekly Average
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#64748b]">Revenue</span>
                  <p className="text-[#1e293b] font-semibold">
                    {fmt(weekly.revenue)}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748b]">Expenses</span>
                  <p className="text-[#ef4444] font-semibold">
                    {fmt(weekly.expenses)}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748b]">Gross Profit</span>
                  <p className="text-[#22c55e] font-semibold">
                    {fmt(weekly.gross_profit)}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748b]">Net Profit</span>
                  <p
                    className={`font-semibold ${Number(weekly.net_profit) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                  >
                    {fmt(weekly.net_profit)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Charts */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-[360px]">
            <RevenueExpenseChart data={monthlyFinancial} />
          </div>

          <div className="h-[360px]">
            <ExpenseBreakdown data={expenseBreakdownData} />
          </div>
        </div>

        <div className="mt-6 h-[360px]">
          <ProfitTrend data={profitTrendData} />
        </div>
      </div>
    </div>
  );
}
