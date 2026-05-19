import React from 'react';
import { motion } from 'motion/react';
import { Zap, Skull, Coffee, Ghost } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Glitch Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-chaos-pink/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chaos-green/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 space-y-8"
      >
        <div className="space-y-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-chaos-pink font-mono text-sm tracking-[0.6em] uppercase"
          >
            Welcome to the Void
          </motion.h2>
          <motion.h1 
            initial={{ opacity: 0, scale: 1.5, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-8xl md:text-[10rem] font-black italic text-white uppercase leading-[0.8] tracking-tighter"
          >
            Chaos<br/>Carnival
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-zinc-500 font-mono text-xs uppercase tracking-widest max-w-sm mx-auto"
        >
          // JUDGMENT // RIDDLES // TEMPORAL ANOMALIES // NO REFUNDS //
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8 }}
           className="pt-10"
        >
          <button 
            onClick={onStart}
            className="group relative px-12 py-6 bg-white text-black font-black uppercase text-4xl italic hover:bg-chaos-green transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(0,255,0,0.4)]"
          >
            Enter Chaos
            <div className="absolute -top-2 -left-2 w-full h-full border-2 border-white pointer-events-none group-hover:border-chaos-green transition-colors transform -skew-x-12 translate-x-1 translate-y-1"></div>
          </button>
        </motion.div>
      </motion.div>

      {/* Floating text elements */}
      <div className="fixed bottom-10 left-10 text-[10px] font-mono text-zinc-800 uppercase space-y-1 text-left hidden md:block">
        <div>LATENCY_CRITICAL: TRUE</div>
        <div>REALITY_CHECK: FAILED</div>
        <div>VERSION: 2026.05.HS</div>
      </div>
    </div>
  );
}
