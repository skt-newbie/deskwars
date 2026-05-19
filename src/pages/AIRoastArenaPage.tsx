import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Layout, Palette, ArrowLeft, ArrowUpRight, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
import { fetchJson } from '../lib/api';

interface Props {
  onNavigate: (page: string, params?: any) => void;
  onBack: () => void;
}

export default function AIRoastArenaPage({ onNavigate, onBack }: Props) {
  const [counts, setCounts] = useState<{ desk: number; drawing: number }>({ desk: 0, drawing: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson('/api/submissions/counts')
      .then(setCounts)
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          console.error("Failed to fetch counts", err);
          setError(err.message);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const drawingLocked = counts.drawing >= 2;
  const deskLocked = counts.desk >= 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-white border-t-chaos-pink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Matrix
          </button>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">AI Roast Arena</h1>
          <p className="text-chaos-pink font-mono text-[10px] uppercase tracking-widest mt-1">Zone 01: Algorithmic Humiliation</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Game 1.1: Finish the Madness */}
        <motion.button
          whileHover={drawingLocked ? {} : { scale: 1.02 }}
          onClick={() => !drawingLocked && onNavigate('upload', { aiType: 'drawing' })}
          className={`group relative border-4 p-10 text-left overflow-hidden min-h-[400px] flex flex-col justify-between transition-all ${
            drawingLocked 
              ? 'bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed' 
              : 'bg-zinc-950 border-white opacity-100'
          }`}
          disabled={drawingLocked}
        >
          <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-zinc-700 uppercase">
            {drawingLocked ? 'Archived' : 'Game 1.1'}
          </div>
          
          <div className="relative z-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 transition-colors ${
              drawingLocked ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black group-hover:bg-chaos-pink'
            }`}>
              {drawingLocked ? <Lock className="w-10 h-10" /> : <Palette className="w-10 h-10" />}
            </div>
            
            <h3 className="text-4xl font-black uppercase tracking-tight italic mb-4">
              {drawingLocked ? 'Evaluation Complete' : 'Finish the Madness'}
            </h3>
            
            <div className="flex gap-2 mb-4">
               {drawingLocked ? (
                 <span className="px-2 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30 text-[8px] font-black uppercase flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> Scored in Lattice
                 </span>
               ) : (
                 <>
                   <span className="px-2 py-0.5 bg-chaos-pink text-black text-[8px] font-black uppercase">
                     {counts.drawing === 0 ? 'Trial + Final' : 'Final Chance'}
                   </span>
                   <span className="px-2 py-0.5 border border-white/20 text-zinc-500 text-[8px] font-black uppercase">+Points Ready</span>
                 </>
               )}
            </div>
            
            <p className="text-zinc-400 max-w-xs leading-snug">
              {drawingLocked 
                ? "Your chaotic contribution has been analyzed and permanently stored. No further modifications allowed."
                : "AI generated a chaotic mess. You need to finish it. Submit to the Roast Master for scoring."}
            </p>
          </div>

          <div className={`flex items-center gap-2 font-black uppercase text-sm ${drawingLocked ? 'text-zinc-700' : 'group-hover:text-chaos-pink'}`}>
            {drawingLocked ? 'Submission Locked' : 'Enter Canvas'} {drawingLocked ? <Lock className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </motion.button>

        {/* Game 1.2: Desk Wars */}
        <motion.button
          whileHover={deskLocked ? {} : { scale: 1.02 }}
          onClick={() => !deskLocked && onNavigate('upload', { aiType: 'desk' })}
          className={`group relative border-4 p-10 text-left overflow-hidden min-h-[400px] flex flex-col justify-between transition-all ${
            deskLocked 
              ? 'bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed' 
              : 'bg-zinc-950 border-white opacity-100'
          }`}
          disabled={deskLocked}
        >
           <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-zinc-700 uppercase">
             {deskLocked ? 'Archived' : 'Game 1.2'}
           </div>
           
           <div className="relative z-10">
            <div className={`w-20 h-20 flex items-center justify-center mb-8 transition-colors ${
              deskLocked ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black group-hover:bg-chaos-green'
            }`}>
              {deskLocked ? <Lock className="w-10 h-10" /> : <Layout className="w-10 h-10" />}
            </div>
            
            <h3 className="text-4xl font-black uppercase tracking-tight italic mb-4">
              {deskLocked ? 'Setup Audited' : 'Desk Wars'}
            </h3>
            
            <div className="flex gap-2 mb-4">
               {deskLocked ? (
                 <span className="px-2 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30 text-[8px] font-black uppercase flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> Audit Sealed
                 </span>
               ) : (
                 <>
                   <span className="px-2 py-0.5 bg-chaos-pink text-black text-[8px] font-black uppercase">
                     {counts.desk === 0 ? 'Trial + Final' : 'Final Chance'}
                   </span>
                   <span className="px-2 py-0.5 border border-white/20 text-zinc-500 text-[8px] font-black uppercase">Leaderboard Active</span>
                 </>
               )}
            </div>
            
            <p className="text-zinc-400 max-w-xs leading-snug">
               {deskLocked
                 ? "The Roast Master has spoken. Your desk configuration is set in stone for this cycle."
                 : "Photograph your chaotic workspace. Get roasted for cable management (or lack thereof)."}
            </p>
          </div>

          <div className={`flex items-center gap-2 font-black uppercase text-sm ${deskLocked ? 'text-zinc-700' : 'group-hover:text-chaos-green'}`}>
            {deskLocked ? 'Audit Locked' : 'Upload Setup'} {deskLocked ? <Lock className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 0), linear-gradient(90deg, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </motion.button>
      </div>

      {/* Tilted bottom banner */}
      <div className="fixed -bottom-10 right-0 w-[60%] h-32 bg-zinc-900 -rotate-6 border-l-4 border-t-4 border-white z-0 opacity-20"></div>
    </div>
  );
}
