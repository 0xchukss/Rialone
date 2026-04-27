import React from 'react';
import { PRIZES_PER_SECTION, MILESTONES_PER_SECTION } from '../data/gameData';
import { cn } from '../lib/utils';

interface PrizeLadderProps {
  currentSection: number;
  currentQ: number;
}

export const PrizeLadder: React.FC<PrizeLadderProps> = ({ currentSection, currentQ }) => {
  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 hidden lg:flex flex-col-reverse gap-[1px] z-10">
      {PRIZES_PER_SECTION.map((sectionPrizes, sIdx) => (
        <React.Fragment key={sIdx}>
          {sectionPrizes.map((prize, qIdx) => {
            const isMilestone = MILESTONES_PER_SECTION[sIdx].includes(qIdx);
            const isPassed = sIdx < currentSection || (sIdx === currentSection && qIdx < currentQ);
            const isCurrent = sIdx === currentSection && qIdx === currentQ;

            return (
              <div
                key={qIdx}
                className={cn(
                  "flex items-center gap-2 px-2 py-0.5 font-mono text-[10px] transition-all rounded",
                  isMilestone ? "text-gray-900 font-bold" : "text-gray-500",
                  isPassed && "opacity-25",
                  isCurrent && "bg-black text-white rounded-md px-2.5 py-1 font-bold text-[11px]"
                )}
              >
                <span>{qIdx + 1}</span>
                <span className="max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {prize}
                </span>
              </div>
            );
          })}
          {sIdx < PRIZES_PER_SECTION.length - 1 && (
            <div className="h-1 bg-gray-200 rounded-full mx-1 my-0.5" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
