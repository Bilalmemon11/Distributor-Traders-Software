export default function StatCard({ label, value, sub, color = 'accent', icon }) {
  const colorMap = {
    accent: { border: 'border-[#1e3a8a]/30', icon: 'bg-[#1e3a8a]/20 text-[#1e3a8a]', val: 'text-[#1e3a8a]' },
    green: { border: 'border-[#22c55e]/30', icon: 'bg-[#22c55e]/20 text-[#22c55e]', val: 'text-[#22c55e]' },
    red: { border: 'border-[#ef4444]/30', icon: 'bg-[#ef4444]/20 text-[#ef4444]', val: 'text-[#ef4444]' },
    amber: { border: 'border-[#f59e0b]/30', icon: 'bg-[#f59e0b]/20 text-[#f59e0b]', val: 'text-[#f59e0b]' },
    teal: { border: 'border-[#14b8a6]/30', icon: 'bg-[#14b8a6]/20 text-[#14b8a6]', val: 'text-[#14b8a6]' },
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <div className={`bg-white rounded-xl p-5 border ${c.border} hover:border-opacity-60 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#64748b] text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
          {sub && <p className="text-[#64748b] text-xs mt-1.5">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center text-lg ml-3`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
