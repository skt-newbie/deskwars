import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, User, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: (email: string) => Promise<void>;
}

export default function IdentityVerificationPage({ onComplete }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Gateway email is required to enter chaos.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid gateway email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(email);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Reality is unstable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Brutalist accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-chaos-pink shadow-[0_0_15px_rgba(255,0,255,0.5)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-1 bg-chaos-green shadow-[0_0_15px_rgba(0,255,0,0.5)]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border-2 border-white p-8 relative z-10"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Identify Your Chaos</h1>
          <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Entry to the carnival requires verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">IBM ID (Email)</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-chaos-green transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@ibm.com"
                className="w-full bg-black border-2 border-zinc-800 p-4 pl-12 text-white placeholder:text-zinc-700 focus:border-chaos-green outline-none transition-all font-mono"
              />
            </div>
          </div>

          {error && (
             <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-[10px] uppercase font-bold tracking-tighter"
             >
               ! ERROR: {error}
             </motion.p>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-16 bg-white text-black font-black uppercase tracking-tighter text-xl hover:bg-chaos-green hover:shadow-[0_0_30px_rgba(0,255,0,0.4)] transition-all flex items-center justify-center group ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Verifying...' : 'Enter Selection Matrix'}
            {!isSubmitting && <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>

      {/* Decorative text */}
      <div className="fixed -bottom-10 -left-10 text-[20vw] font-black text-white/5 pointer-events-none select-none uppercase -rotate-12">
        GATE
      </div>
    </div>
  );
}
