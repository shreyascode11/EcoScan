import { useState, useEffect } from 'react';
import { X, Trophy, Medal, Star, Loader2 } from 'lucide-react';
import { fetchLeaderboard } from '../api/reports';

export default function Leaderboard({ onClose, t }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRanking() {
      try {
        const data = await fetchLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    getRanking();
  }, []);

  const colors = ['bg-emerald-600', 'bg-white/10 text-white', 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', 'bg-black border border-white/20 text-white', 'bg-[#064e3b] text-white'];

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl
                      bg-black backdrop-blur-md
                      border border-white/[0.08]
                      shadow-[0_24px_64px_rgba(0,0,0,0.8)]
                      p-6 flex flex-col gap-6
                      animate-[slideUp_0.3s_cubic-bezier(0.2,0.8,0.2,1)]">

        <div className="flex justify-between items-center pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Trophy size={18} />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-white m-0 tracking-wide">{t.leaderboard}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[0.62rem] text-slate-500 font-semibold uppercase tracking-wider m-0">{t.topContributors}</p>
                <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-md px-1.5 py-0.5">
                  <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[0.55rem] font-bold text-red-400 uppercase tracking-wider">{t.live}</span>
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10
                       text-white/50 hover:text-white flex items-center justify-center
                       cursor-pointer transition-all hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 min-h-[300px] max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-emerald-500 gap-3 opacity-60">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-[0.68rem] font-bold uppercase tracking-widest">{t.calculatingRankings}</span>
            </div>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((v, i) => {
              const rankIcon = i === 0 ? <Trophy size={14} className="text-yellow-400" /> :
                             i === 1 ? <Medal size={14} className="text-slate-300" /> :
                             i === 2 ? <Star size={14} className="text-orange-400" /> : null;
              
              const profileColor = colors[v.name.length % colors.length];
              const initials = v.name.split(' ').map(n => n[0]).join('').toUpperCase();

              return (
                <div key={v.name} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 transition-all hover:bg-white/[0.04] hover:translate-x-0.5 group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-inner ${profileColor}`}>
                        {initials}
                      </div>
                      <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border border-black shadow-md text-[9px] font-bold
                        ${i === 0 ? 'bg-[#ffcc00] text-black' : 
                          i === 1 ? 'bg-slate-300 text-black' :
                          i === 2 ? 'bg-amber-600 text-white' :
                          'bg-white/10 text-white'}`}>
                        {rankIcon || <span>{i + 1}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[0.82rem] font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wide">{v.name}</span>
                      <span className="text-[0.62rem] text-slate-400 font-semibold uppercase tracking-wider">
                        {v.cleanups} {t.cleaned}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[1.2rem] font-bold text-emerald-400 tracking-tight leading-none">{v.score}</span>
                    <span className="text-[0.55rem] text-slate-500 font-bold uppercase tracking-widest">{t.points}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3 opacity-30 py-8">
              <Trophy size={48} strokeWidth={1.5} />
              <span className="text-xs font-bold uppercase tracking-widest">{t.noCleanups}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/[0.06] text-center">
          <p className="text-[0.62rem] text-slate-500 font-semibold uppercase tracking-wider italic">
            {t.scoringInfo}
          </p>
        </div>
      </div>
    </div>
  );
}



