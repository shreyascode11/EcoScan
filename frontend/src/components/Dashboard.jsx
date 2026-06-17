import ecoscanTitle from '../assets/ecoscan_title.png';
import { useState, useRef, useEffect } from 'react';
import { Menu, Map, Globe, BarChart3, Palette, Check, RefreshCw, Filter, ChevronDown } from 'lucide-react';

/* ─── Theme catalogue ─── */
const THEMES = [
  { id: 'midnight', label: 'Midnight',  emoji: '🌙', dot: 'bg-emerald-500'  },
  { id: 'matrix',   label: 'Matrix',    emoji: '💚', dot: 'bg-lime-500'     },
  { id: 'sunset',   label: 'Sunset',    emoji: '🌅', dot: 'bg-amber-500'    },
  { id: 'ocean',    label: 'Ocean',     emoji: '🌊', dot: 'bg-sky-500'      },
  { id: 'purple',   label: 'Purple',    emoji: '💜', dot: 'bg-violet-500'   },
  { id: 'cherry',   label: 'Cherry',    emoji: '🌸', dot: 'bg-rose-500'     },
  { id: 'arctic',   label: 'Arctic',    emoji: '❄️', dot: 'bg-cyan-300'     },
  { id: 'forest',   label: 'Forest',    emoji: '🌲', dot: 'bg-green-700'    },
];

/* ─── Filter catalogue ─── */
const FILTERS = [
  { id: 'all',         label: 'All Markers',   desc: 'Show everything on the map'     },
  { id: 'reported',    label: 'Reported',       desc: 'Newly reported waste spots'      },
  { id: 'in-progress', label: 'In Progress',    desc: 'Being cleaned right now'         },
  { id: 'cleaned',     label: 'Cleaned ✓',     desc: 'Already cleaned up'              },
  { id: 'high',        label: '🔴 High',        desc: 'Critical severity only'          },
  { id: 'medium',      label: '🟡 Medium',      desc: 'Medium severity only'            },
  { id: 'low',         label: '🟢 Low',         desc: 'Low severity only'               },
];

/* ─── Reusable tooltip wrapper ─── */
function Tip({ label, children }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[1200]
                        whitespace-nowrap px-2.5 py-1.5 rounded-lg
                        bg-[#1a1a1f] border border-white/[0.1]
                        text-[0.62rem] font-medium text-slate-200
                        shadow-[0_8px_24px_rgba(0,0,0,0.5)]
                        pointer-events-none
                        animate-[tooltipIn_0.12s_ease]">
          {label}
          {/* Arrow */}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2
                           w-2 h-2 bg-[#1a1a1f] border-l border-t border-white/[0.1]
                           rotate-45" />
        </div>
      )}
    </div>
  );
}

