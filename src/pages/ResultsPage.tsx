import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Share2, RotateCcw, Award, Sparkles, TrendingUp } from 'lucide-react';
import { Submission } from '../types';
import { fetchJson } from '../lib/api';

interface ResultsPageProps {
  submissionId: string;
  onRestart: () => void;
}

export default function ResultsPage({ submissionId, onRestart }: ResultsPageProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchJson(`/api/submissions/${submissionId}`)
      .then(setSubmission)
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          console.error(err);
        }
      });
  }, [submissionId]);

  if (!submission) return null;

  // Support both camelCase (Prisma) and snake_case (legacy) field names
  const imagePath = submission.imagePath || submission.image_path;
  const aiComment = submission.aiComment || submission.ai_comment;
  const categoriesJson = submission.categoriesJson || submission.categories_json;
  const overallScore = submission.overallScore || submission.overall_score;
  
  const categories = categoriesJson ? JSON.parse(categoriesJson) : {};

  return (
    <div className="max-w-4xl mx-auto p-4 pt-12 pb-32 space-y-12">
      <div className="text-center space-y-4">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="inline-block"
        >
          <div className="bg-chaos-yellow text-black px-6 py-2 border-4 border-white arcade-shadow transform -rotate-2">
            <h2 className="text-4xl font-display uppercase italic tracking-tighter">THE VERDICT IS IN</h2>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left: Image and Score */}
        <div className="space-y-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 z-10 bg-chaos-pink p-4 border-2 border-white arcade-shadow rounded-full">
               <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="border-8 border-white arcade-shadow overflow-hidden transform rotate-1">
              <img src={imagePath} alt="Submission" className="w-full h-auto grayscale-0 hover:grayscale transition-all duration-500" />
            </div>
          </motion.div>

          <div className="bg-black/40 border-l-4 border-chaos-green p-6 space-y-1">
            <p className="text-xs font-mono text-chaos-green font-bold tracking-widest uppercase">JUDGE'S REMARK:</p>
            <p className="text-3xl font-display text-white italic tracking-tight leading-none">
              "{aiComment || "Analysis inconclusive. Try adding more coffee."}"
            </p>
          </div>
        </div>

        {/* Right: Detailed Breakdown */}
        <div className="space-y-8">
           <div className="relative group">
              <div className="absolute inset-0 bg-chaos-blue/20 blur-xl group-hover:bg-chaos-pink/20 transition-colors" />
              <div className="relative bg-zinc-900 border-4 border-white p-8 arcade-shadow">
                <div className="flex justify-between items-end mb-6">
                   <h3 className="text-xl font-display text-chaos-blue uppercase">CHAOS SCORE</h3>
                   <span className="text-7xl font-display text-white italic leading-none">{overallScore}</span>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(categories).map(([key, val]: [string, any], i) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">
                         <span>{key}</span>
                         <span>{val}%</span>
                      </div>
                      <div className="h-3 bg-zinc-800 border border-white/10 rounded-sm overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "circOut" }}
                          className={`h-full ${i % 2 === 0 ? 'bg-chaos-pink' : 'bg-chaos-green'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 p-4 border border-white/10 flex items-center gap-3">
                 <Award className="w-6 h-6 text-chaos-yellow" />
                 <div>
                    <p className="text-[8px] font-mono text-gray-500 uppercase">ACHIEVEMENT</p>
                    <p className="text-[10px] font-bold text-white uppercase">SITTING PRO</p>
                 </div>
              </div>
              <div className="bg-zinc-800 p-4 border border-white/10 flex items-center gap-3">
                 <TrendingUp className="w-6 h-6 text-chaos-blue" />
                 <div>
                    <p className="text-[8px] font-mono text-gray-500 uppercase">RANK DELTA</p>
                    <p className="text-[10px] font-bold text-white uppercase">+12 POSITIONS</p>
                 </div>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={onRestart}
                className="flex-1 py-4 bg-chaos-orange text-black font-black text-xl italic hover:bg-chaos-yellow transition-colors arcade-shadow border-2 border-white flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> RE-BATTLE
              </button>
              <button 
                className="px-6 py-4 bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-colors arcade-shadow"
              >
                <Share2 className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
          <motion.div 
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.1, repeat: Infinity }}
            className="w-full h-full bg-chaos-pink/5 mix-blend-overlay"
          />
      </div>
    </div>
  );
}
