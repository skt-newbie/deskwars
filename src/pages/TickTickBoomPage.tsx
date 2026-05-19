import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Zap, AlertTriangle, RefreshCcw, ShieldAlert } from 'lucide-react';
import { fetchJson } from '../lib/api';

export default function TickTickBoomPage() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'success' | 'failure' | 'depleted'>('idle');
  const [targetTime, setTargetTime] = useState<number>(5.00); 
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [resultData, setResultData] = useState<{ points: number; delta: number; result: string } | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await fetchJson('/api/games/tick-tick-boom/status');
      setAttempts(data.attempts);
      setIsEnabled(data.isEnabled);
      if (data.attempts >= 3) setGameState('depleted');
    } catch (err) {
      console.error(err);
    }
  };

  const startGame = () => {
    if (attempts >= 3) return;
    
    // Random target between 4.00 and 8.00 seconds
    const target = parseFloat((Math.random() * 4 + 4).toFixed(2));
    setTargetTime(target);
    setCurrentTime(0);
    setGameState('running');
    startTimeRef.current = performance.now();
    
    timerRef.current = window.setInterval(() => {
      setCurrentTime((performance.now() - startTimeRef.current) / 1000);
    }, 10);
  };

  const stopGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const stopTime = (performance.now() - startTimeRef.current) / 1000;
    
    try {
      const res = await fetchJson('/api/games/tick-tick-boom/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTime, stopTime })
      });
      
      setResultData({ points: res.points, delta: res.delta, result: res.result });
      setAttempts(3 - res.attemptsLeft);
      
      if (res.result === 'BOOM') {
        setGameState('failure');
      } else {
        setGameState('success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-20 h-20 text-chaos-pink mb-6 animate-pulse" />
        <h1 className="text-4xl font-black uppercase italic italic mb-4">Zone Stabilizing...</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest max-w-xs">The temporal field is currently unstable. Our Chaos Architects are recalibrating the flux.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 flex flex-col overflow-hidden relative">
      <header className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Tick Tick Boom</h1>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-2 px-1">Zone 03: Invisible Temporal Sync</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-zinc-600 uppercase">Stability Attempts</p>
          <div className="flex gap-1 justify-end mt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 border border-white ${i < attempts ? 'bg-chaos-pink shadow-[0_0_10px_rgba(255,0,255,0.5)]' : 'bg-transparent'}`}></div>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center"
            >
              <div className="mb-12 relative">
                <div className="w-64 h-64 border-2 border-dashed border-zinc-800 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Timer className="w-24 h-24 text-zinc-700" />
                </div>
              </div>
              <h3 className="text-3xl font-black uppercase mb-4 italic tracking-tighter">Enter the Blind Zone</h3>
              <p className="text-zinc-500 text-sm max-w-xs mb-10 leading-snug">The clock vanishes after 2.00 seconds. Rely on your pulse. Stop exactly at the target.</p>
              <button 
                onClick={startGame}
                className="w-56 h-20 bg-white text-black font-black uppercase text-2xl italic hover:bg-chaos-green hover:shadow-[0_0_30px_rgba(0,255,0,0.4)] transition-all active:scale-95"
              >
                Ignite Fuse
              </button>
            </motion.div>
          )}

          {gameState === 'running' && (
            <motion.div 
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-center"
            >
              <div className="mb-8">
                 <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] mb-2">Target Syncing at:</p>
                 <div className="text-4xl font-black text-chaos-pink italic tracking-tighter tabular-nums underline decoration-2 underline-offset-8">
                   {targetTime.toFixed(2)}s
                 </div>
              </div>

              <div className="relative h-48 flex items-center justify-center">
                 {currentTime <= 2.05 ? (
                   <div className="text-[20vw] font-black italic tabular-nums leading-none tracking-tighter">
                     {currentTime.toFixed(2)}
                   </div>
                 ) : (
                   <div className="text-zinc-900 text-[10vw] font-black uppercase tracking-widest animate-pulse italic">
                     [ INVISIBLE ]
                   </div>
                 )}
              </div>
              
              <button 
                onClick={stopGame}
                className="w-full max-w-sm h-40 bg-chaos-pink text-black font-black uppercase text-6xl italic hover:bg-white hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all active:scale-90 relative mt-12"
              >
                STOP!!
                <div className="absolute -inset-4 border-2 border-chaos-pink animate-ping pointer-events-none opacity-20"></div>
              </button>
            </motion.div>
          )}

          {gameState === 'success' && resultData && (
            <motion.div 
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-12 border-4 border-white bg-zinc-950 max-w-md w-full relative"
            >
              <Zap className="w-20 h-20 text-chaos-green mx-auto mb-6 fill-current shadow-[0_0_30px_rgba(0,255,0,0.5)]" />
              <h2 className="text-5xl font-black uppercase italic mb-2 tracking-tighter">
                {resultData.result === 'PERFECT' ? 'PURE GODHOOD' : 'SYNC ACHIEVED'}
              </h2>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-8">Precision Delta: {resultData.delta.toFixed(3)}s</div>
              
              <div className="space-y-4 mb-12">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">Target Time</span>
                  <span className="font-black italic text-xl">{targetTime.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">Your Impulse</span>
                  <span className="font-black italic text-xl text-chaos-green">{(targetTime + (resultData.result === 'CLOSE' ? resultData.delta : 0)).toFixed(2)}s</span>
                </div>
              </div>

              <div className="bg-chaos-green text-black px-6 py-4 font-black text-3xl uppercase mb-10 rotate-1 shadow-[0_0_40px_rgba(0,255,0,0.3)]">
                +{resultData.points} Points Unlocked
              </div>

              {attempts < 3 ? (
                 <button 
                  onClick={() => setGameState('idle')}
                  className="w-full h-16 bg-white text-black font-black uppercase text-xl flex items-center justify-center gap-3 hover:bg-chaos-green transition-all"
                >
                  <RefreshCcw className="w-5 h-5" /> Push Luck
                </button>
              ) : (
                <p className="text-zinc-600 font-mono text-[10px] uppercase">Attempts Depleted. Reality Stabilized.</p>
              )}
            </motion.div>
          )}

          {gameState === 'failure' && resultData && (
            <motion.div 
              key="failure"
              initial={{ rotate: 10, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              className="text-center p-12 border-4 border-red-500 bg-red-950/20 backdrop-blur-xl max-w-md w-full"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.2, repeat: 3 }}
              >
                <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-6xl font-black uppercase italic mb-4 tracking-tighter">BOOOOOM!!</h2>
              <p className="text-red-500/80 mb-8 max-w-xs mx-auto uppercase font-bold text-xs tracking-widest italic">Atomic desynchronization. You missed the window by {resultData.delta.toFixed(2)}s.</p>
              
              <div className="bg-red-500 text-white px-6 py-3 font-black text-xl uppercase mb-10 -rotate-2">
                Consolation: +10 Points
              </div>

              {attempts < 3 ? (
                <button 
                  onClick={() => setGameState('idle')}
                  className="w-full h-16 bg-white text-black font-black uppercase text-xl flex items-center justify-center gap-3 hover:bg-red-500 transition-all"
                >
                  <RefreshCcw className="w-5 h-5" /> Reassemble Atoms
                </button>
              ) : (
                <p className="text-zinc-600 font-mono text-[10px] uppercase">Critical Core Failure. No attempts left.</p>
              )}
            </motion.div>
          )}

          {gameState === 'depleted' && (
            <div className="text-center">
               <Timer className="w-20 h-20 text-zinc-800 mx-auto mb-6" />
               <h3 className="text-4xl font-black uppercase italic mb-2 tracking-tighter text-zinc-600">Sync Locked</h3>
               <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-10">You have used all 3 attempts for this session.</p>
               <div className="p-4 border-2 border-zinc-800 text-zinc-600 font-black uppercase italic">Atomic Stability Achieved</div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Tilted Marquee Background */}
      <div className="absolute top-1/2 left-0 w-[200%] h-32 bg-zinc-900 -rotate-12 -translate-x-1/4 -z-10 opacity-40 flex items-center overflow-hidden border-y-2 border-zinc-800">
         <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-zinc-800 font-black text-8xl uppercase mx-10">TICK TICK BOOM // SYNC THE VOID // </span>
            ))}
         </div>
      </div>
    </div>
  );
}
