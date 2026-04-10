import logo from '../assets/logo.png';
import landingBg from '../assets/landing_bg.png';

export default function LandingPage({ onGetStarted, t, lang, setLang }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 brightness-50 saturate-125"
        style={{ backgroundImage: `url(${landingBg})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/30 via-[#0a0f1e]/55 to-[#0a0f1e]/90" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-6 mt-[12vh]">
        {/* Language Switch for Judges */}
        <div className="absolute top-[-10vh] flex gap-3">
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-1.5 rounded-full text-[0.7rem] font-bold transition-all cursor-pointer border
              ${lang === 'en' ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            ENGLISH
          </button>
          <button
            onClick={() => setLang('hi')}
            className={`px-4 py-1.5 rounded-full text-[0.7rem] font-bold transition-all cursor-pointer border
              ${lang === 'hi' ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            हिन्दी (HINDI)
          </button>
        </div>

        {/* Logo */}
        <img src={logo} alt="EcoScan Logo" className="w-24 h-24 object-contain mix-blend-screen" />

        <h1 className="text-[clamp(2.8rem,8vw,5rem)] font-black tracking-tighter bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent m-0 leading-none">
          {t.appTitle}
        </h1>

        <p className="text-indigo-300 font-semibold tracking-widest uppercase text-sm m-0">
          {t.tagline}
        </p>

        <p className="text-slate-400 text-sm max-w-sm leading-relaxed m-0">
          Connect citizens, volunteers, and authorities to fight illegal garbage dumping — one pin at a time.
        </p>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="mt-4 flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-full text-base font-bold shadow-[0_8px_32px_rgba(99,102,241,0.55)] hover:shadow-[0_14px_40px_rgba(99,102,241,0.7)] hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer border-0"
        >
          {t.getStarted}
          <span className="text-lg">&rarr;</span>
        </button>

        <p className="text-white/30 text-xs m-0">{t.noSignup}</p>
      </div>
    </div>
  );
}
