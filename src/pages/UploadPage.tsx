import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { fetchJson } from '../lib/api';
import { AIResult } from '../types';
import SingleChanceModal from '../components/SingleChanceModal';

interface UploadPageProps {
  onSuccess: (submissionId: string) => void;
  aiType?: string;
}

const LOADING_MESSAGES = [
  "Analyzing caffeine density...",
  "Estimating trauma levels...",
  "Scanning for productivity illusions...",
  "Calculating corporate survival rate...",
  "Detecting unauthorized fun...",
  "Measuring mouse-click aggression...",
  "Analyzing ergonomic crimes..."
];

export default function UploadPage({ onSuccess, aiType = 'desk' }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const msgIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCounts = async () => {
    try {
      const counts = await fetchJson('/api/submissions/counts');
      const count = aiType === 'drawing' ? (counts.drawing || 0) : (counts.desk || 0);
      setSubmissionCount(count);
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        console.error("Failed to fetch counts", err);
      }
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [aiType]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError("File too large (Max 5MB)");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
      fetchCounts();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
      fetchCounts();
    }
  };

  const startAnalysis = async () => {
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    setIsUploading(true);
    setError(null);

    // Rotate loading messages
    msgIntervalRef.current = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 2500);

    try {
      // 1. Upload to Backend
      const formData = new FormData();
      formData.append('image', file);
      formData.append('aiType', aiType);
      
      const storedUserId = localStorage.getItem('dw_userId');
      const headers: Record<string, string> = {};
      if (storedUserId) headers['x-user-id'] = storedUserId;

      const { id: submissionId } = await fetchJson('/api/upload', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      // 3. Poll for results (Server handles AI analysis via queue)
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s * 60)
      
      const pollResults = async () => {
        try {
          const submission = await fetchJson(`/api/submissions/${submissionId}`);
          
          // Check both camelCase (Prisma) and snake_case (legacy) field names
          const status = submission.processingStatus || submission.processing_status;
          const aiComment = submission.aiComment || submission.ai_comment;
          
          if (status === 'completed') {
            if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            onSuccess(submissionId);
            return true;
          }
          
          if (status === 'failed') {
            if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsSubmitting(false);
            setIsUploading(false);
            throw new Error(aiComment || "AI analysis failed. The judge was confused.");
          }

          if (status === 'queued') {
            setLoadingMsg("The AI judging panel is currently busy reviewing other desks. You are in the queue—please wait a few seconds, sorry for the inconvenience!");
          } else if (status === 'processing') {
            setLoadingMsg("The judge is now looking at your desk... don't blink!");
          }

          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error("Analysis timed out. The queue is quite long right now!");
          }
          
          return false;
        } catch (err) {
          throw err;
        }
      };

      // Initial delay before first poll
      await new Promise(r => setTimeout(r, 2000));

      pollIntervalRef.current = setInterval(async () => {
        try {
          const finished = await pollResults();
          if (finished) {
            setIsSubmitting(false);
          }
        } catch (err: any) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
          setIsUploading(false);
          setIsSubmitting(false);
          setError(err.message);
        }
      }, 5000);

    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        console.error(err);
        setError(err.message || "The AI was distracted by a passing moth. Try again.");
      }
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmission = () => {
    setIsModalOpen(false);
    startAnalysis();
  };

  const submissionMode = submissionCount === 0 ? 'trial' : 'final';

  return (
    <div className="max-w-2xl mx-auto p-4 pt-12 pb-32">
       <SingleChanceModal 
         isOpen={isModalOpen} 
         onConfirm={handleConfirmSubmission} 
         onCancel={() => setIsModalOpen(false)}
         title={aiType === 'drawing' ? "Canvas Locking" : "Desk Lockdown"}
         mode={submissionMode}
       />

       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="space-y-8"
       >
          <div className="text-center">
            <h2 className="text-5xl font-display text-chaos-pink italic uppercase leading-none">
              SUBMIT FOR<br />EVALUATION
            </h2>
            <div className="flex flex-col items-center gap-2 mt-4">
               <p className="font-mono text-xs text-gray-500 tracking-widest uppercase">
                 // WARNING: IMAGE QUALITY MAY AFFECT YOUR SURVIVAL //
               </p>
               {submissionCount < 2 ? (
                  <div className={`px-4 py-1 border-2 border-dashed ${submissionMode === 'trial' ? 'border-chaos-blue text-chaos-blue' : 'border-chaos-pink text-chaos-pink'} text-[10px] font-black uppercase italic`}>
                    Status: {submissionMode === 'trial' ? 'Trial Run Available' : 'Final Submission Remaining'}
                  </div>
               ) : (
                  <div className="px-4 py-1 border-2 border-red-500 text-red-500 text-[10px] font-black uppercase italic animate-pulse">
                    Status: Attempts Depleted
                  </div>
               )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group border-4 border-dashed border-chaos-blue/30 bg-zinc-900/50 aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-chaos-blue hover:bg-chaos-blue/5 transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
                <Upload className="w-16 h-16 text-chaos-blue mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-display text-xl text-chaos-blue group-hover:glitch-text uppercase">DEPLOY IMAGE</p>
                <p className="font-mono text-[10px] text-gray-500 mt-2">DRAG N' DROP OR CLICK TO CHOOSE</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative space-y-4"
              >
                <div className="relative border-4 border-white arcade-shadow aspect-video overflow-hidden group">
                  <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 p-2 bg-black/80 text-white hover:bg-chaos-pink transition-colors border border-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                      <Loader2 className="w-12 h-12 text-chaos-green animate-spin mb-4" />
                      <p className="text-xl font-display text-chaos-green uppercase tracking-tighter">
                        {loadingMsg}
                      </p>
                      <div className="w-full max-w-xs h-2 bg-zinc-800 rounded-full mt-6 overflow-hidden border border-white/20">
                         <motion.div 
                           className="h-full bg-chaos-green"
                           animate={{ width: ["0%", "100%"] }}
                           transition={{ duration: 15, repeat: Infinity }}
                         />
                      </div>
                    </div>
                  )}
                </div>

                {!isUploading && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isUploading}
                    className="w-full py-4 bg-chaos-green text-black font-black text-2xl italic hover:bg-white transition-all arcade-shadow border-4 border-white flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Zap className="w-6 h-6" /> START AI JUDGING
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-red-900/40 border-2 border-red-500 p-4 flex gap-3 items-center text-red-100"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-mono font-bold uppercase">{error}</p>
            </motion.div>
          )}

          <div className="bg-zinc-900 border-2 border-white/10 p-4">
             <div className="flex items-center gap-2 mb-2">
                 <Zap className="w-4 h-4 text-chaos-blue" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">JUDGING CRITERIA</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[8px] font-mono font-bold text-gray-500">
                <span className="p-1 bg-white/5 border border-white/10 text-center">CREATIVITY</span>
                <span className="p-1 bg-white/5 border border-white/10 text-center">CLEANLINESS</span>
                <span className="p-1 bg-white/5 border border-white/10 text-center">HUMOR</span>
                <span className="p-1 bg-white/5 border border-white/10 text-center">THEME</span>
                <span className="p-1 bg-white/5 border border-white/10 text-center">EFFORT</span>
             </div>
          </div>
       </motion.div>
    </div>
  );
}
