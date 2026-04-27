import React from 'react';
import { motion } from 'motion/react';
import { SECTIONS, RIALO_LOGO_BASE64 } from '../data/gameData';
import { usePrivy } from '../lib/PrivyProvider';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onViewVault: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onViewVault }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <div className="flex flex-col items-center gap-5 mb-6">
        <img src={RIALO_LOGO_BASE64} className="w-10 h-auto" alt="Rialo" />
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95]">
          Who Wants to Be<br />a <em className="not-italic bg-black text-[#E8E4D9] px-2 rounded-xl">RialONE?</em>
        </h1>
      </div>

      <p className="font-mono text-[10px] sm:text-xs text-gray-500 uppercase tracking-[0.16em] mb-10">
        Read · Answer · Earn your card · 60 Questions
      </p>

      <div className="flex flex-wrap gap-3 mb-10 justify-center max-w-2xl">
        {SECTIONS.map((s) => (
          <div 
            key={s.id}
            className="flex-1 min-w-[160px] max-w-[200px] p-5 rounded-2xl border-2 text-left"
            style={{ backgroundColor: s.id === 'rialSAND' ? '#FDF6EC' : s.id === 'rialMETAL' ? '#F3F4F6' : '#0A0A0A', borderColor: s.color }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.emoji}</span>
              <span className="font-black text-sm tracking-tight" style={{ color: s.id === 'rialONE' ? '#E8E4D9' : s.color }}>{s.label}</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider opacity-60 mb-1" style={{ color: s.id === 'rialONE' ? '#E8E4D9' : 'inherit' }}>{s.tagline}</div>
            <div className="font-mono text-[10px] font-bold" style={{ color: s.id === 'rialONE' ? '#C8A96A' : s.color }}>20 Questions</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <button 
          onClick={onStart}
          className="bg-black text-white font-sans font-bold py-4 px-12 rounded-full text-base uppercase tracking-widest hover:bg-gray-900 transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
        >
          Start Game &rarr;
        </button>
        <button 
          onClick={onViewVault}
          className="font-mono text-xs text-gray-500 bg-[#F0EDE5] border border-black/10 py-3 px-8 rounded-full uppercase tracking-widest hover:bg-black hover:text-white transition-all"
        >
          🃏 View Saved Cards
        </button>
      </div>
    </motion.div>
  );
};
