import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  mode?: 'trial' | 'final';
}

export default function SingleChanceModal({ isOpen, onConfirm, onCancel, title = "Unskippable Judgment", mode = 'trial' }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onCancel}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative bg-zinc-950 border-4 border-white p-10 max-w-lg w-full overflow-hidden"
          >
            {/* Brutalist Warning Stripe */}
            <div className="absolute top-0 left-0 w-full h-2 bg-chaos-pink flex">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-1 h-full even:bg-black opacity-30"></div>
              ))}
            </div>

            <div className="flex items-start gap-6 mb-8 pt-4">
              <div className="p-4 bg-chaos-pink text-black">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-[10px] font-mono text-chaos-pink uppercase tracking-widest mb-1">
                  {mode === 'trial' ? 'Phase 01: Trial Calibration' : 'Phase 02: Final Submission'}
                </h3>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{title}</h2>
              </div>
            </div>

            <p className="text-zinc-400 font-medium mb-10 leading-relaxed text-lg">
              {mode === 'trial' ? (
                <>🚨 This is your <span className="text-white underline decoration-chaos-pink decoration-2 underline-offset-4 font-black italic">TRIAL</span> run. Get judged by the AI lords to test your mettle. You will have one more final submission after this.</>
              ) : (
                <>🚨 This is your <span className="text-white underline decoration-chaos-pink decoration-2 underline-offset-4 font-black italic">FINAL</span> submission. Your score will be carved into the leaderboard forever. No more retries after this point.</>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={onCancel}
                className="h-16 border-2 border-white text-white font-black uppercase italic hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Regret & Exit
              </button>
              <button 
                onClick={onConfirm}
                className="h-16 bg-white text-black font-black uppercase italic text-xl hover:bg-chaos-pink transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {mode === 'trial' ? 'Test Fate' : 'Commit Fate'}
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-700" />
              <p className="text-[10px] font-mono text-zinc-600 uppercase">System Key: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
