import { X, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

export default function StatsDrawer({ isOpen, onClose, reports, t }) {
  if (!isOpen) return null;

  const total = reports.length;
  const reportedCount = reports.filter(r => r.status === 'reported' || r.status === 'verification-failed').length;
  const inProgressCount = reports.filter(r => r.status === 'in-progress').length;
  const cleanedCount = reports.filter(r => r.status === 'cleaned').length;

  const lowSeverity = reports.filter(r => r.severity === 'low').length;
  const mediumSeverity = reports.filter(r => r.severity === 'medium').length;
  const highSeverity = reports.filter(r => r.severity === 'high').length;

  const cleanedPercent = total > 0 ? Math.round((cleanedCount / total) * 100) : 0;
  const inProgressPercent = total > 0 ? Math.round((inProgressCount / total) * 100) : 0;
  const reportedPercent = total > 0 ? Math.round((reportedCount / total) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-[1600] w-full sm:w-[350px] bg-black/95 border-l border-white/[0.08] shadow-2xl p-5 flex flex-col gap-6 animate-[slideIn_0.3s_cubic-bezier(0.2,0.8,0.2,1)] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="text-emerald-500" size={20} />
            <span className="text-[0.9rem] font-black uppercase tracking-widest text-white">{t.impactAnalysis || 'Impact Analytics'}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center cursor-pointer border-0">
            <X size={16} />
          </button>
        </div>

        {/* Total Summary */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[0.6rem] text-slate-500 font-black uppercase tracking-widest">{t.totalReports || 'Total Reports'}</span>
            <span className="text-3xl font-black text-white">{total}</span>
          </div>
          <TrendingUp className="text-emerald-500 opacity-60" size={32} />
        </div>

        {/* Progress Chart */}
        <div className="flex flex-col gap-4">
          <span className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest">{t.rankingsOverview || 'Progress Breakdown'}</span>
          
          <div className="flex flex-col gap-3">
            {[
              { label: t.cleaned, count: cleanedCount, percent: cleanedPercent, color: 'bg-emerald-500' },
              { label: t.inProgress, count: inProgressCount, percent: inProgressPercent, color: 'bg-yellow-500' },
              { label: t.reported, count: reportedCount, percent: reportedPercent, color: 'bg-white/20' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[0.7rem] font-bold text-white/80">
                  <span className="uppercase tracking-wider">{item.label}</span>
                  <span>{item.count} ({item.percent}%)</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Severity Chart */}
        <div className="flex flex-col gap-4 mt-2">
          <span className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest">{t.severity || 'Severity distribution'}</span>
          
          <div className="flex justify-center items-center py-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
            {total > 0 ? (
              <div className="flex items-end gap-6 h-36 px-4">
                {[
                  { label: t.low, count: lowSeverity, color: '#059669' },
                  { label: t.medium, count: mediumSeverity, color: '#ffcc00' },
                  { label: t.high, count: highSeverity, color: '#ff0033' }
                ].map((item, i) => {
                  const maxCount = Math.max(lowSeverity, mediumSeverity, highSeverity, 1);
                  const barHeight = Math.round((item.count / maxCount) * 100) + 10;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 w-14">
                      <div className="text-[0.7rem] font-black text-white">{item.count}</div>
                      <div 
                        className="w-8 rounded-t-lg transition-all duration-500 shadow-lg" 
                        style={{ height: `${barHeight}px`, backgroundColor: item.color }} 
                      />
                      <div className="text-[0.58rem] text-slate-500 font-black uppercase tracking-widest text-center truncate w-full">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-[0.7rem] text-slate-600 font-bold italic py-6">{t.noReportsYet}</span>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-auto bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3 items-start">
          <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-[0.68rem] text-emerald-400 font-black uppercase tracking-wider">Eco Tip</span>
            <p className="text-[0.72rem] text-slate-400 leading-normal m-0 font-medium">
              Every clean up directly reduces carbon footprints and inspires civic action. Earn badges by achieving milestones!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
