import { useState, useCallback } from 'react';
import { Card } from '../types/index.js';
import { apiService } from '../services/apiService.js';

export function useCardDetails(userId?: string | null) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [commentText, setCommentText] = useState('');

  const fetchCardDetails = useCallback(async (id: number) => {
    if (!userId) return;
    try {
      const data = await apiService.getCardDetails(id, userId);
      setSelectedCard(data);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  const handleComment = async (e: React.FormEvent, memberId: string) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedCard) return;
    try {
      await apiService.addComment(selectedCard.id, memberId, commentText);
      setCommentText('');
      fetchCardDetails(selectedCard.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavorite = async (cardId: number, memberId: string) => {
    try {
      await apiService.toggleFavorite(cardId, memberId);
      fetchCardDetails(cardId);
    } catch (err) {
      console.error(err);
    }
  };

  return { 
    selectedCard, 
    setSelectedCard, 
    commentText, 
    setCommentText, 
    fetchCardDetails, 
    handleComment, 
    handleFavorite 
  };
}
