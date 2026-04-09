import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, ChevronRight, Trash2 } from 'lucide-react';
import { Card as CardType } from '../../types/index.js';
import { Card } from '../ui/Card.js';
import { cn } from '../../lib/utils.js';

interface CardListProps {
  cards: CardType[];
  onCardClick: (id: number) => void;
  onLike: (e: React.MouseEvent, id: number) => void;
  onDelete?: (id: number) => void;
  currentUserId?: string;
}

export const CardList = ({ cards, onCardClick, onLike, onDelete, currentUserId }: CardListProps) => (
  <div className="space-y-6">
    {cards.map((card, index) => (
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card onClick={() => onCardClick(card.id)}>
          <div className="flex items-center gap-3 mb-4">
            <img src={card.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${card.username}`} className="h-8 w-8 rounded-full" alt="user" />
            <div>
              <p className="text-sm font-bold leading-none">{card.username}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(card.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {card.image_url && (
            <div className="rounded-xl overflow-hidden mb-4 aspect-video border border-border bg-muted">
              <img 
                src={card.image_url} 
                className="w-full h-full object-cover" 
                alt={card.title} 
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <h3 className="text-lg font-bold mb-2">{card.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed">
            {card.content.replace(/[#*`]/g, '')}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-muted-foreground">
              <button 
                onClick={(e) => onLike(e, card.id)}
                className="flex items-center gap-1.5 hover:text-accent transition-colors"
              >
                <Heart className={cn("h-4 w-4", card.is_liked && "fill-accent text-accent")} />
                <span className="text-xs font-medium">{card.likes_count || 0}</span>
              </button>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs font-medium">{card.comments_count || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUserId && card.admin_id === currentUserId && onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                  className="text-[11px] font-semibold text-red-500 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </button>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
          </div>
        </Card>
      </motion.div>
    ))}
  </div>
);
