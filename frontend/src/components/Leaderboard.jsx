import { X, Trophy, Medal, Star } from 'lucide-react';

export default function Leaderboard({ onClose, reports = [], t }) {
  // Calculate leaderboard statistics live from reports
  // This matches the backend scoring logic (High: 50, Med: 25, Low: 10)
  const volunteerStats = reports
    .filter(r => r.status === 'cleaned' && r.volunteer_name)
    .reduce((acc, report) => {
      const name = report.volunteer_name;
      if (!acc[name]) acc[name] = { name, count: 0, points: 0 };
      acc[name].count += 1;
      const pts = report.severity === 'high' ? 50 : report.severity === 'medium' ? 25 : 10;
      acc[name].points += pts;
      return acc;
    }, {});

  const leaderboard = Object.values(volunteerStats)
    .sort((a, b) => b.points - a.points);

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl
                      bg-white/[0.08] backdrop-blur-3xl backdrop-saturate-150
                      border border-white/[0.12]
                      shadow-[0_32px_64px_rgba(0,0,0,0.4)]
                      p-7 flex flex-col gap-6
                      animate-[slideUp_0.3s_ease]">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white/90 m-0">{t.leaderboard}</h2>
              <p className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider m-0">Top Contributors</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.1]
                       text-white/50 hover:text-white flex items-center justify-center
                       cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3 min-h-[300px] max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
          {leaderboard.length > 0 ? (
            leaderboard.map((v, i) => {
              const rankIcon = i === 0 ? <Trophy size={14} className="text-yellow-400" /> :
                             i === 1 ? <Medal size={14} className="text-slate-300" /> :
                             i === 2 ? <Star size={14} className="text-orange-400" /> : null;
              
              return (
                <div key={v.name} className="flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 transition-all hover:bg-white/[0.06] group">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs
                      ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                        i === 1 ? 'bg-slate-400/20 text-slate-400' :
                        i === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-white/5 text-slate-500'}`}>
                      {rankIcon || (i + 1)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.95rem] font-bold text-slate-100 group-hover:text-white transition-colors">{v.name}</span>
                      <span className="text-[0.7rem] text-slate-500 font-medium">
                        {v.count} {t.cleaned.toLowerCase()}s
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[1.2rem] font-black text-indigo-400 tracking-tight">{v.points}</span>
                    <span className="text-[0.55rem] text-slate-600 font-bold uppercase tracking-widest">{t.points}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 opacity-30">
              <Trophy size={48} strokeWidth={1} />
              <span className="text-sm italic">No cleanups recorded yet. Be the first!</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/[0.06] text-center">
          <p className="text-[0.68rem] text-slate-500 italic">
            Scores: High (50 pts), Medium (25 pts), Low (10 pts)
          </p>
        </div>
      </div>
    </div>
  );
}
