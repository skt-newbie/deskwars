import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Trophy, Upload, LogOut, QrCode, RotateCcw, Timer, Settings, Gift } from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user?: User | null;
}

export default function Navigation({ currentTab, onTabChange, onLogout, user }: NavigationProps) {
  const tabs = [
    { id: 'selection-matrix', icon: LayoutDashboard, label: 'HUB' },
    { id: 'roast-arena', icon: Upload, label: 'ARENA' },
    { id: 'tick-tick-boom', icon: Timer, label: 'BOOM' },
    { id: 'hidden-chaos', icon: QrCode, label: 'HIDDEN' },
    { id: 'prizes', icon: Gift, label: 'PRIZES' },
    { id: 'leaderboard', icon: Trophy, label: 'RANKS' },
  ];

  if (user?.isAdmin || user?.is_admin === 1 || user?.email === 'sanjayt9845524530@gmail.com') {
    tabs.push({ id: 'admin', icon: Settings, label: 'ADMIN' });
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 md:left-1/2 md:-translate-x-1/2 md:w-max z-50">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-black/90 backdrop-blur-xl border-2 border-chaos-pink rounded-2xl md:rounded-full px-4 py-2 md:px-6 md:py-3 flex gap-4 md:gap-8 items-center arcade-shadow overflow-x-auto md:overflow-x-visible no-scrollbar"
      >
        <div className="flex gap-4 md:gap-8 items-center min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 transition-colors relative px-2 ${
                currentTab === tab.id ? 'text-chaos-pink' : 'text-white hover:text-chaos-green'
              }`}
            >
              <tab.icon className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[10px] md:text-[11px] font-bold tracking-tighter uppercase">{tab.label}</span>
              {currentTab === tab.id && (
                <motion.div 
                  layoutId="nav-pill"
                  className="absolute -inset-x-1 -inset-y-1 bg-chaos-pink/15 -z-10 rounded-lg md:rounded-full"
                />
              )}
            </button>
          ))}

          <div className="w-[1px] md:w-[2px] h-6 bg-white/10 mx-1 md:mx-0" />

          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 text-white hover:text-red-500 transition-colors px-2"
          >
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[10px] md:text-[11px] font-bold tracking-tighter uppercase font-mono">OUT</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
