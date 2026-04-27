import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'default' | 'danger';
  onConfirm?: () => void;
  confirmText?: string;
}

export const Overlay: React.FC<OverlayProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'default',
  onConfirm,
  confirmText
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative bg-[#F0EDE5] border border-black/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
          >
            <h3 className="font-mono text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">
              {title}
            </h3>
            <div className="text-gray-800 mb-6 leading-relaxed">
              {children}
            </div>
            <div className="flex gap-3 justify-center">
              {onConfirm ? (
                <>
                  <button
                    onClick={onConfirm}
                    className={cn(
                      "flex-1 font-sans font-bold py-2.5 px-6 rounded-full text-sm uppercase tracking-wider transition-all",
                      type === 'danger' ? "bg-red-700 text-white hover:bg-red-800" : "bg-black text-white hover:bg-gray-900"
                    )}
                  >
                    {confirmText || 'Confirm'}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 font-sans font-bold py-2.5 px-6 rounded-full text-sm uppercase tracking-wider border border-black/10 text-black hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="font-sans font-bold py-2.5 px-8 rounded-full text-sm uppercase tracking-wider bg-black text-white hover:bg-gray-900 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  Got it
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
