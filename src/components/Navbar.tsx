import React from 'react';
import { usePrivy } from '../lib/PrivyProvider';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { RIALO_LOGO_BASE64 } from '../data/gameData';

export const Navbar: React.FC = () => {
  const { user, login, logout, loading, authenticated } = usePrivy();

  const displayName = user?.google?.name || user?.email?.address?.split('@')[0] || user?.id?.slice(0, 10) || 'User';
  const photoURL = user?.google?.picture || null;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-4 flex justify-between items-center bg-transparent">
      <div className="flex items-center gap-3">
        <img src={RIALO_LOGO_BASE64} className="w-8 h-8 opacity-80" alt="Rialo" />
        <span className="font-black tracking-tighter text-white/40 uppercase text-xs">RialONE</span>
      </div>

      <div className="flex items-center gap-3">
        {authenticated && user ? (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-1.5 pr-4 rounded-full shadow-xl">
            {photoURL ? (
              <img src={photoURL} className="w-8 h-8 rounded-full border border-white/20" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                <UserIcon size={12} />
              </div>
            )}
            <div className="text-left">
              <div className="text-[10px] font-black leading-none text-white truncate max-w-[100px]">{displayName}</div>
              <button onClick={logout} className="text-[8px] text-white/50 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                <LogOut size={8} /> Sign Out
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-[8px] font-mono text-white/30 animate-pulse uppercase tracking-[0.2em]">Initializing Privy...</div>
        ) : (
          <button 
            onClick={login}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all font-sans font-bold text-[10px] uppercase tracking-widest"
          >
            <LogIn size={12} /> Sign In
          </button>
        )}
      </div>
    </nav>
  );
};
