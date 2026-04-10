import { LogOut, MapPin, User, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

const DUMMY_USER = {
  name: 'Rajdeep Shaw',
  role: 'Citizen Reporter',
  avatar: null,
  lastReported: {
    desc: 'Overflowing bin near bus stop',
    severity: 'medium',
    time: '32 mins ago',
  },
};

const severityStyles = {
  low:    'bg-green-500/15 text-green-400',
  medium: 'bg-orange-500/15 text-orange-400',
  high:   'bg-red-500/15 text-red-400',
};

export default function Sidebar({ isOpen, onToggle, onLogout }) {
  const user = DUMMY_USER;
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <aside
      className={`fixed top-[52px] left-0 bottom-0 z-[900] flex flex-col
                  bg-black backdrop-blur-2xl backdrop-saturate-200
                  border-r border-white/[0.1]
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${isOpen ? 'w-[260px] px-4 py-5' : 'w-[56px] px-2 py-5 items-center'}`}
    >

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="self-end mb-3 w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08]
                   text-slate-400 hover:text-white flex items-center justify-center
                   cursor-pointer transition-colors flex-shrink-0"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Profile */}
      <div className={`flex items-center gap-3 pb-4 ${isOpen ? '' : 'justify-center'}`}>
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-green-500 flex items-center justify-center font-black text-white text-sm">
            {initials}
          </div>
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-indigo-500 to-green-500 -z-10" />
        </div>

        {isOpen && (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold text-[0.9rem] text-slate-100 truncate">{user.name}</span>
            <span className="flex items-center gap-1 text-[0.72rem] text-slate-500">
              <User size={11} /> {user.role}
            </span>
          </div>
        )}
      </div>

      {/* Expanded content only */}
      {isOpen && (
        <>
          <div className="h-px bg-white/[0.06] my-1 mb-4" />

          {/* Last Reported */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              <Clock size={12} /> Last Reported
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-orange-400" />
                <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-full ${severityStyles[user.lastReported.severity]}`}>
                  {user.lastReported.severity}
                </span>
              </div>
              <p className="text-[0.82rem] text-slate-200 leading-snug m-0">
                {user.lastReported.desc}
              </p>
              <span className="text-[0.7rem] text-slate-500">{user.lastReported.time}</span>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] mb-4" />

          {/* Your Impact */}
          <div className="mb-5">
            <div className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              Your Impact
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-0.5">
                <span className="text-[1.4rem] font-black text-indigo-400">8</span>
                <span className="text-[0.68rem] text-slate-500">Reported</span>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-0.5">
                <span className="text-[1.4rem] font-black text-green-400">3</span>
                <span className="text-[0.68rem] text-slate-500">Cleaned</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className={`mt-auto flex items-center gap-2 px-3.5 py-2.5
                   bg-red-500/[0.08] border border-red-500/20 text-red-400
                   rounded-xl text-[0.85rem] font-semibold cursor-pointer
                   hover:bg-red-500/15 hover:border-red-500/40 transition-all
                   ${isOpen ? 'w-full' : 'w-10 h-10 justify-center px-0'}`}
      >
        <LogOut size={15} />
        {isOpen && <span>Log out</span>}
      </button>
    </aside>
  );
}
