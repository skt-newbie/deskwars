/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import IdentityVerificationPage from './pages/IdentityVerificationPage';
import SelectionMatrixPage from './pages/SelectionMatrixPage';
import AIRoastArenaPage from './pages/AIRoastArenaPage';
import HiddenChaosPage from './pages/HiddenChaosPage';
import TickTickBoomPage from './pages/TickTickBoomPage';
import AdminPanel from './pages/AdminPanel';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PrizeCatalogPage from './pages/PrizeCatalogPage';
import Navigation from './components/Navigation';
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { fetchJson } from './lib/api';

type PageState = 'landing' | 'identity' | 'selection-matrix' | 'roast-arena' | 'hidden-chaos' | 'tick-tick-boom' | 'upload' | 'results' | 'leaderboard' | 'admin' | 'prizes';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageState>('landing');
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [aiType, setAiType] = useState<string>('desk');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setCurrentPage('landing');
    };

    window.addEventListener('api-unauthorized', handleUnauthorized);

    const storedUserId = localStorage.getItem('dw_userId');
    
    if (!storedUserId) {
      setCurrentPage('landing');
      setIsLoading(false);
      return;
    }

    const headers: Record<string, string> = { 'x-user-id': storedUserId };

    fetchJson('/api/auth/me', { headers })
      .then(userData => {
        setUser(userData);
        setCurrentPage('selection-matrix');
      })
      .catch(() => {
        localStorage.removeItem('dw_userId');
        setCurrentPage('landing');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      window.removeEventListener('api-unauthorized', handleUnauthorized);
    };
  }, []);

  const handleStart = () => {
    if (user) {
      setCurrentPage('selection-matrix');
    } else {
      setCurrentPage('identity');
    }
  };

  const handleIdentityComplete = async (email: string) => {
    try {
      const userData = await fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      localStorage.setItem('dw_userId', userData.id);
      setUser(userData);
      setCurrentPage('selection-matrix');
    } catch (err: any) {
      console.error('Login error:', err);
      // Re-throw the error so IdentityVerificationPage can show it
      throw err;
    }
  };

  const handleUploadSuccess = (submissionId: string) => {
    setCurrentSubmissionId(submissionId);
    setCurrentPage('results');
    
    // Refresh user data (points updated)
    const storedUserId = localStorage.getItem('dw_userId');
    const headers: Record<string, string> = {};
    if (storedUserId) headers['x-user-id'] = storedUserId;

    fetchJson('/api/auth/me', { headers })
      .then(setUser)
      .catch(console.error);
  };

  const navigateTo = (page: string, params?: any) => {
    if (page === 'upload' && params?.aiType) {
      setAiType(params.aiType);
    }
    setCurrentPage(page as PageState);
  };

  const handleLogout = () => {
    localStorage.removeItem('dw_userId');
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;";
    setUser(null);
    setCurrentPage('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-chaos-pink border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden flex flex-col items-center">
      <div className="w-full max-w-lg md:max-w-6xl min-h-full flex flex-col relative px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-grow w-full"
          >
            {currentPage === 'landing' && <LandingPage onStart={handleStart} />}
            {currentPage === 'identity' && <IdentityVerificationPage onComplete={handleIdentityComplete} />}
            {currentPage === 'selection-matrix' && user && (
              <SelectionMatrixPage user={user} onNavigate={navigateTo} />
            )}
            {currentPage === 'roast-arena' && (
              <AIRoastArenaPage onNavigate={navigateTo} onBack={() => setCurrentPage('selection-matrix')} />
            )}
            {currentPage === 'hidden-chaos' && (
              <HiddenChaosPage />
            )}
            {currentPage === 'tick-tick-boom' && (
              <TickTickBoomPage />
            )}
            {currentPage === 'upload' && (
              <UploadPage onSuccess={handleUploadSuccess} aiType={aiType} />
            )}
            {currentPage === 'results' && currentSubmissionId && (
              <ResultsPage 
                submissionId={currentSubmissionId} 
                onRestart={() => setCurrentPage('selection-matrix')} 
              />
            )}
            {currentPage === 'leaderboard' && <LeaderboardPage />}
            {currentPage === 'admin' && <AdminPanel />}
            {currentPage === 'prizes' && <PrizeCatalogPage />}
          </motion.div>
        </AnimatePresence>

        {(currentPage !== 'landing' && currentPage !== 'identity') && (
          <Navigation 
            currentTab={currentPage} 
            onTabChange={navigateTo} 
            onLogout={handleLogout}
            user={user}
          />
        )}
      </div>
      
      {/* Easter Egg / Background Glitch */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100] opacity-5 select-none overflow-hidden">
          <div className="absolute top-10 left-10 font-mono text-[8px] animate-pulse">SYSTEM_ERROR: CHAOS_LEVEL_CRITICAL</div>
          <div className="absolute bottom-10 right-10 font-mono text-[8px] animate-pulse">CAFFEINE_REQUIRED: 100%</div>
      </div>
    </div>
  );
}
