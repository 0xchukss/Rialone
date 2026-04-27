import React from 'react';
import { RIALO_LOGO_BASE64 } from '../data/gameData';

interface GameHeaderProps {
  sectionLabel: string;
  sectionColor: string;
  currentQ: number;
  totalQ: number;
  lifelines: { f50: boolean; phone: boolean; audience: boolean };
  onLifeline: (type: 'f50' | 'phone' | 'audience') => void;
  onForfeit: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  sectionLabel,
  sectionColor,
  currentQ,
  totalQ,
  lifelines,
  onLifeline,
  onForfeit
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center w-full mb-5 pb-4 border-b border-black/20 gap-2">
      <div className="flex items-center gap-2.5 font-extrabold text-base tracking-tight">
        <img src={RIALO_LOGO_BASE64} className="w-7 h-auto" alt="Rialo" />
        <span 
          className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-current font-bold uppercase tracking-wider"
          style={{ color: sectionColor }}
        >
          {sectionLabel}
        </span>
      </div>

      <div className="flex gap-1.5">
        <button
          disabled={!lifelines.f50}
          onClick={() => onLifeline('f50')}
          className="font-mono text-[9px] px-2.5 py-1.5 border border-black/20 bg-[#F0EDE5] text-gray-800 rounded-full font-bold uppercase tracking-wider hover:bg-black hover:text-white hover:border-black disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          50:50
        </button>
        <button
          disabled={!lifelines.phone}
          onClick={() => onLifeline('phone')}
          className="font-mono text-[9px] px-2.5 py-1.5 border border-black/20 bg-[#F0EDE5] text-gray-800 rounded-full font-bold uppercase tracking-wider hover:bg-black hover:text-white hover:border-black disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Phone
        </button>
        <button
          disabled={!lifelines.audience}
          onClick={() => onLifeline('audience')}
          className="font-mono text-[9px] px-2.5 py-1.5 border border-black/20 bg-[#F0EDE5] text-gray-800 rounded-full font-bold uppercase tracking-wider hover:bg-black hover:text-white hover:border-black disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Audience
        </button>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="font-mono text-[9px] text-gray-500 uppercase tracking-wider text-right leading-none">
          Question
          <strong className="block text-sm text-black font-sans font-black tracking-tight">
            {currentQ + 1}/{totalQ}
          </strong>
        </div>
        <button
          onClick={onForfeit}
          className="font-mono text-[9px] text-gray-500 bg-transparent border border-dashed border-black/20 px-2.5 py-1 rounded-full uppercase tracking-wider hover:text-red-700 hover:border-red-700 transition-all"
        >
          ✕ Forfeit
        </button>
      </div>
    </div>
  );
};
