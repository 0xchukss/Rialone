import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { RIALO_LOGO_BASE64 } from '../data/gameData';
import { cn } from '../lib/utils';

interface FloatingTextProps {
  text: string;
  delay: number;
  duration: number;
  size: string;
  top: string;
  left: string;
}

const FloatingText: React.FC<FloatingTextProps> = ({ text, delay, duration, size, top, left }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: [0.2, 0.6, 0.2],
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [0.95, 1.05, 0.95]
    }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    className={cn(
      "absolute pointer-events-none font-black tracking-tighter text-white/25 select-none whitespace-nowrap",
      size
    )}
    style={{ top, left }}
  >
    {text}
  </motion.div>
);

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const floatingTexts = useMemo(() => {
    const texts = [];
    const sizes = ['text-2xl', 'text-4xl', 'text-6xl', 'text-8xl', 'text-9xl'];
    for (let i = 0; i < 25; i++) {
      texts.push({
        id: i,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        top: `${Math.floor(Math.random() * 100)}%`,
        left: `${Math.floor(Math.random() * 100)}%`,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 12,
      });
    }
    return texts;
  }, []);

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden w-screen">
      {/* Background Organic Shapes (Simplified) */}
      <div className="absolute inset-0 overflow-hidden opacity-50 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 80, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-[-15%] w-[80%] h-[80%] bg-neutral-800/60 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.3, 1, 1.3],
            x: [0, -60, 0],
            y: [0, -80, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-15%] w-[90%] h-[90%] bg-neutral-900/60 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.4, 1],
            x: [0, 50, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] right-[15%] w-[50%] h-[50%] bg-neutral-800/40 rounded-full blur-[100px]" 
        />
      </div>

      {/* Scattered Text */}
      {floatingTexts.map((t) => (
        <FloatingText 
          key={t.id}
          text="YOU WANT TO BE A RIALONE???"
          size={t.size}
          top={t.top}
          left={t.left}
          delay={t.delay}
          duration={t.duration}
        />
      ))}

      {/* Central Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        <img src={RIALO_LOGO_BASE64} className="w-16 h-auto mb-8 opacity-80" alt="Rialo" />
        
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
          Hey ANON.
        </h1>
        
        <p className="text-neutral-400 text-sm md:text-base max-w-md mb-12 font-medium">
          Test your all round knowledge about rialo and it's technology.
        </p>

        <button
          onClick={onEnter}
          className="group relative px-12 py-4 bg-white text-black font-sans font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative z-10 uppercase tracking-widest text-sm">Enter the Game</span>
          <motion.div 
            className="absolute inset-0 bg-neutral-200"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
        </button>
      </motion.div>

      {/* Bottom Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] text-neutral-600 uppercase tracking-[0.3em]">
        WHO WANTS TO BE A RIALONE??? · 2026
      </div>
    </div>
  );
};
