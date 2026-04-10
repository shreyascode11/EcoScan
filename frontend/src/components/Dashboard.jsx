import logo from '../assets/logo.png';
import { Trophy, Menu } from 'lucide-react';

export default function Dashboard({ reports, t, lang, setLang, onOpenLeaderboard, onToggleSidebar }) {
  const total      = reports.length;
  const inProgress = reports.filter(r => r.status === 'in-progress').length;
  const cleaned    = reports.filter(r => r.status === 'cleaned').length;

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 sm:px-5 py-3
                       bg-black border-b border-white/[0.08]">
      {/* Brand & Language Toggle */}
      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.08] text-white/70 hover:text-white cursor-pointer transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3 font-black text-base tracking-tight">
          <img src={logo} alt="EcoScan Logo" className="w-8 h-8 object-contain" />
          <div className="flex items-center gap-1">
            <span className="text-indigo-400">{t.appTitle.substring(0, 3)}</span><span className="text-white">{t.appTitle.substring(3)}</span>
          </div>
        </div>

        {/* Language Switch */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="bg-white/[0.06] border border-white/[0.1] text-white/70 hover:text-white px-2.5 py-1 rounded-md text-[0.7rem] font-bold transition-all cursor-pointer"
        >
          {lang === 'en' ? 'HINDI' : 'ENGLISH'}
        </button>
      </div>

      {/* Stats — no background, just inline */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[0.82rem] font-semibold whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-slate-400">{t.reported}</span>
          <span className="text-white font-black">{total}</span>
        </div>
        <div className="flex items-center gap-2 text-[0.82rem] font-semibold whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-slate-400">{t.inProgress}</span>
          <span className="text-white font-black">{inProgress}</span>
        </div>
        <div className="flex items-center gap-2 text-[0.82rem] font-semibold whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-slate-400">{t.cleaned}</span>
          <span className="text-white font-black">{cleaned}</span>
        </div>
      </div>
    </header>
  );
}
