import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Bookmark, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, User } from '../../types/index.js';
import { cn } from '../../lib/utils.js';

interface CardDetailModalProps {
  card: Card | null;
  user: User | null;
  commentText: string;
  onClose: () => void;
  onLike: (e: React.MouseEvent, id: number) => void;
  onFavorite: (e: React.MouseEvent, id: number) => void;
  onComment: (e: React.FormEvent) => void;
  onCommentChange: (text: string) => void;
  onDelete?: (id: number) => void;
}

export const CardDetailModal = ({ 
  card, 
  user, 
  commentText, 
  onClose, 
  onLike, 
  onFavorite, 
  onComment, 
  onCommentChange,
  onDelete,
}: CardDetailModalProps) => {
  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/95 backdrop-blur-xl"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="relative w-full max-w-lg bg-background-alt border border-border max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-background/50 p-2 rounded-full backdrop-blur hover:text-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {user?.id === card.admin_id && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="absolute top-4 right-16 z-10 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
            >
              删除
            </button>
          )}
          
          <div className="p-6">
            {card.image_url && (
              <div className="rounded-2xl overflow-hidden mb-6 aspect-video border border-border">
                <img 
                  src={card.image_url} 
                  className="w-full h-full object-cover" 
                  alt={card.title} 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            
            <div className="px-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={card.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${card.username}`} className="h-10 w-10 rounded-full" alt="user" />
                <div>
                  <p className="text-sm font-bold leading-none">{card.username}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(card.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-6">{card.title}</h2>
              
              <div className="markdown-body mb-12">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {card.content}
                </ReactMarkdown>
              </div>

              <div className="flex items-center gap-8 py-6 border-y border-border">
                <button 
                  onClick={(e) => onLike(e, card.id)}
                  className="flex items-center gap-2 group"
                >
                  <Heart className={cn("h-6 w-6 transition-all", card.is_liked ? "fill-accent text-accent" : "text-muted-foreground group-hover:text-accent")} />
                  <span className="text-sm font-bold">{card.likes_count || 0}</span>
                </button>
                <button 
                  onClick={(e) => onFavorite(e, card.id)}
                  className="flex items-center gap-2 group"
                >
                  <Bookmark className={cn("h-6 w-6 transition-all", card.is_favorited ? "fill-accent text-accent" : "text-muted-foreground group-hover:text-accent")} />
                  <span className="text-sm font-bold">{card.favorites_count || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-muted-foreground ml-auto">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-sm font-bold">{card.comments_count || 0}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-10">
                <h3 className="text-base font-bold mb-6">评论</h3>
                
                {user && (
                  <form onSubmit={onComment} className="mb-8">
                    <div className="flex gap-3">
                      <textarea 
                        value={commentText}
                        onChange={(e) => onCommentChange(e.target.value)}
                        className="flex-1 bg-muted border-none p-3 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none text-sm text-foreground resize-none"
                        placeholder="说点什么吧..."
                        rows={2}
                      />
                      <button type="submit" className="bg-accent text-white p-3 rounded-xl hover:opacity-90 transition-all self-end shadow-lg shadow-accent/20">
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-6 pb-6">
                  {card.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={comment.avatar_url} className="h-8 w-8 rounded-full border border-border" alt={comment.username} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{comment.username}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!card.comments || card.comments.length === 0) && (
                    <p className="text-center text-muted-foreground text-xs italic py-4">暂无评论，快来抢沙发吧~</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
