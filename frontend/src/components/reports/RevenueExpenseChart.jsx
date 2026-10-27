import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c2233] border border-[#2a3248] p-3 rounded-lg shadow-xl text-xs space-y-1.5">
        <p className="text-[#e8eaf0] font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="font-medium capitalize">
              {entry.name}:
            </span>
            <span className="text-white font-bold">{fmt(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueExpenseChart({ data = [], periodLabel = "Monthly" }) {
  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3248] p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[#e8eaf0] font-semibold text-base">
            Revenue vs Expense
          </h3>
          <p className="text-xs text-[#8892a4] capitalize">{periodLabel} Timeline</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
            <span className="text-[#8892a4]">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-[#8892a4]">Expense</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#2a3248" strokeDasharray="3 3" opacity={0.6} />
            <XAxis
              dataKey="label"
              stroke="#8892a4"
              tick={{ fill: "#8892a4", fontSize: 11 }}
            />
            <YAxis
              stroke="#8892a4"
              tick={{ fill: "#8892a4", fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 3, fill: "#22c55e" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Expense"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 3, fill: "#ef4444" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
