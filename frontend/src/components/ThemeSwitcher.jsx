import { useState } from 'react';
import { Palette, Check } from 'lucide-react';

export default function ThemeSwitcher({ currentTheme, onChangeTheme, t }) {
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'midnight', name: t.defaultMidnight || 'Midnight Teal', color: 'bg-emerald-500' },
    { id: 'matrix', name: t.matrixCyberpunk || 'Matrix Cyberpunk', color: 'bg-lime-500' },
    { id: 'sunset', name: t.sunsetGold || 'Sunset Gold', color: 'bg-amber-500' }
  ];

  return (
    <div className="fixed bottom-[11rem] right-4 sm:bottom-48 sm:right-6 z-[1000] flex flex-col items-end gap-2.5">
      {isOpen && (
        <div className="flex flex-col gap-2 p-3 bg-black/90 backdrop-blur-md border border-white/[0.08] rounded-2xl shadow-2xl animate-[slideUp_0.2s_ease] min-w-[170px]">
          <span className="text-[0.62rem] text-slate-500 font-black uppercase tracking-widest px-1.5 mb-1">
            {t.colorGrading || 'Visual Theme'}
          </span>
          {themes.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => {
                onChangeTheme(tItem.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[0.72rem] font-bold text-left cursor-pointer transition-all border-0
                ${currentTheme === tItem.id 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white/80'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${tItem.color} shadow-sm flex-shrink-0`} />
              <span className="flex-1 uppercase tracking-wider">{tItem.name}</span>
              {currentTheme === tItem.id && <Check size={12} className="text-emerald-400" />}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-10 h-10 rounded-xl bg-black/95 backdrop-blur-md border border-white/[0.08] hover:border-emerald-500/30
                   text-white flex items-center justify-center cursor-pointer shadow-lg hover:shadow-2xl transition-all"
        title={t.colorGrading || 'Visual Theme'}
      >
        <Palette size={18} className="text-emerald-500" />
      </button>
    </div>
  );
}
