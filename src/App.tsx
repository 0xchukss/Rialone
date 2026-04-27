import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SECTIONS, Section, Question } from './data/gameData';
import { shuffle, cn } from './lib/utils';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { TitleScreen } from './components/TitleScreen';
import { SectionIntro } from './components/SectionIntro';
import { ReadCard } from './components/ReadCard';
import { QuestionCard } from './components/QuestionCard';
import { RewardScreen } from './components/RewardScreen';
import { ResultScreen } from './components/ResultScreen';
import { CardsVault } from './components/CardsVault';
import { GameHeader } from './components/GameHeader';
import { Overlay } from './components/Overlay';
import { PrizeLadder } from './components/PrizeLadder';
import { Navbar } from './components/Navbar';

import { LandingPage } from './components/LandingPage';

type GameState = 'LANDING' | 'TITLE' | 'INTRO' | 'READ' | 'QUESTION' | 'REWARD' | 'RESULT' | 'VAULT';

interface SavedCard {
  dataUrl: string;
  name: string;
  discord: string;
  section: string;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LANDING');
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [shuffledSections, setShuffledSections] = useState<Section[]>([]);
  const [lifelines, setLifelines] = useState({ f50: true, phone: true, audience: true });
  const [peekUsed, setPeekUsed] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [fadedIndices, setFadedIndices] = useState<number[]>([]);
  const [ansTimer, setAnsTimer] = useState(30);
  const [overlay, setOverlay] = useState<{ isOpen: boolean; title: string; content: React.ReactNode } | null>(null);
  const [forfeitOpen, setForfeitOpen] = useState(false);

  const currentSection = shuffledSections[currentSectionIdx];
  const currentQuestion = currentSection?.questions[currentQuestionIdx];

  // Initialize game
  const initGame = useCallback(() => {
    const newShuffled = SECTIONS.map(sec => ({
      ...sec,
      questions: shuffle(sec.questions).map(q => {
        const indices = shuffle([0, 1, 2, 3]);
        return {
          ...q,
          a: indices.map(i => q.a[i]),
          correct: indices.indexOf(q.correct)
        };
      })
    }));
    setShuffledSections(newShuffled);
    setCurrentSectionIdx(0);
    setCurrentQuestionIdx(0);
    setLifelines({ f50: true, phone: true, audience: true });
  }, []);

  // Answer Timer Logic
  useEffect(() => {
    let timer: number;
    if (gameState === 'QUESTION' && !answered && ansTimer > 0) {
      timer = window.setInterval(() => setAnsTimer(t => t - 1), 1000);
    } else if (ansTimer === 0 && !answered) {
      handleWrongAnswer();
    }
    return () => clearInterval(timer);
  }, [gameState, answered, ansTimer]);

  const handleWrongAnswer = () => {
    setAnswered(true);
    setTimeout(() => setGameState('RESULT'), 2500);
  };

  const handleSelectAnswer = (idx: number) => {
    if (answered) return;
    setSelectedIndex(idx);
    setAnswered(true);

    setTimeout(() => {
      if (idx === currentQuestion.correct) {
        if (currentQuestionIdx === currentSection.questions.length - 1) {
          setGameState('REWARD');
        } else {
          setCurrentQuestionIdx(prev => prev + 1);
          setGameState('READ');
        }
      } else {
        handleWrongAnswer();
      }
    }, 1500);
  };

