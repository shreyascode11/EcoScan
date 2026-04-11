import { useState } from 'react';
import logo from '../assets/logo.png';
import landingBg from '../assets/landing_bg.png';

export default function LandingPage({ onGetStarted, t, lang, setLang }) {
  const [name, setName] = useState('');

  const handleStart = () => {
    if (!name.trim()) {
      alert(t.userNameRequired);
      return;
    }
    onGetStarted(name);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75 saturate-125"
        style={{ backgroundImage: `url(${landingBg})` }}
      />



      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-6 mt-[8vh]">
        {/* Language Switch */}
        <div className="absolute top-[-8vh] flex gap-3">
          <button
            onClick={() => setLang('en')}
            className={`px-5 py-2 rounded-full text-[0.91rem] font-bold transition-all cursor-pointer border
              ${lang === 'en' ? 'bg-green-600 border-green-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            {t.langEn}
          </button>
          <button
            onClick={() => setLang('hi')}
            className={`px-5 py-2 rounded-full text-[0.91rem] font-bold transition-all cursor-pointer border
              ${lang === 'hi' ? 'bg-green-600 border-green-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            {t.langHi}
          </button>
        </div>

        {/* Logo — scaled up, negative margins cancel the PNG's built-in transparent padding */}
        <img src={logo} alt="EcoScan Logo" className="w-96 h-96 object-contain -mt-16 -mb-20" />

        <div className="flex flex-col gap-2">
          <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black tracking-tighter bg-gradient-to-br from-white to-green-300 bg-clip-text text-transparent m-0 leading-none">
            {t.appTitle}
          </h1>
          <p className="text-green-300 font-semibold tracking-widest uppercase text-[0.65rem] sm:text-xs m-0">
            {t.tagline}
          </p>
        </div>

        {/* Name Input */}
        <div className="w-full max-w-[280px] sm:max-w-xs flex flex-col gap-2 mt-5">
          <input
            type="text"
            placeholder={t.enterName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            className="w-full px-5 py-4 bg-green-900/30 border border-green-500/40 rounded-2xl text-white text-base text-center
                       focus:outline-none focus:ring-2 focus:ring-green-400/60 focus:bg-green-900/50 focus:border-green-400/70 transition-all
                       placeholder:text-green-300/40 font-medium shadow-[0_0_20px_rgba(34,197,94,0.08)]"
          />
        </div>

        {/* CTA — Green theme with new gradient */}
        <button
          onClick={handleStart}
          className="flex items-center gap-3 px-8 py-3.5 btn-green-gradient text-white rounded-full text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_45px_rgba(34,197,94,0.5)] active:scale-95 transition-all duration-300 cursor-pointer border-0"
        >
          {t.getStarted}
          <span className="text-xl leading-none">&rarr;</span>
        </button>

        <p className="text-white/20 text-[0.65rem] sm:text-xs italic m-0 pt-2">{t.noSignup}</p>
      </div>
    </div>
  );
}
