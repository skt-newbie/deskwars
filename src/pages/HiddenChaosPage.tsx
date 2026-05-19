import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Zap, HelpCircle, ArrowRight, CheckCircle, RefreshCcw, Package, Gift, AlertCircle, ShieldAlert, Scan, StopCircle } from 'lucide-react';
import { fetchJson } from '../lib/api';
import { Html5Qrcode } from 'html5-qrcode';

export default function HiddenChaosPage() {
  const [qrFlow, setQrFlow] = useState<{ 
    qrId: string;
    type: 'riddle' | 'mystery';
    status: 'active' | 'failed' | 'completed' | 'path_a_selection';
    riddle?: string;
    attempts?: number;
    nextClue?: string;
    points?: number;
    prize?: string;
    isCorrect?: boolean;
    isSolved?: boolean;
  } | null>(null);
  
  const [riddleInput, setRiddleInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; reward?: any } | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "chaos-scanner-region";

  useEffect(() => {
    checkUrlParams();
    return () => {
      stopScanner();
    };
  }, []);

  const checkUrlParams = async () => {
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');
    if (qrId) {
      processScannedCode(qrId);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScannerStatus('starting');
    setScanResult(null);
    setQrFlow(null);
    
    try {
      // Ensure any previous instance is cleaned up
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) await scannerRef.current.stop();
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;
      
      const config = { 
        fps: 10, 
        qrbox: (viewWidth: number, viewHeight: number) => {
          const minEdge = Math.min(viewWidth, viewHeight);
          const boxSize = Math.floor(minEdge * 0.7);
          return { width: boxSize, height: boxSize };
        }
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          stopScanner();
          processScannedCode(decodedText);
        },
        () => {
          // Failure callback is noisy, ignore
        }
      );
      setScannerStatus('running');
    } catch (err) {
      console.error("Scanner failed:", err);
      setScannerStatus('error');
      setIsScanning(false);
      // Fallback to simpler facing mode if environment fails
      try {
        if (scannerRef.current) {
           await scannerRef.current.start(
            { facingMode: "user" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              stopScanner();
              processScannedCode(decodedText);
            },
            () => {}
          );
          setIsScanning(true);
          setScannerStatus('running');
          return;
        }
      } catch (innerErr) {
        console.error("Fallback scanner failed:", innerErr);
      }
      alert("Camera access denied or unavailable. Chaos is shy.");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      console.error("Stop failed", e);
    } finally {
      setIsScanning(false);
      setScannerStatus('idle');
    }
  };

  const processScannedCode = async (qrId: string) => {
    try {
      const data = await fetchJson('/api/qr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId })
      });

      if (data.type === 'riddle') {
        setQrFlow({ qrId, ...data });
      } else {
        setScanResult(data);
      }
    } catch (err) {
      console.error("QR Process failed:", err);
    }
  };

  const submitRiddle = async () => {
    if (!qrFlow || !riddleInput || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetchJson('/api/qr/submit-riddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId: qrFlow.qrId, answer: riddleInput })
      });

      if (res.success) {
        if (res.path === 'A') {
          setQrFlow({ ...qrFlow, status: 'path_a_selection', isSolved: true });
        } else {
          setQrFlow({ 
            ...qrFlow, 
            status: 'completed', 
            isSolved: true,
            points: res.points, 
            nextClue: res.nextClue,
            prize: 'DIGITAL_POINTS'
          });
        }
      } else {
        if (res.attemptsDepleted) {
          setQrFlow({ 
            ...qrFlow, 
            status: 'failed', 
            attempts: 5, 
            points: res.points, 
            nextClue: res.nextClue 
          });
        } else {
          setQrFlow({ ...qrFlow, attempts: res.attempts, isCorrect: false });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimPrize = async (mode: 'guaranteed' | 'randomizer') => {
    if (!qrFlow || rolling) return;
    if (mode === 'randomizer') {
      setRolling(true);
      await new Promise(r => setTimeout(r, 2000));
    }

    try {
      const res = await fetchJson('/api/qr/claim-prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId: qrFlow.qrId, mode })
      });

      setQrFlow({
        ...qrFlow,
        status: 'completed',
        points: res.points,
        prize: res.prizeType,
        nextClue: res.nextClue
      });
    } catch (err) {
      console.error(err);
    } finally {
      setRolling(false);
    }
  };

  // Simulated scan for demo purposes in restricted environments
  const simulateScan = () => {
    const mockIds = ['R01', 'R15', 'MYSTERY_ALPHA_92', 'VOID_TREASURE_01', 'INVALID_SIG'];
    const randomId = mockIds[Math.floor(Math.random() * mockIds.length)];
    processScannedCode(randomId);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 overflow-y-auto font-sans selection:bg-chaos-pink selection:text-black">
      <AnimatePresence>
        {qrFlow && qrFlow.status === 'path_a_selection' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-950 border-4 border-white p-10 max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-chaos-yellow animate-pulse"></div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-chaos-yellow text-black"><Package className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-[10px] font-mono text-chaos-yellow uppercase tracking-widest">Pioneer Status Verified</h3>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Reward Selection</h2>
                </div>
              </div>

              <p className="text-zinc-400 mb-8 font-medium leading-relaxed">
                Atomic Lock Disengaged. As the First Visitor, you have a choice. Select your reward path.
              </p>

              <div className="grid grid-cols-1 gap-4 mb-10">
                <button 
                  onClick={() => claimPrize('guaranteed')}
                  disabled={rolling}
                  className="group relative p-6 border-2 border-white hover:bg-white hover:text-black transition-all flex flex-col items-start gap-2 text-left"
                >
                   <div className="flex justify-between w-full items-center">
                      <span className="font-black uppercase italic text-xl">The Safe Route</span>
                      <ShieldAlert className="w-5 h-5 text-chaos-green" />
                   </div>
                   <p className="text-[10px] uppercase font-mono opacity-60 group-hover:opacity-100">Claim the Guaranteed Physical Item (+Fixed Points)</p>
                </button>

                <button 
                  onClick={() => claimPrize('randomizer')}
                  disabled={rolling}
                  className="group relative p-6 border-2 border-chaos-pink hover:bg-chaos-pink hover:text-black transition-all flex flex-col items-start gap-2 text-left"
                >
                   <div className="flex justify-between w-full items-center">
                      <span className="font-black uppercase italic text-xl">The Chaos Gamble</span>
                      <Zap className="w-5 h-5" />
                   </div>
                   <p className="text-[10px] uppercase font-mono opacity-60 group-hover:opacity-100">Roll the Randomizer. Chance for Massive Points or Nothing.</p>
                   {rolling && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-black overflow-hidden">
                        <motion.div 
                          className="h-full bg-white"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      </div>
                   )}
                </button>
              </div>

              {rolling && <p className="text-center font-black uppercase italic text-chaos-pink animate-pulse">Rolling Temporal Dice...</p>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="mb-12">
        <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">Hidden Chaos</h1>
        <div className="flex items-center gap-2 mt-4">
           <div className="h-[1px] flex-1 bg-zinc-800"></div>
           <p className="text-chaos-pink font-mono text-[10px] uppercase tracking-[0.2em] px-2 whitespace-nowrap">Unified Scan Console</p>
           <div className="h-[1px] flex-1 bg-zinc-800"></div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {qrFlow ? (
          <motion.div 
            key="qr-flow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mx-auto"
          >
            {qrFlow.status === 'active' && (
              <div className="border-4 border-white p-10 bg-zinc-950 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-right">
                   <p className="text-[8px] font-mono text-zinc-600 uppercase">Resonance Remaining</p>
                   <div className="flex gap-1 mt-1 justify-end">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2 h-4 border border-white ${qrFlow.attempts && i < (5 - qrFlow.attempts) ? 'bg-chaos-green' : 'bg-red-900/50'}`}></div>
                      ))}
                   </div>
                </div>

                <div className="mb-12">
                   <h3 className="text-[10px] font-mono text-chaos-pink uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Scan className="w-3 h-3" /> Challenge: Riddle Interference
                   </h3>
                   <div className="p-8 border-2 border-dashed border-zinc-800 bg-zinc-900/50">
                      <p className="text-2xl font-black uppercase italic leading-tight text-white/90">"{qrFlow.riddle}"</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <input 
                      type="text"
                      placeholder="Input Deciphered Answer..."
                      value={riddleInput}
                      onChange={(e) => setRiddleInput(e.target.value)}
                      className="w-full bg-black border-2 border-white p-6 font-black uppercase italic text-xl text-center focus:border-chaos-pink outline-none transition-colors"
                    />
                    {qrFlow.isCorrect === false && (
                       <p className="text-red-500 font-mono text-[10px] uppercase mt-2 text-center animate-pulse">Incorrect Answer. Temporal Frequency Unstable.</p>
                    )}
                  </div>
                  
                  <button 
                    onClick={submitRiddle}
                    disabled={!riddleInput || isSubmitting}
                    className="w-full h-20 bg-white text-black font-black uppercase text-2xl italic hover:bg-chaos-yellow transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600"
                  >
                    {isSubmitting ? <RefreshCcw className="w-8 h-8 animate-spin" /> : <><Zap className="w-6 h-6" /> Submit Solution</>}
                  </button>
                </div>
              </div>
            )}

            {qrFlow.status === 'completed' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="border-4 border-chaos-green p-12 text-center bg-zinc-950 relative"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-chaos-green overflow-hidden flex">
                  {[...Array(20)].map((_, i) => <div key={i} className="flex-1 h-full even:bg-black/20"></div>)}
                </div>

                <CheckCircle className="w-24 h-24 text-chaos-green mx-auto mb-8" />
                <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-2">Chaos Survived</h2>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-10">Resource Allocation complete</p>

                <div className="grid grid-cols-2 gap-4 mb-12">
                   <div className="p-6 bg-zinc-900 border-2 border-zinc-800">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Points Earned</p>
                      <p className="text-3xl font-black italic text-chaos-green">+{qrFlow.points}</p>
                   </div>
                   <div className="p-6 bg-zinc-900 border-2 border-zinc-800">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Items Claimed</p>
                      <p className="text-xl font-black italic text-white uppercase truncate">{qrFlow.prize || 'NONE'}</p>
                   </div>
                </div>

                {qrFlow.nextClue && (
                  <div className="p-8 border-2 border-dashed border-chaos-yellow/30 bg-chaos-yellow/5 text-left mb-10">
                    <p className="text-[10px] font-mono text-chaos-yellow uppercase tracking-widest mb-4 flex items-center gap-2">
                       <HelpCircle className="w-3 h-3" /> Next Destination
                    </p>
                    <p className="text-xl font-bold italic text-chaos-yellow leading-tight">"{qrFlow.nextClue}"</p>
                  </div>
                )}

                <button 
                  onClick={() => { window.history.replaceState({}, '', '/hidden-chaos'); setQrFlow(null); setRiddleInput(''); }}
                  className="w-full h-16 bg-white text-black font-black uppercase italic hover:bg-chaos-green transition-all"
                >
                  Clear Resonance
                </button>
              </motion.div>
            )}

            {qrFlow.status === 'failed' && (
              <div className="border-4 border-red-500 p-12 text-center bg-zinc-950">
                 <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-8" />
                 <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4">Riddle Failure</h2>
                 <p className="text-zinc-400 mb-10 leading-relaxed uppercase font-bold text-sm">Frequency too distorted. Consolation points only.</p>
                 
                 <div className="bg-red-500 text-white p-4 font-black uppercase italic text-xl mb-10 rotate-1">
                   Consolation: +10 Points
                 </div>

                 {qrFlow.nextClue && (
                    <div className="p-8 border-2 border-dashed border-zinc-800 bg-zinc-900 text-left mb-10">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">System Bypass Clue</p>
                      <p className="italic text-zinc-400">"{qrFlow.nextClue}"</p>
                    </div>
                 )}

                 <button 
                  onClick={() => { window.history.replaceState({}, '', '/hidden-chaos'); setQrFlow(null); setRiddleInput(''); }}
                  className="w-full h-16 bg-white text-black font-black uppercase italic hover:bg-red-500 transition-all"
                >
                  Realign & Return
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col items-center">
             <div className="w-full bg-zinc-900/50 border-2 border-zinc-800 p-6 mb-8 text-center">
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 italic">
                  Search for Chaos Nodes (QR Codes) and scan to reveal rewards or challenges.
                </p>
             </div>

             <div className="relative w-full aspect-square max-w-sm border-4 border-white bg-black overflow-hidden mb-12 flex items-center justify-center group shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <div id={scannerId} className="absolute inset-0 z-0 overflow-hidden"></div>
                
                {isScanning && scannerStatus === 'starting' && (
                  <div className="z-10 absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
                     <RefreshCcw className="w-12 h-12 text-chaos-pink animate-spin mb-4" />
                     <p className="font-black uppercase italic text-xs">Calibrating Optics...</p>
                  </div>
                )}

                {!isScanning && !scanResult && (
                   <div className="z-10 text-center p-8 bg-zinc-950/80 backdrop-blur-sm border-2 border-zinc-800">
                      <Scan className="w-16 h-16 text-white/20 mx-auto mb-4 group-hover:text-chaos-pink transition-colors" />
                      <p className="font-black uppercase italic text-xl mb-2">Camera Offline</p>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Input stream required for decryption</p>
                   </div>
                )}

                {scanResult && !isScanning && (
                   <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center"
                   >
                      <div className="w-16 h-16 bg-chaos-green text-black flex items-center justify-center mb-6 rounded-full">
                         <Gift className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Mystery Claimed</h3>
                      <p className="text-sm text-zinc-400 mb-8 leading-relaxed">{scanResult.message}</p>
                      <button 
                        onClick={() => setScanResult(null)}
                        className="w-full h-12 border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-black transition-all"
                      >
                        Rescan Terminal
                      </button>
                   </motion.div>
                )}

                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
             </div>

             <div className="flex flex-col gap-4 w-full max-w-sm">
                {!isScanning ? (
                  <button 
                    onClick={startScanner}
                    className="w-full h-20 bg-white text-black font-black uppercase text-2xl italic hover:bg-chaos-pink transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                    <Camera className="w-8 h-8" /> <span>Initiate Scan</span>
                  </button>
                ) : (
                  <button 
                    onClick={stopScanner}
                    className="w-full h-20 bg-red-600 text-white font-black uppercase text-2xl italic hover:bg-red-700 transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                    <StopCircle className="w-8 h-8" /> <span>Abort Scan</span>
                  </button>
                )}

                <div className="flex items-center gap-4 mt-6">
                   <div className="h-[1px] flex-1 bg-zinc-900"></div>
                   <p className="text-[8px] font-mono text-zinc-700 uppercase">Internal Simulation</p>
                   <div className="h-[1px] flex-1 bg-zinc-900"></div>
                </div>

                <button 
                  onClick={simulateScan}
                  className="w-full h-12 border border-zinc-800 text-zinc-600 font-black uppercase text-[10px] italic hover:text-zinc-400 hover:border-zinc-600 transition-all"
                >
                  Simulate Random Node Capture
                </button>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