  const handleLifeline = (type: 'f50' | 'phone' | 'audience') => {
    if (!lifelines[type] || answered) return;
    setLifelines(prev => ({ ...prev, [type]: false }));

    if (type === 'f50') {
      const wrong = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
      const toFade = shuffle(wrong).slice(0, 2);
      setFadedIndices(toFade);
    } else if (type === 'phone') {
      const isConfident = Math.random() > 0.2;
      const msg = isConfident 
        ? `I'm pretty sure it's ${currentQuestion.a[currentQuestion.correct]}.`
        : `I'm not sure, maybe ${currentQuestion.a[Math.floor(Math.random() * 4)]}?`;
      setOverlay({ isOpen: true, title: '📞 Phone a Friend', content: msg });
    } else if (type === 'audience') {
      const votes = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 15));
      votes[currentQuestion.correct] += 50 + Math.floor(Math.random() * 20);
      const total = votes.reduce((a, b) => a + b, 0);
      const content = (
        <div className="space-y-2 mt-4">
          {votes.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-mono w-4">{String.fromCharCode(65 + i)}</span>
              <div className="flex-1 h-4 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-black" style={{ width: `${(v / total) * 100}%` }} />
              </div>
              <span className="font-mono text-[10px] w-8">{Math.round((v / total) * 100)}%</span>
            </div>
          ))}
        </div>
      );
      setOverlay({ isOpen: true, title: '👥 Ask the Audience', content });
    }
  };

  const onRewardContinue = (cardData: SavedCard) => {
    if (currentSectionIdx === shuffledSections.length - 1) {
      setGameState('RESULT');
    } else {
      setCurrentSectionIdx(prev => prev + 1);
      setCurrentQuestionIdx(0);
      setLifelines({ f50: true, phone: true, audience: true });
      setGameState('INTRO');
    }
  };

  const resetForNextQuestion = () => {
    setAnswered(false);
    setSelectedIndex(null);
    setFadedIndices([]);
    setAnsTimer(30);
    setPeekUsed(false);
  };

  useEffect(() => {
    if (gameState === 'READ' || gameState === 'QUESTION') {
      resetForNextQuestion();
    }
  }, [currentQuestionIdx, gameState]);

  if (shuffledSections.length === 0 && !['TITLE', 'LANDING', 'VAULT'].includes(gameState)) {
    return null;
  }

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden selection:bg-black selection:text-white">
      <Navbar />
      <AnimatePresence mode="wait">
        {gameState === 'LANDING' ? (
          <LandingPage 
            key="landing"
            onEnter={() => setGameState('TITLE')}
          />
        ) : (
          <>
            <BackgroundAnimation />
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
              <AnimatePresence mode="wait">
                {gameState === 'TITLE' && (
                  <TitleScreen 
                    key="title"
                    onStart={() => { initGame(); setGameState('INTRO'); }} 
                    onViewVault={() => setGameState('VAULT')}
                  />
                )}

          {gameState === 'INTRO' && (
            <SectionIntro 
              key="intro"
              section={currentSection} 
              index={currentSectionIdx}
              onBegin={() => setGameState('READ')}
            />
          )}

          {gameState === 'READ' && (
            <div key="read" className="flex flex-col items-center">
              <GameHeader 
                sectionLabel={currentSection.label}
                sectionColor={currentSection.color}
                currentQ={currentQuestionIdx}
                totalQ={currentSection.questions.length}
                lifelines={lifelines}
                onLifeline={handleLifeline}
                onForfeit={() => setForfeitOpen(true)}
              />
              <ReadCard 
                passage={currentQuestion.passage}
                questionNumber={currentQuestionIdx + 1}
                onTimerEnd={() => setGameState('QUESTION')}
                onSkip={() => setGameState('QUESTION')}
              />
              <PrizeLadder currentSection={currentSectionIdx} currentQ={currentQuestionIdx} />
            </div>
          )}

          {gameState === 'QUESTION' && (
            <div key="question" className="flex flex-col items-center">
              <GameHeader 
                sectionLabel={currentSection.label}
                sectionColor={currentSection.color}
                currentQ={currentQuestionIdx}
                totalQ={currentSection.questions.length}
                lifelines={lifelines}
                onLifeline={handleLifeline}
                onForfeit={() => setForfeitOpen(true)}
              />
              <QuestionCard 
                question={currentQuestion.q}
                answers={currentQuestion.a}
                correctIndex={currentQuestion.correct}
                selectedIndex={selectedIndex}
                onSelect={handleSelectAnswer}
                fadedIndices={fadedIndices}
                isAnswered={answered}
                sectionLabel={currentSection.label}
                questionNumber={currentQuestionIdx + 1}
                timeLeft={ansTimer}
              />
              <div className="flex justify-center mt-4">
                <button
                  disabled={peekUsed || answered}
                  onClick={() => setOverlay({ isOpen: true, title: '📖 Passage', content: currentQuestion.passage })}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-full font-mono text-[10px] uppercase tracking-widest border border-black/10 transition-all",
                    peekUsed ? "opacity-30 cursor-not-allowed border-dashed" : "bg-[#F0EDE5] hover:bg-black hover:text-white"
                  )}
                >
                  <span>👁 View Passage</span>
                  {!peekUsed && <span className="bg-black text-white px-1.5 py-0.5 rounded-full text-[8px]">1 LEFT</span>}
                </button>
              </div>
              <PrizeLadder currentSection={currentSectionIdx} currentQ={currentQuestionIdx} />
            </div>
          )}

          {gameState === 'REWARD' && (
            <RewardScreen 
              key="reward"
              section={currentSection}
              isLastSection={currentSectionIdx === shuffledSections.length - 1}
              onContinue={onRewardContinue}
            />
          )}

          {gameState === 'RESULT' && (
            <ResultScreen 
              key="result"
              isWin={currentQuestionIdx >= 19 && currentSectionIdx === 2}
              score={currentQuestionIdx + 1}
              sectionLabel={currentSection.label}
              onRestart={() => setGameState('TITLE')}
            />
          )}

          {gameState === 'VAULT' && (
            <CardsVault 
              key="vault"
              onBack={() => setGameState('TITLE')} 
            />
          )}
              </AnimatePresence>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <Overlay 
        isOpen={!!overlay?.isOpen} 
        onClose={() => setOverlay(null)} 
        title={overlay?.title || ''}
      >
        {overlay?.content}
      </Overlay>

      <Overlay
        isOpen={forfeitOpen}
        onClose={() => setForfeitOpen(false)}
        title="⚠️ Forfeit Game?"
        type="danger"
        confirmText="Yes, Forfeit"
        onConfirm={() => { setForfeitOpen(false); setGameState('TITLE'); }}
      >
        You'll lose your progress in this section and return to the main menu. Cards from completed sections are saved.
      </Overlay>

      <div className="fixed bottom-3 right-4 font-mono text-[8px] text-gray-400 uppercase tracking-widest opacity-50">
        built by Chuks
      </div>
    </div>
  );
}

