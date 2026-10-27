import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#1c2233] border border-[#2a3248] p-3 rounded-lg shadow-xl text-xs space-y-1">
        <p className="text-[#e8eaf0] font-semibold">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-[#8892a4]">Net Profit:</span>
          <span className={`font-bold ${val >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {fmt(val)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProfitTrend({ data = [], periodLabel = "Monthly" }) {
  return (
    <div className="bg-[#161b27] rounded-xl border border-[#2a3248] p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[#e8eaf0] font-semibold text-base">
            Profit Trend
          </h3>
          <p className="text-xs text-[#8892a4] capitalize">{periodLabel} Net Profit & Loss</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6c63ff]"></span>
            <span className="text-[#8892a4]">Profit</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#2a3248" strokeDasharray="3 3" opacity={0.6} />
            <XAxis
              dataKey="label"
              stroke="#8892a4"
              tick={{ fill: "#8892a4", fontSize: 11 }}
            />
            <YAxis
              stroke="#8892a4"
              tick={{ fill: "#8892a4", fontSize: 11 }}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.profit >= 0 ? "#6c63ff" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
