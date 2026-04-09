import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { User } from '../../types/index.js';

interface NavbarProps {
  user: User | null;
  logout: () => void;
  onLoginClick: () => void;
}

export const Navbar = ({ user, logout, onLoginClick }: NavbarProps) => (
  <nav className="w-full max-w-md bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 h-16 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
        <BookOpen className="text-white h-5 w-5" />
      </div>
      <h1 className="font-bold text-lg tracking-tight">学习小组</h1>
    </div>
    
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-2">
          <img src={user.avatarUrl} className="h-8 w-8 rounded-full border border-border" alt="profile" referrerPolicy="no-referrer" />
          <button onClick={logout} className="text-muted-foreground hover:text-accent transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button variant="ghost" className="h-9 px-3" onClick={onLoginClick}>登录</Button>
      )}
    </div>
  </nav>
);
