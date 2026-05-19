import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Camera, Timer, Trophy, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { fetchJson } from '../lib/api';

interface Props {
  user: User;
  onNavigate: (page: string) => void;
}

const ZONES = [
  {
    id: 'roast-arena',
    title: 'AI Roast Arena',
    description: 'Face the AI critics in drawing and desk wars.',
    icon: Camera,
    color: 'bg-chaos-pink',
    path: 'roast-arena'
  },
  {
    id: 'hidden-chaos',
    title: 'Hidden Chaos',
    description: 'Hunt for secrets and mystery rewards via QR prompts.',
    icon: Zap,
    color: 'bg-chaos-yellow',
    path: 'hidden-chaos'
  },
  {
    id: 'tick-tick-boom',
    title: 'Tick Tick Boom',
    description: 'A test of reflexes and temporal precision.',
    icon: Timer,
    color: 'bg-chaos-green',
    path: 'tick-tick-boom'
  },
  {
    id: 'leaderboards',
    title: 'The Hall of Chaos',
    description: 'Compare your points with other chaos survivors.',
    icon: Trophy,
    color: 'bg-zinc-800',
    path: 'leaderboard'
  }
];

export default function SelectionMatrixPage({ user, onNavigate }: Props) {
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    fetchJson('/api/games/configs').then(setConfigs).catch(console.error);
  }, []);

  const isEnabled = (gameId: string) => {
    if (gameId === 'leaderboards') return true;
    const cfg = configs.find(c => c.game_id === gameId);
    // Explicitly check for 0 to ensure disabled state is respected
    return cfg ? cfg.is_enabled === 1 : true; 
  };

  const isAdmin = user.is_admin === 1 || user.email === 'sanjayt9845524530@gmail.com';
  
  // Filter zones: non-admins only see enabled zones
  const visibleZones = ZONES.filter(zone => isAdmin || isEnabled(zone.id));

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 overflow-y-auto">
      <header className="mb-12 pt-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-between items-end"
        >
          <div>
            <h2 className="text-[12px] font-mono text-chaos-pink uppercase tracking-[0.4em] mb-2">Authenticated: {user.email}</h2>
            <h1 className="text-6xl font-black uppercase tracking-tighter italic">Selection Matrix</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Global Points</p>
            <p className="text-4xl font-black text-chaos-green tabular-nums">{user.total_points}</p>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleZones.map((zone, idx) => {
          const enabled = isEnabled(zone.id);
          return (
            <motion.button
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => (enabled || isAdmin) && onNavigate(zone.path)}
              className={`group relative h-64 border-2 transition-all overflow-hidden text-left ${(enabled || isAdmin) ? 'border-white hover:border-transparent' : 'border-zinc-900 grayscale opacity-40 cursor-not-allowed'}`}
            >
              {/* Admin Badge */}
              {isAdmin && !enabled && (
                <div className="absolute top-0 right-0 p-2 bg-red-600 text-white text-[8px] font-bold z-20 uppercase">Disabled (Admin View)</div>
              )}

              {/* Background Hover Effect */}
              {(enabled || isAdmin) && <div className={`absolute inset-0 ${zone.color} translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0`}></div>}
              
              <div className={`relative z-10 p-8 h-full flex flex-col justify-between ${(enabled || isAdmin) ? 'group-hover:text-black' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className={`p-4 border-2 ${enabled ? 'border-white group-hover:border-black' : 'border-zinc-800'} ${zone.id === 'roast-arena' ? 'rounded-full' : ''}`}>
                    {enabled ? <zone.icon className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8 text-zinc-700" />}
                  </div>
                  {enabled && <ArrowUpRight className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                
                <div>
                  <p className="text-[10px] font-mono uppercase mb-1 opacity-60 group-hover:opacity-100 italic">Zone 0{idx + 1}</p>
                  <h3 className="text-3xl font-black uppercase mb-2 tracking-tighter leading-none">
                    {enabled ? zone.title : 'Stabilizing Chaos...'}
                  </h3>
                  <p className="text-sm font-medium opacity-70 group-hover:opacity-100 max-w-[250px] leading-tight">
                    {enabled ? zone.description : 'Temporal core recalibration in progress. Reality is currently thin in this sector.'}
                  </p>
                </div>
              </div>

              {/* Brutalist corner numbers */}
              <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center opacity-10 group-hover:opacity-20 text-4xl font-black">
                {idx + 1}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Tilted Marquee */}
      <div className="fixed bottom-20 -left-10 w-[120%] rotate-2 h-10 bg-chaos-pink flex items-center overflow-hidden pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(20)].map((_, i) => (
            <span key={i} className="mx-4 text-black font-black text-sm uppercase">CHAOS CARNIVAL 2026 // EMBRACE THE VOID // NO REFUNDS // </span>
          ))}
        </div>
      </div>
    </div>
  );
}
