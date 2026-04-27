import React from 'react';
import { motion } from 'motion/react';
import { Section } from '../data/gameData';

interface SectionIntroProps {
  section: Section;
  index: number;
  onBegin: () => void;
}

export const SectionIntro: React.FC<SectionIntroProps> = ({ section, index, onBegin }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase border border-black/20 px-4 py-1.5 rounded-full mb-6">
        Section {index + 1} of 3
      </div>
      
      <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-3" style={{ color: section.color }}>
        {section.label}
      </h2>
      
      <p className="font-mono text-xs md:text-sm text-gray-500 uppercase tracking-widest mb-10">
        {section.tagline} · 20 Questions
      </p>

      <div className="flex flex-wrap gap-4 justify-center mb-10">
        <div className="bg-[#F0EDE5] border border-black/10 rounded-xl p-4 min-w-[100px]">
          <span className="block text-2xl font-black leading-none">30s</span>
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Read time</span>
        </div>
        <div className="bg-[#F0EDE5] border border-black/10 rounded-xl p-4 min-w-[100px]">
          <span className="block text-2xl font-black leading-none">20</span>
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Questions</span>
        </div>
        <div className="bg-[#F0EDE5] border border-black/10 rounded-xl p-4 min-w-[100px]">
          <span className="block text-2xl font-black leading-none">1</span>
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Peek lifeline</span>
        </div>
        <div className="bg-[#F0EDE5] border border-black/10 rounded-xl p-4 min-w-[100px]">
          <span className="block text-2xl font-black leading-none">🃏</span>
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Win a card</span>
        </div>
      </div>

      <button 
        onClick={onBegin}
        className="bg-black text-white font-sans font-bold py-4 px-12 rounded-full text-base uppercase tracking-widest hover:bg-gray-900 transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
      >
        Begin &rarr;
      </button>
    </motion.div>
  );
};
