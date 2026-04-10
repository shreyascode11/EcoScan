import logo from '../assets/logo.png';

export default function Dashboard({ reports }) {
  const total      = reports.length;
  const inProgress = reports.filter(r => r.status === 'in-progress').length;
  const cleaned    = reports.filter(r => r.status === 'cleaned').length;

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 py-3
                       bg-black border-b border-white/[0.08]">
      {/* Brand */}
      <div className="flex items-center gap-3 font-black text-base tracking-tight flex-shrink-0">
        <img src={logo} alt="EcoScan Logo" className="w-8 h-8 object-contain" />
        <div className="flex items-center gap-1">
          <span className="text-indigo-400">Eco</span><span className="text-white">Scan</span>
        </div>
      </div>

      {/* Stats — no background, just inline */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[0.82rem] font-semibold whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-slate-400">Reported</span>
          <span className="text-white font-black">{total}</span>
        </div>
        <div className="flex items-center gap-2 text-[0.82rem] font-semibold whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-slate-400">In Progress</span>
          <span className="text-white font-black">{inProgress}</span>
        </div>
        <div className="flex items-center gap-2 text-[0.82rem] font-semibold whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-slate-400">Cleaned</span>
          <span className="text-white font-black">{cleaned}</span>
        </div>
      </div>
    </header>
  );
}
