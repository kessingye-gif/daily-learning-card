import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button.js';

interface AuthPanelProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
}

export const AuthPanel = ({ onLogin, onRegister }: AuthPanelProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password);
      }
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message || '操作失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-background-alt card-shadow border border-border max-w-md mx-auto"
    >
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          className={`text-sm font-semibold px-4 py-2 rounded-xl ${mode === 'login' ? 'bg-accent text-white' : 'text-muted-foreground bg-muted'}`}
          onClick={() => setMode('login')}
          type="button"
        >
          登录
        </button>
        <button
          className={`text-sm font-semibold px-4 py-2 rounded-xl ${mode === 'register' ? 'bg-accent text-white' : 'text-muted-foreground bg-muted'}`}
          onClick={() => setMode('register')}
          type="button"
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-muted border-none px-4 py-3 rounded-xl font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
        />
        <input
          type="password"
          placeholder="密码（至少 6 位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-muted border-none px-4 py-3 rounded-xl font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
        />
        {mode === 'register' && (
          <input
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-muted border-none px-4 py-3 rounded-xl font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
          />
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}

        <Button 
          variant="accent" 
          className="w-full h-12 mt-2 disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? '处理中...' : mode === 'login' ? '立即登录' : '立即注册'}
        </Button>
      </form>
    </motion.div>
  );
};
