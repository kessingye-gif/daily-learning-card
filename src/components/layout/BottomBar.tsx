import React from 'react';
import { BookOpen, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface BottomBarProps {
  activeTab: 'home' | 'members';
  setActiveTab: (tab: 'home' | 'members') => void;
}

export const BottomBar = ({ activeTab, setActiveTab }: BottomBarProps) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-6 px-4">
    <div className="w-full max-w-xs bg-white/90 backdrop-blur-xl border border-border rounded-3xl p-1.5 flex items-center justify-around shadow-xl pointer-events-auto">
      <button 
        onClick={() => setActiveTab('home')}
        className={cn(
          "flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all",
          activeTab === 'home' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted-foreground hover:text-accent"
        )}
      >
        <BookOpen className="h-5 w-5" />
        <span className="text-[10px] font-bold">动态</span>
      </button>
      <button 
        onClick={() => setActiveTab('members')}
        className={cn(
          "flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all",
          activeTab === 'members' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted-foreground hover:text-accent"
        )}
      >
        <UserIcon className="h-5 w-5" />
        <span className="text-[10px] font-bold">成员</span>
      </button>
    </div>
  </div>
);
