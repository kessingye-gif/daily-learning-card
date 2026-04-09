import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteName: string;
  onInviteNameChange: (name: string) => void;
  onInvite: () => void;
}

export const InviteModal = ({ 
  isOpen, 
  onClose, 
  inviteName, 
  onInviteNameChange, 
  onInvite 
}: InviteModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/90 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md bg-background-alt border border-border p-12 rounded-3xl shadow-2xl"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-accent">
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">邀请新成员</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs text-center">
              输入要邀请的成员用户名，管理员的邀请会立即生效，普通成员的邀请会等待审核。
            </p>
            <input 
              type="text" 
              placeholder="被邀请成员的用户名..." 
              value={inviteName}
              onChange={(e) => onInviteNameChange(e.target.value)}
              className="w-full bg-muted border-none px-4 py-3 rounded-xl text-center font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
            />
            <Button 
              variant="accent"
              className="w-full h-12" 
              onClick={onInvite}
            >
              确认邀请
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
