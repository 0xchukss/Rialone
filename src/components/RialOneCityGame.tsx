import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface RialOneCityGameProps {
  onBack: () => void;
}

export const RialOneCityGame: React.FC<RialOneCityGameProps> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:text-black"
      >
        <ArrowLeft size={14} /> Games
      </button>
      <iframe
        title="RialOne City"
        src="/realonecity/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; gamepad"
      />
    </div>
  );
};
