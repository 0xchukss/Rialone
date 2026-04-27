import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Twitter } from 'lucide-react';
import { Section, RIALO_LOGO_BASE64 } from '../data/gameData';
import { cn } from '../lib/utils';
import { usePrivy } from '../lib/PrivyProvider';

interface RewardScreenProps {
  section: Section;
  onContinue: (cardData: { dataUrl: string; name: string; discord: string }) => void;
  isLastSection: boolean;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({
  section,
  onContinue,
  isLastSection
}) => {
  const { user, saveCard } = usePrivy();
  const [name, setName] = useState(user?.google?.name || user?.email?.address?.split('@')[0] || '');
  const [discord, setDiscord] = useState('');
  const [avatar, setAvatar] = useState<string | null>(user?.google?.picture || null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generateAndContinue = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 640, H = 840;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsSaving(true);

    const draw = async (avatarImg: HTMLImageElement | null, templateImg: HTMLImageElement) => {
      const TW = templateImg.width;
      const TH = templateImg.height;
      canvas.width = TW;
      canvas.height = TH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale context so we can keep using our 640x840 coordinate system
      ctx.scale(TW / 640, TH / 840);

      // Draw template background
      ctx.drawImage(templateImg, 0, 0, 640, 840);

      const tc = section.cardText || '#F0EDE5';
      
      const cx = 640 / 2, cy = 340, r = 120;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      if (avatarImg) {
        ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        ctx.font = '100px serif'; ctx.textAlign = 'center'; ctx.fillStyle = tc;
        ctx.fillText('🧑', cx - 4, cy + 35);
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = tc; ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(name || 'Anonymous', 640 / 2, 530);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '26px monospace';
      ctx.fillText(discord ? (discord.startsWith('@') ? discord : '@' + discord) : '@username', 640 / 2, 575);

      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '16px monospace'; ctx.textAlign = 'center';
      ctx.fillText('built by Chuks · rialo.io', 640 / 2, 840 - 35);

      const dataUrl = canvas.toDataURL('image/png');
      
      if (user) {
        await saveCard(section.id, { dataUrl, name: name || 'Anonymous', discord });
      }
      
      setLastDataUrl(dataUrl);
      setIsSaving(false);
      onContinue({ dataUrl, name: name || 'Anonymous', discord });
    };

    const templateImg = new Image();
    templateImg.crossOrigin = 'anonymous';
    templateImg.onload = () => {
      if (avatar) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => draw(img, templateImg);
        img.src = avatar;
      } else {
        draw(null, templateImg);
      }
    };
    templateImg.src = section.cardTemplate;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center p-6 md:p-10 w-full max-w-5xl mx-auto"
    >
      <div className="text-center mb-10">
        <div className="font-mono text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">Section Complete 🎉</div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight">
          You earned the <em className="not-italic px-2 rounded-lg bg-black text-white">{section.label}</em> card!
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start justify-center w-full">
        {/* Card Preview */}
        <div className="shrink-0 mx-auto lg:mx-0">
          <div 
            className="w-[280px] h-[480px] rounded-[24px] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.02]"
            style={{ 
              backgroundImage: `url(${section.cardTemplate})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: section.cardText 
            }}
          >
             {/* Overlay for grid/glass effect if needed, but the template already has it */}
             <div className="relative z-10 h-full flex flex-col items-center justify-center pt-10">
                <div className="flex flex-col items-center mb-8">
                  {avatar ? (
                    <img src={avatar} className="w-28 h-28 rounded-full object-cover border-4 border-white/30" alt="" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-white/15 border-2 border-dashed border-white/30 flex items-center justify-center text-4xl">🧑</div>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-2xl font-black tracking-tight mb-1">{name || 'Your Name'}</div>
                  <div className="font-mono text-xs opacity-70">{discord ? (discord.startsWith('@') ? discord : '@' + discord) : '@username'}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 max-w-sm w-full">
          <h3 className="text-xl font-extrabold tracking-tight mb-1">Personalise Your Card</h3>
          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-6">Fill in your details to generate your card</p>
          
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-[#F0EDE5] border border-black/10 rounded-xl font-sans text-sm font-medium focus:border-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Discord Username</label>
              <input 
                type="text" 
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-3 bg-[#F0EDE5] border border-black/10 rounded-xl font-sans text-sm font-medium focus:border-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Profile Picture</label>
              <div 
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="w-full p-4 bg-[#F0EDE5] border-2 border-dashed border-black/10 rounded-xl text-center cursor-pointer hover:border-black hover:bg-gray-200 transition-all"
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Click to upload photo</div>
              </div>
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={generateAndContinue}
              disabled={isSaving}
              className="w-full bg-black text-white font-sans font-bold py-3.5 px-6 rounded-full text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? 'Processing...' : (isLastSection ? 'See Final Results →' : `Continue to ${section.label} →`)}
            </button>
            
            <button 
              onClick={async () => {
                if (!lastDataUrl) {
                  // If not generated yet, we generate it first
                  const canvas = canvasRef.current;
                  if (canvas) {
                    // This is a simplified version of generateAndContinue just to get the dataUrl
                    // but it's better to just call generateAndContinue or show a message.
                    // For now, let's assume they might need to generate it.
                  }
                }
                
                try {
                  const targetUrl = lastDataUrl || (canvasRef.current?.toDataURL());
                  if (!targetUrl) return;

                  const response = await fetch(targetUrl);
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
              className="w-full flex items-center justify-center gap-2 bg-[#1DA1F2] text-white font-sans font-bold py-3.5 px-6 rounded-full text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
            >
              <Twitter size={16} /> {copied ? 'Copied! Opening X...' : 'Share on X'}
            </button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
};
