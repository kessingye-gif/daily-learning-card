import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  onGroupNameChange: (name: string) => void;
  onCreate: () => void;
}

export const CreateGroupModal = ({
  isOpen,
  onClose,
  groupName,
  onGroupNameChange,
  onCreate,
}: CreateGroupModalProps) => (
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
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">创建学习小组</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="小组名称" 
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              className="w-full bg-muted border-none px-4 py-3 rounded-xl text-center font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
            />
            <Button 
              variant="accent"
              className="w-full h-12" 
              onClick={onCreate}
            >
              确认创建
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
