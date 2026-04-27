import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface ReadCardProps {
  passage: string;
  questionNumber: number;
  onTimerEnd: () => void;
  onSkip: () => void;
}

export const ReadCard: React.FC<ReadCardProps> = ({
  passage,
  questionNumber,
  onTimerEnd,
  onSkip
}) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    setTimeLeft(30);
  }, [passage]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimerEnd();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimerEnd]);

  const dashOffset = 188.5 * (1 - timeLeft / 30);
  const isWarning = timeLeft <= 10 && timeLeft > 5;
  const isUrgent = timeLeft <= 5;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#F0EDE5] border border-black/20 rounded-[20px] p-8 md:p-10"
    >
      <div className="flex justify-between items-start mb-5 gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-gray-500 uppercase font-bold mb-1.5">
            📖 Read This Passage
          </div>
          <div className="font-mono text-[9px] text-gray-500 bg-gray-200 border border-black/10 px-2.5 py-1 rounded-full inline-block">
            Question {questionNumber}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative w-[68px] h-[68px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
              <circle className="fill-none stroke-black/10 stroke-[5]" cx="35" cy="35" r="30"/>
              <circle 
                className={`fill-none stroke-[5] stroke-linecap-round transition-all duration-1000 linear ${
                  isUrgent ? 'stroke-red-600' : isWarning ? 'stroke-amber-600' : 'stroke-black'
                }`}
                cx="35" cy="35" r="30"
                style={{ strokeDasharray: 188.5, strokeDashoffset: dashOffset }}
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center font-mono text-xl font-bold ${
              isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-black'
            }`}>
              {timeLeft}
            </div>
          </div>
          <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">seconds</div>
        </div>
      </div>

      <div className="text-base md:text-lg leading-relaxed text-gray-900 mb-5">
        {passage}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-black/10">
        <div className="font-mono text-[9px] text-gray-400 italic">
          Question appears after the timer
        </div>
        <button 
          onClick={onSkip}
          className="font-mono text-[9px] text-gray-500 bg-transparent border border-black/20 px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-black hover:text-white hover:border-black transition-all"
        >
          Skip &rarr;
        </button>
      </div>
    </motion.div>
  );
};
