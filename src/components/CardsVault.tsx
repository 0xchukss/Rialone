import React from 'react';
import { motion } from 'motion/react';
import { usePrivy } from '../lib/PrivyProvider';
import { SECTIONS } from '../data/gameData';
import { Download, Lock, User as UserIcon, Twitter } from 'lucide-react';
import { cn } from '../lib/utils';

interface CardsVaultProps {
  onBack: () => void;
}

export const CardsVault: React.FC<CardsVaultProps> = ({ onBack }) => {
  const { userCards, user, loading, authenticated } = usePrivy();
  const [copied, setCopied] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('CardsVault Rendered. State:', { 
      hasUser: !!user, 
      loading, 
      authenticated, 
      sectionsCount: SECTIONS?.length,
      userCardsCount: userCards ? Object.keys(userCards).length : 'N/A'
    });
  }, [user, loading, authenticated, userCards]);

  const downloadCard = (card: any) => {
    if (!card || !card.dataUrl) return;
    try {
      const a = document.createElement('a');
      const timestamp = card.earnedAt ? new Date(card.earnedAt).getTime() : Date.now();
      a.download = `${card.sectionId || 'card'}-${timestamp}.png`;
      a.href = card.dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // If we're loading, show a centered spinner/text
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="font-mono text-sm text-gray-400 animate-pulse uppercase tracking-[0.3em]">Accessing Vaults...</div>
      </div>
    );
  }

  // If not authenticated, show a friendly sign-in prompt
  if (!authenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="max-w-md bg-[#F0EDE5] border border-black/5 p-12 rounded-[40px] shadow-sm">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <Lock className="text-black/20" size={32} />
          </div>
          <h2 className="text-2xl font-black mb-3 tracking-tight">Vault Locked</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Please sign in to view your collection of earned cards.</p>
          <button 
            onClick={onBack} 
            className="w-full bg-black text-white font-sans font-bold py-4 px-10 rounded-full text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-98 transition-all shadow-xl"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center min-h-screen p-6 pt-24 pb-20"
    >
      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-24 left-8 z-50 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95"
      >
        ← Back
      </button>

      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">The Vault</h2>
        <p className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.4em] opacity-60">
          Collection of {user?.google?.name || user?.email?.address || 'your'} journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 justify-center max-w-7xl w-full px-4">
        {SECTIONS.map((section) => {
          // Safety: ensure userCards is an object
          const cardsForSection = (userCards && typeof userCards === 'object') ? (userCards[section.id] || []) : [];
          const isOwned = cardsForSection.length > 0;
          
          // Find the latest card by earnedAt date
          let latestCard = null;
          if (isOwned) {
            try {
              latestCard = [...cardsForSection].sort((a, b) => {
                const dateA = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
                const dateB = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
                return dateB - dateA;
              })[0];
            } catch (e) {
              latestCard = cardsForSection[0];
            }
          }

          return (
            <div key={section.id} className="flex flex-col items-center group">
              <div className="relative mb-8">
                {/* Card Template / Earned Card */}
                <div className="relative transition-all duration-500 group-hover:translate-y-[-8px]">
                  <img 
                    src={latestCard?.dataUrl || section.cardTemplate} 
                    className={cn(
                      "w-[280px] h-auto rounded-[32px] shadow-2xl transition-all duration-700",
                      !isOwned && "grayscale opacity-40 brightness-75 scale-[0.95]",
                      isOwned && "group-hover:rotate-2 group-hover:scale-[1.02]"
                    )} 
                    alt={section.label} 
                  />
                  
                  {/* Lock Indicator for unearned cards */}
                  {!isOwned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/5 backdrop-blur-xl p-5 rounded-full border border-white/10 shadow-2xl">
                        <Lock className="text-white/20" size={28} />
                      </div>
                    </div>
                  )}

                  {/* Ownership Badge */}
                  <div className={cn(
                    "absolute -top-4 -right-4 w-14 h-14 rounded-full flex flex-col items-center justify-center font-black shadow-2xl border-4 transition-all duration-500",
                    isOwned ? "bg-black text-white border-white scale-110 rotate-12" : "bg-gray-100 text-gray-300 border-transparent scale-90"
                  )}>
                    <span className="text-xl leading-none">{cardsForSection.length}</span>
                    <span className="text-[7px] uppercase tracking-tighter opacity-60">Owned</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-black transition-colors">{section.label}</h3>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-6">{section.tagline}</p>
                
                {isOwned ? (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => downloadCard(latestCard)}
                      className="w-full flex items-center justify-center gap-3 bg-black text-white font-mono text-[10px] py-3.5 px-8 rounded-full uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl active:scale-95"
                    >
                      <Download size={14} /> Download PNG
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch(latestCard.dataUrl);
                          const blob = await response.blob();
                          await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                          ]);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just claimed my ${section.label} card on Who wants to be a rialOne blockbuster! 🚀 @RialoHQ`)}`, '_blank');
                        } catch (err) {
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just claimed my ${section.label} card on Who wants to be a rialOne blockbuster! 🚀 @RialoHQ`)}`, '_blank');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-[#1DA1F2] text-white font-mono text-[10px] py-3.5 px-8 rounded-full uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl active:scale-95"
                    >
                      <Twitter size={14} /> {copied ? 'Copied!' : 'Share on X'}
                    </button>
                  </div>
                ) : (
                  <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest border-2 border-dashed border-black/5 px-6 py-3 rounded-full">
                    LOCKED · FINISH SECTION
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onBack}
        className="mt-24 bg-white border border-black/10 text-black font-sans font-bold py-4 px-12 rounded-full text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg active:scale-95"
      >
        ← Back to Main Menu
      </button>
    </motion.div>
  );
};
