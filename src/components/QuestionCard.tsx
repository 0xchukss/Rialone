import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface QuestionCardProps {
  question: string;
  answers: string[];
  correctIndex: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  fadedIndices: number[];
  isAnswered: boolean;
  sectionLabel: string;
  questionNumber: number;
  timeLeft: number;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answers,
  correctIndex,
  selectedIndex,
  onSelect,
  fadedIndices,
  isAnswered,
  sectionLabel,
  questionNumber,
  timeLeft
}) => {
  const isWarning = timeLeft <= 10 && timeLeft > 5;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-black text-[#E8E4D9] rounded-2xl p-6 md:p-8 mb-4"
      >
        <div className="font-mono text-[9px] text-white/40 tracking-[0.15em] uppercase mb-2.5">
          {sectionLabel} · Question {questionNumber}
        </div>
        <div className="text-lg md:text-xl font-bold leading-snug tracking-tight">
          {question}
        </div>
      </motion.div>

      <div className="text-right font-mono text-[9px] text-gray-500 mb-1">
        <span className={cn(isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "")}>
          {timeLeft}s
        </span> remaining
      </div>
      <div className="w-full h-1 bg-black/10 rounded-full mb-4 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-1000 linear",
            isUrgent ? "bg-red-600" : isWarning ? "bg-amber-600" : "bg-black"
          )}
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {answers.map((answer, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = isAnswered && i === correctIndex;
          const isWrong = isAnswered && isSelected && i !== correctIndex;
          const isFaded = fadedIndices.includes(i);

          return (
            <button
              key={i}
              disabled={isAnswered || isFaded}
              onClick={() => onSelect(i)}
              className={cn(
                "answer-btn flex items-center gap-3 text-left p-4 rounded-xl border-2 font-semibold transition-all duration-150",
                "bg-[#F0EDE5] border-black/10 text-black",
                !isAnswered && !isFaded && "hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5 hover:shadow-lg",
                isSelected && "bg-neutral-800 text-white border-neutral-800 animate-pulse",
                isCorrect && "bg-green-100 border-green-600 text-green-700",
                isWrong && "bg-red-100 border-red-600 text-red-700",
                isFaded && "opacity-15 pointer-events-none"
              )}
            >
              <span className={cn(
                "font-mono text-[10px] font-bold min-w-[18px] transition-colors",
                isSelected ? "text-white/40" : "text-gray-400"
              )}>
                {LETTERS[i]}
              </span>
              <span className="text-sm md:text-base">{answer}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
