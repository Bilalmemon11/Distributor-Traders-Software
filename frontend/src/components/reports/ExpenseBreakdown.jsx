import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = [
  "#6c63ff",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
];

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-[#1c2233] border border-[#2a3248] p-3 rounded-lg shadow-xl text-xs space-y-1">
        <p className="text-[#e8eaf0] font-semibold">{entry.name}</p>
        <p className="text-white font-bold">{fmt(entry.value)}</p>
      </div>
    );
  }
  return null;
};

export default function ExpenseBreakdown({ data = [] }) {
  const chartData = (data || []).map((item) => ({
    name: item.category || "Other",
    value: Number(item.total || 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3248] p-5 h-full flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-[#e8eaf0] font-semibold text-base">
          Expense Breakdown
        </h3>
        <p className="text-xs text-[#8892a4]">Category-wise distribution</p>
      </div>

      <div className="w-full h-[260px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#8892a4]">
            No expense data available for this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={3}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="#161b27"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
