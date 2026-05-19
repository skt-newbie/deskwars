import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, Hash, Crown } from 'lucide-react';
import { fetchJson } from '../lib/api';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [category, setCategory] = useState<'total' | 'desk' | 'drawing'>('total');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJson(`/api/leaderboard?category=${category}`)
      .then(data => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          console.error(err);
        }
        setLoading(false);
      });
  }, [category]);

  return (
    <div className="max-w-4xl mx-auto p-4 pt-12 pb-32 space-y-8">
      <div className="text-center">
        <h2 className="text-7xl font-display text-chaos-pink italic uppercase tracking-tighter transform -rotate-1">
          HALL OF CHAOS
        </h2>
        <p className="font-mono text-xs text-zinc-500 tracking-widest mt-4">
          // WHERE LEGENDS ASCEND AND LOGIC DIES //
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-2 border-white overflow-hidden bg-zinc-900 mx-auto max-w-2xl">
        <button
          onClick={() => setCategory('total')}
          className={`flex-1 py-3 px-4 font-black uppercase text-xs tracking-widest transition-colors ${category === 'total' ? 'bg-white text-black' : 'text-white hover:bg-zinc-800'}`}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => setCategory('desk')}
          className={`flex-1 py-3 px-4 font-black uppercase text-xs tracking-widest transition-colors ${category === 'desk' ? 'bg-white text-black' : 'text-white hover:bg-zinc-800'}`}
        >
          🖥️ Desk Wars
        </button>
        <button
          onClick={() => setCategory('drawing')}
          className={`flex-1 py-3 px-4 font-black uppercase text-xs tracking-widest transition-colors ${category === 'drawing' ? 'bg-white text-black' : 'text-white hover:bg-zinc-800'}`}
        >
          🎨 Finish Madness
        </button>
      </div>

      <div className="bg-zinc-950 border-4 border-white p-8 relative">
        <div className="absolute top-0 right-0 p-3 bg-white text-black font-mono text-[10px] font-black uppercase">
          {category === 'total' ? '🏆 OVERALL CHAMPIONS' : category === 'desk' ? '🖥️ DESK CHAMPIONS' : '🎨 ART MASTERS'}
        </div>

        <div className="space-y-4 pt-4 min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-full pt-20">
                <div className="w-12 h-12 border-4 border-chaos-pink border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : leaders.length > 0 ? (
            leaders.map((u, i) => (
              <motion.div
                key={`${u.username}-${i}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-6 p-4 border-2 transition-all ${
                  i === 0 ? 'bg-chaos-green/10 border-chaos-green scale-105' : 
                  i === 1 ? 'bg-zinc-900 border-zinc-500' :
                  i === 2 ? 'bg-zinc-900 border-zinc-700' :
                  'bg-black/40 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="w-12 text-center">
                  {i === 0 ? <Crown className="w-8 h-8 text-chaos-green mx-auto" /> :
                   i === 1 ? <Medal className="w-7 h-7 text-gray-300 mx-auto" /> :
                   i === 2 ? <Medal className="w-6 h-6 text-zinc-600 mx-auto" /> :
                   <span className="font-display text-2xl text-zinc-800 italic">#{i + 1}</span>}
                </div>
  
                <div className="flex-1">
                  <h3 className={`text-2xl font-black uppercase tracking-tighter break-all ${
                    i === 0 ? 'text-chaos-green' : 'text-white'
                  }`}>
                    {u.display_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                      {u.username && u.username !== u.display_name && (
                         <span className="text-chaos-pink mr-2">// ALIAS: {u.username}</span>
                      )}
                      {category === 'total' ? 'COMBINED SCORE' : category === 'desk' ? 'DESK WARS' : 'DRAWING COMP'} // STATUS: {i < 3 ? 'LEGENDARY' : 'ACTIVE'}
                    </p>
                    {u.last_activity && (
                      <span className="text-[8px] font-mono text-chaos-pink/60 uppercase">
                        // LAST ACTIVE: {new Date(u.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
  
                <div className="text-right">
                  <span className={`text-3xl font-black italic tabular-nums ${
                    i === 0 ? 'text-chaos-green' : 'text-white'
                  }`}>
                    {u.score?.toLocaleString() || 0}
                  </span>
                  <p className="text-[8px] font-mono text-zinc-500 uppercase">CARNIVAL POINTS</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
               <Star className="w-12 h-12 text-zinc-800 mx-auto animate-spin-slow" />
               <p className="font-mono text-zinc-600 uppercase text-xs">Waiting for legends to emerge...</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-black border-2 border-dashed border-chaos-pink/30 p-8 flex flex-col md:flex-row items-center gap-8">
         <div className="w-24 h-24 bg-chaos-pink/10 rounded-full flex items-center justify-center shrink-0">
            <Trophy className="w-12 h-12 text-chaos-pink" />
         </div>
         <div className="space-y-2">
            <h4 className="text-xl font-display text-chaos-pink uppercase italic">MONTHLY CHAOS REWARD</h4>
            <p className="text-xs font-mono text-gray-400 leading-relaxed italic">
              "The top 3 legends at the end of the month will receive the legendary **GOLDEN COFFEE MUG** and immunity from HR roasts for 7 days."
            </p>
         </div>
         <button className="whitespace-nowrap px-8 py-3 bg-chaos-pink text-black font-bold arcade-shadow border border-white hover:bg-chaos-green transition-colors italic">
            CLAIM PRE-ORDER
         </button>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
