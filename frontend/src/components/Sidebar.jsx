import { LogOut, ChevronLeft, PanelLeftClose, PanelLeftOpen, Trophy, BarChart2, Flag, Sparkles, Leaf } from 'lucide-react';

const SEV = {
  low:    { dot: 'bg-emerald-400', text: 'text-emerald-400', strip: 'bg-emerald-400/10 border-emerald-400/20' },
  medium: { dot: 'bg-amber-400',   text: 'text-amber-400',   strip: 'bg-amber-400/10   border-amber-400/20'   },
  high:   { dot: 'bg-red-400',     text: 'text-red-400',     strip: 'bg-red-400/10     border-red-400/20'     },
};

export default function Sidebar({ isOpen, onToggle, onLogout, reports = [], t, onOpenLeaderboard, currentUser }) {
  const userName  = currentUser?.name  || '';
  const userRole  = currentUser?.role  || 'citizen';
  const userScore = currentUser?.score ?? 0;

  const initials = userName.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';

  const myReportsArr = reports.filter(r => r.reporter_name  === userName);
  const myCleanedArr = reports.filter(r => r.volunteer_name === userName && r.status === 'cleaned');
  const myReports    = currentUser?.reports  ?? myReportsArr.length;
  const myCleaned    = currentUser?.cleanups ?? myCleanedArr.length;

  const gReported = reports.filter(r => r.status === 'reported' || r.status === 'verification-failed').length;
  const gProgress = reports.filter(r => r.status === 'in-progress').length;
  const gCleaned  = reports.filter(r => r.status === 'cleaned').length;

  const lastReport = [...myReportsArr].sort((a, b) => b.id - a.id)[0] || null;

  const badges = [];
  if (userRole === 'volunteer') {
    if (userScore >= 50)  badges.push({ icon: '🌱', label: 'Eco Explorer', color: 'text-emerald-400', pts: 50  });
    if (userScore >= 150) badges.push({ icon: '⚔️', label: 'Green Knight',  color: 'text-amber-400',  pts: 150 });
    if (userScore >= 300) badges.push({ icon: '👑', label: 'Eco Champion', color: 'text-rose-400',   pts: 300 });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[849] bg-black/60 backdrop-blur-[2px] sm:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-12 left-0 bottom-0 z-[900]
                    flex flex-col bg-[#0d0d10] border-r border-white/[0.07]
                    transition-[width] duration-300 ease-in-out overflow-hidden
                    ${isOpen
                      ? 'w-[78%] sm:w-[268px] translate-x-0'
                      : 'w-0 sm:w-[60px] -translate-x-full sm:translate-x-0'
                    }`}
      >

        {/* ── TOP: avatar + name + toggle ── */}
        <div className={`flex-shrink-0 flex items-center border-b border-white/[0.07]
                        ${isOpen ? 'gap-2.5 px-4 h-[60px]' : 'justify-center h-[60px]'}`}>

          {/* Avatar */}
          <div className="relative flex-shrink-0 w-8 h-8 rounded-lg
                          bg-gradient-to-br from-emerald-400 to-emerald-700
                          flex items-center justify-center select-none
                          text-white text-[0.72rem] font-bold tracking-wide
                          shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_14px_rgba(0,136,81,0.25)]">
            {initials}
          </div>

          {/* Name + role — only when open */}
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-[0.82rem] font-semibold text-white/90 truncate leading-snug">{userName}</p>
              <span className={`inline-block text-[0.55rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5
                              ${userRole === 'volunteer'
                                ? 'text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20'
                                : 'text-sky-400 bg-sky-400/10 ring-1 ring-sky-400/20'}`}>
                {userRole}
              </span>
            </div>
          )}

          {/* Collapse / expand button — always in header */}
          <button
            onClick={onToggle}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`flex-shrink-0 flex items-center justify-center rounded-lg
                       w-7 h-7 text-slate-500 hover:text-white hover:bg-white/[0.07]
                       cursor-pointer transition-all duration-150
                       ${!isOpen && 'hidden sm:flex'}`}
          >
            {isOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        {/* ── COLLAPSED ICON RAIL (desktop only) ── */}
        {!isOpen && (
          <div className="hidden sm:flex flex-col items-center gap-2 py-4 flex-1">
            <IconRailBtn icon={<Trophy size={16} />} onClick={onOpenLeaderboard} title="Leaderboard" />
            <div className="w-7 h-px bg-white/[0.07] my-1" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.6rem] text-slate-600 font-bold tabular-nums">{myReports}</span>
              <span className="text-[0.48rem] text-slate-700 uppercase tracking-wider">Rep</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.6rem] text-emerald-600 font-bold tabular-nums">{myCleaned}</span>
              <span className="text-[0.48rem] text-slate-700 uppercase tracking-wider">Cln</span>
            </div>
          </div>
        )}

        {/* ── EXPANDED SCROLL BODY ── */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="px-4 py-5 flex flex-col gap-5">

              {/* LAST REPORTED */}
              <Section label={t.lastReported || 'Last Reported'} icon={<Flag size={9} />}>
                {lastReport ? (() => {
                  const s = SEV[lastReport.severity] || SEV.low;
                  return (
                    <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.07]">
                      <div className={`flex items-center justify-between px-3 py-2 border-b border-white/[0.06] ${s.strip}`}>
                        <span className={`flex items-center gap-1.5 text-[0.59rem] font-bold uppercase tracking-widest ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
                          {t[lastReport.severity] || lastReport.severity}
                        </span>
                        <span className="flex items-center gap-1 text-[0.56rem] text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t.justNow || 'Just now'}
                        </span>
                      </div>
                      <div className="px-3 py-2.5 bg-white/[0.015]">
                        <p className="text-[0.74rem] text-slate-300 leading-relaxed m-0 line-clamp-2">
                          {lastReport.desc || '—'}
                        </p>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-[0.68rem] text-slate-600 italic mt-1">{t.noReportsYet || 'No reports yet.'}</p>
                )}
              </Section>

              {/* LEADERBOARD */}
              <button
                onClick={onOpenLeaderboard}
                className="group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl
                           ring-1 ring-white/[0.07] bg-white/[0.025]
                           hover:bg-emerald-400/[0.06] hover:ring-emerald-400/20
                           transition-all duration-150 cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/20
                                flex items-center justify-center flex-shrink-0
                                group-hover:scale-110 transition-transform duration-150">
                  <Trophy size={13} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.77rem] font-semibold text-white/85 leading-none mb-0.5">
                    {t.leaderboard || 'Leaderboard'}
                  </p>
                  <p className="text-[0.56rem] text-slate-600 uppercase tracking-widest">
                    {t.rankingsAndAwards || 'Rankings & Awards'}
                  </p>
                </div>
                <ChevronLeft size={11} className="rotate-180 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              </button>

              {/* DIVIDER */}
              <div className="h-px bg-white/[0.06]" />

              {/* YOUR IMPACT */}
              <Section label={t.yourImpact || 'Your Impact'} icon={<BarChart2 size={9} />}>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <StatCard value={myReports} label={t.reported || 'Reported'} />
                  <StatCard value={myCleaned} label={t.cleaned  || 'Cleaned'}  />
                </div>
              </Section>

              {/* BADGES — volunteer only */}
              {userRole === 'volunteer' && (
                <Section label={t.activeBadges || 'Earned Badges'} icon={<Sparkles size={9} />}>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {badges.length === 0 ? (
                      <p className="text-[0.66rem] text-slate-600 italic">No badges yet — reach 50 pts!</p>
                    ) : badges.map(b => (
                      <div key={b.label}
                           className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                      ring-1 ring-white/[0.05] bg-white/[0.015]
                                      hover:bg-white/[0.03] transition-colors">
                        <span className="w-5 text-center text-[0.95rem] leading-none">{b.icon}</span>
                        <div>
                          <p className={`text-[0.68rem] font-semibold leading-none mb-0.5 ${b.color}`}>{b.label}</p>
                          <p className="text-[0.52rem] text-slate-600 uppercase tracking-widest">≥ {b.pts} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* GLOBAL STATS — mobile only */}
              <div className="lg:hidden">
                <div className="h-px bg-white/[0.06] mb-4" />
                <Section label="Global Impact" icon={<Leaf size={9} />}>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {[
                      { label: t.reported   || 'Reported',    v: gReported, dot: 'bg-slate-400' },
                      { label: t.inProgress || 'In Progress', v: gProgress, dot: 'bg-amber-400 animate-pulse' },
                      { label: t.cleaned    || 'Cleaned',     v: gCleaned,  dot: 'bg-emerald-500' },
                    ].map(s => (
                      <div key={s.label}
                           className="flex items-center justify-between px-3 py-2.5
                                      rounded-lg ring-1 ring-white/[0.05] bg-white/[0.015]">
                        <span className="flex items-center gap-2 text-[0.62rem] font-medium text-slate-400 uppercase tracking-wider">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          {s.label}
                        </span>
                        <span className="text-[0.9rem] font-bold text-white tabular-nums">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

            </div>
          </div>
        )}

        {/* ── LOGOUT ── */}
        <div className={`flex-shrink-0 border-t border-white/[0.07]
                        ${isOpen ? 'px-4 py-3' : 'hidden sm:flex sm:justify-center sm:py-3'}`}>
          <button
            onClick={onLogout}
            className={`flex items-center gap-2.5 cursor-pointer rounded-lg
                       text-[0.7rem] font-medium text-slate-600
                       hover:text-red-400 hover:bg-red-400/[0.07]
                       transition-all duration-150
                       ${isOpen ? 'w-full px-3 py-2.5' : 'w-9 h-9 justify-center'}`}
          >
            <LogOut size={13} />
            {isOpen && <span>{t.logOut || 'Log Out'}</span>}
          </button>
        </div>

      </aside>
    </>
  );
}

/* ── Helpers ── */
function Section({ label, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.15em] text-slate-600">
        {icon}{label}
      </div>
      {children}
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-xl ring-1 ring-white/[0.07] bg-white/[0.02]
                    hover:bg-white/[0.04] transition-colors p-3.5 flex flex-col gap-1 group">
      <span className="text-[1.55rem] font-bold leading-none tabular-nums
                       bg-gradient-to-br from-emerald-300 to-emerald-600
                       bg-clip-text text-transparent">
        {value}
      </span>
      <span className="text-[0.54rem] text-slate-600 uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

function IconRailBtn({ icon, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 flex items-center justify-center rounded-lg
                 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10
                 transition-all duration-150 cursor-pointer"
    >
      {icon}
    </button>
  );
}
