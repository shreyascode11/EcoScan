import { LogOut, MapPin, User, Clock, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';

const severityStyles = {
  low:    'bg-green-500/15 text-green-400',
  medium: 'bg-orange-500/15 text-orange-400',
  high:   'bg-red-500/15 text-red-400',
};

export default function Sidebar({ isOpen, onToggle, onLogout, reports = [], t, onOpenLeaderboard }) {
  const currentUser = 'Rajdeep Shaw'; // Target user for "Your Impact" [cite: 1]
  const initials = currentUser.split(' ').map(n => n[0]).join('');

  // 1. Dynamic Statistics
  const myReportsArray = reports.filter(r => r.reporter_name === currentUser);
  const myCleanedArray = reports.filter(r => r.volunteer_name === currentUser && r.status === 'cleaned');
  
  const myReports = myReportsArray.length;
  const myCleaned = myCleanedArray.length;

  // 2. Dynamic Last Reported
  // Sort by ID descending to get the absolute latest one (no hardcoding)
  const lastUserReport = [...myReportsArray].sort((a, b) => b.id - a.id)[0] || null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[850] bg-black/60 backdrop-blur-sm sm:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-[52px] left-0 bottom-0 z-[900] flex flex-col
                    bg-black backdrop-blur-2xl backdrop-saturate-200
                    border-r border-white/[0.1]
                    transition-all duration-300 ease-in-out
                    ${isOpen 
                      ? 'w-[85%] sm:w-[260px] px-4 py-5 translate-x-0' 
                      : 'w-0 sm:w-[56px] px-0 sm:px-2 py-5 items-center -translate-x-full sm:translate-x-0 overflow-hidden'
                    }`}
      >

        {/* Desktop Toggle button (hidden on mobile) */}
        <button
          onClick={onToggle}
          className="hidden sm:flex self-end mb-3 w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08]
                     text-slate-400 hover:text-white items-center justify-center
                     cursor-pointer transition-colors flex-shrink-0"
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Profile */}
        <div className={`flex items-center gap-3 pb-4 ${isOpen ? '' : 'sm:justify-center'} ${!isOpen && 'hidden sm:flex'}`}>
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-green-500 flex items-center justify-center font-black text-white text-sm">
              {initials}
            </div>
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-indigo-500 to-green-500 -z-10" />
          </div>

          {(isOpen) && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold text-[0.9rem] text-slate-100 truncate">{currentUser}</span>
              <span className="flex items-center gap-1 text-[0.72rem] text-slate-500">
                <User size={11} /> Volunteer
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto no-scrollbar transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {isOpen && (
            <div className="flex flex-col h-full">
              <div className="h-px bg-white/[0.06] my-1 mb-4" />

              {/* Last Reported */}
              <div className="mb-5">
                <div className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
                  <Clock size={12} /> {t.lastReported}
                </div>
                {lastUserReport ? (
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-orange-400" />
                      <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-full ${severityStyles[lastUserReport.severity]}`}>
                        {t[lastUserReport.severity]}
                      </span>
                    </div>
                    <p className="text-[0.82rem] text-slate-200 leading-snug m-0">
                      {lastUserReport.desc}
                    </p>
                    <span className="text-[0.7rem] text-slate-500">Just Now</span>
                  </div>
                ) : (
                  <div className="text-[0.75rem] text-slate-600 italic px-2">No reports yet...</div>
                )}
              </div>

              {/* Leaderboard Button */}
              <button
                onClick={onOpenLeaderboard}
                className="mb-5 flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 hover:bg-indigo-500/20 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Trophy size={16} />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[0.82rem] font-bold text-slate-100">{t.leaderboard}</span>
                  <span className="text-[0.65rem] text-indigo-300 font-medium">Rankings & Awards</span>
                </div>
              </button>

              <div className="h-px bg-white/[0.06] mb-4" />

              {/* Your Impact */}
              <div className="mb-5">
                <div className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
                  {t.yourImpact}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[1.4rem] font-black text-indigo-400">{myReports}</span>
                    <span className="text-[0.68rem] text-slate-500">{t.reported}</span>
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[1.4rem] font-black text-green-400">{myCleaned}</span>
                    <span className="text-[0.68rem] text-slate-500">{t.cleaned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`mt-auto flex items-center gap-2 px-3.5 py-2.5
                     bg-red-500/[0.08] border border-red-500/20 text-red-400
                     rounded-xl text-[0.85rem] font-semibold cursor-pointer
                     hover:bg-red-500/15 hover:border-red-500/40 transition-all
                     ${isOpen ? 'w-full' : 'w-10 h-10 justify-center px-0'}
                     ${!isOpen && 'hidden sm:flex'}`}
        >
          <LogOut size={15} />
          {isOpen && <span>{t.logOut}</span>}
        </button>
      </aside>
    </>
  );
}
