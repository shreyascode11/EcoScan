import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-950/95 border-emerald-500/30 text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
      icon: <CheckCircle size={18} className="text-emerald-400" />
    },
    error: {
      bg: 'bg-rose-950/95 border-rose-500/30 text-rose-400 shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
      icon: <AlertCircle size={18} className="text-rose-400" />
    },
    info: {
      bg: 'bg-blue-950/95 border-blue-500/30 text-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.15)]',
      icon: <Info size={18} className="text-blue-400" />
    }
  };

  const style = config[type] || config.info;

  return (
    <div className={`fixed top-24 right-4 sm:right-6 z-[2500] flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border rounded-2xl shadow-2xl backdrop-blur-md animate-[slideIn_0.3s_cubic-bezier(0.2,0.8,0.2,1)] ${style.bg}`}>
      {style.icon}
      <span className="text-[0.78rem] sm:text-[0.82rem] font-black tracking-widest uppercase">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity bg-transparent border-0 text-current cursor-pointer flex items-center justify-center">
        <X size={14} />
      </button>
    </div>
  );
}
