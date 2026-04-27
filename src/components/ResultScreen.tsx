import React from 'react';
import { motion } from 'motion/react';

interface ResultScreenProps {
  isWin: boolean;
  score: number;
  sectionLabel: string;
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  isWin,
  score,
  sectionLabel,
  onRestart
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center"
    >
      <div className="bg-[#F0EDE5] border border-black/10 rounded-[32px] p-10 md:p-14 max-w-lg w-full shadow-2xl">
        <span className="text-6xl mb-6 block">{isWin ? '🏆' : '⚡'}</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          {isWin ? (
            <>You're a <em className="not-italic bg-black text-white px-2 rounded-lg">RialONE!</em></>
          ) : (
            'Game Over'
          )}
        </h2>
        
        <div className="text-lg font-bold text-gray-800 mb-2">
          {isWin ? (
            'You completed all 60 questions across all 3 sections!'
          ) : (
            `You reached ${sectionLabel}, Question ${score}`
          )}
        </div>
        
        <p className="text-gray-500 mb-10 leading-relaxed">
          {isWin ? (
            'rialSAND · rialMETAL · rialONE — You have mastered the Rialo protocol.'
          ) : (
            'Keep studying the Rialo docs and come back stronger.'
          )}
        </p>

        <button 
          onClick={onRestart}
          className="bg-black text-white font-sans font-bold py-4 px-10 rounded-full text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          ↺ Play Again
        </button>
      </div>

      <div className="mt-10 font-mono text-[10px] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
        <img src="data:image/png;base64,..." className="w-4 h-auto opacity-40" alt="" />
        Powered by <a href="https://www.rialo.io" target="_blank" rel="noreferrer" className="text-black font-bold hover:underline">rialo.io</a>
      </div>
    </motion.div>
  );
};
