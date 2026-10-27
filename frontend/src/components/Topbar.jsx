export default function Topbar({ title, action }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-[#1e293b] font-bold text-xl">{title}</h2>
        <p className="text-[#64748b] text-xs mt-0.5">{dateStr}</p>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