/* ─── Reusable icon button ─── */
function HeaderBtn({ onClick, active, danger, children, tooltip, badge }) {
  return (
    <Tip label={tooltip}>
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg
                   cursor-pointer border-0 transition-all duration-150
                   hover:scale-110 active:scale-95
                   ${active
                     ? 'bg-emerald-500 text-white shadow-[0_2px_12px_rgba(0,136,81,0.4)]'
                     : danger
                       ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                       : 'text-slate-500 hover:text-white hover:bg-white/[0.09]'
                   }`}
      >
        {children}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                           bg-emerald-500 text-white text-[0.45rem] font-bold
                           flex items-center justify-center leading-none shadow">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    </Tip>
  );
}

/* ─── Vertical divider ─── */
function VDivider() {
  return <div className="hidden sm:block w-px h-5 bg-white/[0.07] mx-0.5" />;
}

/* ─── Main Dashboard ─── */
export default function Dashboard({
  reports, t, lang, setLang,
  onToggleSidebar, mapMode, setMapMode,
  onOpenStats, currentTheme, onChangeTheme,
  activeFilter, setActiveFilter,
  onRefresh, lastRefreshed,
}) {
  const reported   = reports.filter(r => r.status === 'reported' || r.status === 'verification-failed').length;
  const inProgress = reports.filter(r => r.status === 'in-progress').length;
  const cleaned    = reports.filter(r => r.status === 'cleaned').length;

  const [themeOpen,  setThemeOpen]  = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSec,    setLastSec]    = useState(null);

  const themeRef  = useRef(null);
  const filterRef = useRef(null);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function outside(e) {
      if (themeRef.current  && !themeRef.current.contains(e.target))  setThemeOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  /* Live "Xs ago" counter */
  useEffect(() => {
    if (!lastRefreshed) return;
    const id = setInterval(() => setLastSec(Math.round((Date.now() - lastRefreshed) / 1000)), 1000);
    return () => clearInterval(id);
  }, [lastRefreshed]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setRefreshing(false), 800);
  }

  const currentThemeObj  = THEMES.find(th => th.id === currentTheme) || THEMES[0];
  const currentFilterObj = FILTERS.find(f  => f.id  === (activeFilter || 'all')) || FILTERS[0];
  const isFiltered       = activeFilter && activeFilter !== 'all';

  return (
    <>
      {/* Tooltip keyframe */}
      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-[1000] h-12
                         flex items-center
                         bg-[#0a0a0c]/95 backdrop-blur-xl
                         border-b border-white/[0.07]">

        {/* ── LEFT: hamburger + logo ── */}
        <div className="flex items-center gap-2 px-3 sm:px-4 flex-shrink-0">
          <button
            onClick={onToggleSidebar}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg
                       text-slate-400 hover:text-white hover:bg-white/[0.08]
                       hover:scale-110 transition-all duration-150 cursor-pointer border-0"
            title="Toggle sidebar"
          >
            <Menu size={15} />
          </button>

          <img
            src={ecoscanTitle}
            alt="EcoScan"
            className="h-[18px] w-auto object-contain opacity-85 select-none"
          />
        </div>

        {/* ── CENTER: all controls ── */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">

          {/* Group 1 — Map view mode */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
            <HeaderBtn
              onClick={() => setMapMode('street')}
              active={mapMode === 'street'}
              tooltip="Street Map View"
            >
              <Map size={14} />
            </HeaderBtn>
            <HeaderBtn
              onClick={() => setMapMode('satellite')}
              active={mapMode === 'satellite'}
              tooltip="Satellite View"
            >
              <Globe size={14} />
            </HeaderBtn>
            <HeaderBtn
              onClick={onOpenStats}
              tooltip="Impact Analytics Dashboard"
            >
              <BarChart3 size={14} />
            </HeaderBtn>
          </div>

          <VDivider />

          {/* Group 2 — Filter */}
          <div className="relative" ref={filterRef}>
            <Tip label={isFiltered ? `Filtering: ${currentFilterObj.label}` : 'Filter Map Markers'}>
              <button
                onClick={() => setFilterOpen(p => !p)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg
                           text-[0.65rem] font-semibold tracking-wide
                           cursor-pointer border-0 transition-all duration-150
                           hover:scale-105 active:scale-95
                           ${isFiltered
                             ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                             : filterOpen
                               ? 'bg-white/[0.08] text-white'
                               : 'text-slate-500 hover:text-white hover:bg-white/[0.07]'}`}
              >
                <Filter size={12} />
                <span className="hidden sm:inline max-w-[60px] truncate">{currentFilterObj.label}</span>
                <ChevronDown size={10} className={`hidden sm:block transition-transform duration-150 ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
            </Tip>

            {filterOpen && (
              <div className="absolute top-full mt-2 left-0
                              bg-[#111215] border border-white/[0.09] rounded-xl
                              shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-1.5 z-[1100] w-52
                              animate-[tooltipIn_0.12s_ease]">
                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-600 px-3 pt-1.5 pb-2">
                  Filter Map
                </p>
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setActiveFilter(f.id === 'all' ? null : f.id); setFilterOpen(false); }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg
                               text-left cursor-pointer border-0 transition-all duration-100 group
                               ${(activeFilter || 'all') === f.id
                                 ? 'bg-white/[0.08] text-white'
                                 : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.7rem] font-semibold leading-none mb-0.5">{f.label}</p>
                      <p className="text-[0.57rem] text-slate-600 group-hover:text-slate-500 leading-snug">{f.desc}</p>
                    </div>
                    {(activeFilter || 'all') === f.id && (
                      <Check size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <VDivider />

          {/* Group 3 — Language */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
            {[{ id: 'en', label: 'EN', tooltip: 'Switch to English' },
              { id: 'hi', label: 'हि', tooltip: 'हिन्दी में बदलें' }].map(l => (
              <Tip key={l.id} label={l.tooltip}>
                <button
                  onClick={() => setLang(l.id)}
                  className={`h-7 px-2.5 rounded-md text-[0.6rem] font-bold tracking-wider
                             cursor-pointer border-0 transition-all duration-150
                             hover:scale-105 active:scale-95
                             ${lang === l.id
                               ? 'bg-emerald-500/20 text-emerald-400'
                               : 'text-slate-600 hover:text-white'}`}
                >
                  {l.label}
                </button>
              </Tip>
            ))}
          </div>

          <VDivider />

          {/* Group 4 — Visual Theme */}
          <div className="relative" ref={themeRef}>
            <Tip label={`Theme: ${currentThemeObj.label}`}>
              <button
                onClick={() => setThemeOpen(p => !p)}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg
                           text-[0.65rem] font-semibold cursor-pointer border-0
                           transition-all duration-150 hover:scale-105 active:scale-95
                           ${themeOpen
                             ? 'bg-white/[0.08] text-white'
                             : 'text-slate-500 hover:text-white hover:bg-white/[0.07]'}`}
              >
                <span className="text-[0.85rem] leading-none">{currentThemeObj.emoji}</span>
                <span className="hidden sm:inline">{currentThemeObj.label}</span>
                <ChevronDown size={10} className={`hidden sm:block transition-transform duration-150 ${themeOpen ? 'rotate-180' : ''}`} />
              </button>
            </Tip>

            {themeOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2
                              bg-[#111215] border border-white/[0.09] rounded-xl
                              shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-2 z-[1100] w-48
                              animate-[tooltipIn_0.12s_ease]">
                <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-600 px-1.5 pt-0.5 pb-2">
                  Visual Theme
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {THEMES.map(th => (
                    <button
                      key={th.id}
                      onClick={() => { onChangeTheme(th.id); setThemeOpen(false); }}
                      className={`flex items-center gap-2 px-2.5 py-2.5 rounded-lg
                                 text-[0.68rem] font-medium text-left cursor-pointer border-0
                                 transition-all duration-100 hover:scale-[1.03]
                                 ${currentTheme === th.id
                                   ? 'bg-white/[0.1] text-white ring-1 ring-white/15'
                                   : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
                    >
                      <span className="text-base leading-none">{th.emoji}</span>
                      <span className="truncate">{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <VDivider />

          {/* Group 5 — Refresh */}
          <HeaderBtn
            onClick={handleRefresh}
            tooltip={lastSec != null ? `Refreshed ${lastSec}s ago — click to reload` : 'Refresh reports from server'}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </HeaderBtn>

        </div>

        {/* ── RIGHT: live stats ── */}
        <div className="hidden lg:flex items-center gap-5 px-4 flex-shrink-0">
          {[
            { label: t.reported    || 'Reported',    count: reported,    dot: 'bg-slate-400/70' },
            { label: t.inProgress  || 'In Progress', count: inProgress,  dot: 'bg-amber-400 animate-pulse' },
            { label: t.cleaned     || 'Cleaned',     count: cleaned,     dot: 'bg-emerald-500'  },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 group cursor-default">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
              <span className="text-[0.56rem] font-medium uppercase tracking-widest
                               text-slate-600 group-hover:text-slate-400 transition-colors">
                {s.label}
              </span>
              <span className="text-[0.85rem] font-bold text-white/80 tabular-nums leading-none
                               group-hover:text-white transition-colors">
                {s.count}
              </span>
            </div>
          ))}
        </div>

      </header>
    </>
  );
}
