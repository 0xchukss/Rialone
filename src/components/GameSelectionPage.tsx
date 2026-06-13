import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Map, Trophy } from 'lucide-react';
import { RIALO_LOGO_BASE64 } from '../data/gameData';
import { usePrivy } from '../lib/PrivyProvider';

interface GameSelectionPageProps {
  onSelectQuiz: () => void;
  onSelectCity: () => void;
}

export const GameSelectionPage: React.FC<GameSelectionPageProps> = ({
  onSelectQuiz,
  onSelectCity
}) => {
  const { user } = usePrivy();
  const displayName = user?.google?.name || user?.email?.address?.split('@')[0] || 'anon';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#E8E4D9] px-5 pb-16 pt-28">
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-10%] h-96 w-96 rounded-full bg-[#C8A96A]/25 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center"
      >
        <img src={RIALO_LOGO_BASE64} className="mb-5 h-auto w-12" alt="Rialo" />
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
          Welcome, {displayName}
        </div>
        <h1 className="mb-4 text-center text-4xl font-black tracking-tight text-black sm:text-6xl">
          Choose your game
        </h1>
        <p className="mb-12 max-w-xl text-center text-sm font-medium leading-relaxed text-gray-600 sm:text-base">
          Enter the quiz arena or explore the city mission world. Your signed-in profile stays active across both games.
        </p>

        <div className="grid w-full gap-4 md:grid-cols-2">
          <button
            onClick={onSelectQuiz}
            className="group min-h-[280px] rounded-[24px] border border-black/10 bg-black p-6 text-left text-[#E8E4D9] shadow-2xl transition-all hover:-translate-y-1 hover:shadow-black/20"
          >
            <div className="mb-10 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Trophy size={22} />
              </div>
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={22} />
            </div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
              60 question challenge
            </div>
            <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
              Who Wants to Be a RialONE?
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/60">
              Read Rialo passages, answer timed questions, use lifelines, and earn the rialSAND, rialMETAL, and rialONE cards.
            </p>
          </button>

          <button
            onClick={onSelectCity}
            className="group min-h-[280px] rounded-[24px] border border-black/10 bg-[#F0EDE5] p-6 text-left text-black shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="mb-10 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                <Map size={22} />
              </div>
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={22} />
            </div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
              WebGL city missions
            </div>
            <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
              RialOne City
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-gray-600">
              Play the imported city retrieval game, collect mission symbols, drive around the map, and complete seven missions.
            </p>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
