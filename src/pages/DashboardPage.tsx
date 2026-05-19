import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Trophy, Sparkles, AlertTriangle, Coffee, Timer } from 'lucide-react';
import { User, Submission } from '../types';
import { fetchJson } from '../lib/api';

interface DashboardPageProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export default function DashboardPage({ user, onNavigate }: DashboardPageProps) {
  const [feed, setFeed] = useState<Submission[]>([]);

  useEffect(() => {
    fetchJson('/api/feed')
      .then(setFeed)
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          console.error(err);
        }
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 pt-12 pb-32 space-y-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-4 border-chaos-pink pb-8">
        <div>
          <h2 className="text-5xl font-display text-chaos-blue italic tracking-tighter uppercase">
            AGENT: {user.email}
          </h2>
          <p className="text-chaos-green font-mono text-sm tracking-widest mt-2">
            CURRENT CHAOS SCORE: {user.total_points} // RANK: CORPORATE NOMAD
          </p>
        </div>
        <div className="flex gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-chaos-orange p-3 border-2 border-white arcade-shadow"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-black font-black text-xs uppercase">Daily Bonus Available</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ y: -5, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('upload')}
              className="bg-chaos-green p-8 border-4 border-white arcade-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 bg-black text-white text-[8px] font-bold">LIVE COMPETITION</div>
              <Camera className="w-16 h-16 text-black mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-3xl font-display text-black text-left">JUDGE MY DESK</h3>
              <p className="text-black/70 text-xs font-mono text-left mt-2 italic font-bold">
                UPLOAD PICTURE // GET ROASTED // GAIN GLORY
              </p>
            </motion.button>

            <div className="bg-zinc-800/50 p-8 border-4 border-dashed border-gray-600 arcade-shadow relative opacity-60">
              <Timer className="w-16 h-16 text-gray-500 mb-4" />
              <h3 className="text-3xl font-display text-gray-500 text-left">QR MYSTERY HUB</h3>
              <p className="text-gray-600 text-xs font-mono text-left mt-2 italic font-bold">
                COMING SOON // SCAN THE CHAOS // WIN PRIZES
              </p>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 <span className="bg-chaos-pink px-4 py-1 text-black font-bold text-sm transform -rotate-12">LOCKED</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-display text-chaos-yellow italic tracking-tighter uppercase flex items-center gap-2">
               <AlertTriangle className="w-5 h-5" /> RECENT CASUALTIES
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.map((s, i) => (
                <motion.div 
                   key={s.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="bg-zinc-900 border-2 border-chaos-pink/30 p-3 flex gap-4 hover:border-chaos-pink transition-colors"
                >
                  <img src={s.image_path} alt="Submission" className="w-20 h-20 object-cover border border-white/20" />
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-chaos-pink font-bold text-xs truncate">@{s.username}</p>
                    <p className="text-white font-mono text-[10px] leading-tight line-clamp-2 mt-1 italic">"{s.ai_comment}"</p>
                    <div className="flex items-center gap-1 mt-2">
                       <Coffee className="w-3 h-3 text-chaos-green" />
                       <span className="text-[10px] text-chaos-green font-bold">{s.overall_score}/100 POINTS</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mini Leaderboard / Tips */}
        <div className="space-y-8">
          <div className="bg-chaos-blue p-6 border-4 border-white arcade-shadow">
            <h4 className="text-2xl font-display text-black mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6" /> HALL OF CHAOS
            </h4>
            <div className="space-y-3">
              {feed.slice(0, 5).map((_s, i) => (
                <div key={i} className="flex justify-between items-center border-b border-black/10 pb-1">
                  <span className="font-mono text-xs font-bold text-black/80">{i+1}. SPREADSHEETSAGE</span>
                  <span className="font-mono text-xs font-bold text-black">42,000 pts</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => onNavigate('leaderboard')}
              className="w-full mt-6 py-2 bg-black text-white font-bold text-xs hover:bg-zinc-800 transition-colors uppercase italic"
            >
              See All Legends
            </button>
          </div>

          <div className="bg-zinc-900 p-6 border-2 border-chaos-yellow/50 arcade-shadow relative overflow-hidden group">
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-chaos-yellow/10 rounded-full blur-2xl transition-transform group-hover:scale-150" />
            <h4 className="text-lg font-display text-chaos-yellow mb-2 uppercase">PRO TIP #42</h4>
            <p className="text-xs font-mono text-gray-400 leading-relaxed italic">
              "Judges LOVE empty energy drink cans. A tower of 5 or more adds 15% to your Effort Score."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
