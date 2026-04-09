import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, image: string | null) => void;
}

export const UploadModal = ({ isOpen, onClose, onSubmit }: UploadModalProps) => {
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit(e, uploadImage);
    setUploadImage(null);
  };

  return (
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
            className="relative w-full max-w-md bg-background-alt border border-border p-8 rounded-3xl shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-accent">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">发布新动态</h2>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 bg-muted/50 hover:border-accent transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                {uploadImage ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    <img src={uploadImage} className="w-full h-full object-cover" alt="preview" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadImage(null); }}
                      className="absolute top-2 right-2 bg-background/80 p-1.5 rounded-full hover:text-accent shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-accent">
                    <Camera className="h-8 w-8" />
                    <span className="text-xs font-medium">点击上传或拍摄照片</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>

              <div>
                <input 
                  name="title"
                  required
                  className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none transition-all font-bold text-foreground"
                  placeholder="给你的动态起个标题..."
                />
              </div>
              <div>
                <textarea 
                  name="content"
                  required
                  rows={5}
                  className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm text-foreground resize-none"
                  placeholder="记录学习收获，支持 Markdown..."
                />
              </div>
              <div className="pt-2">
                <Button variant="accent" type="submit" className="w-full h-12">正式发布</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
