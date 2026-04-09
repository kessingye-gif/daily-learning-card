import { useState, useEffect, useCallback } from 'react';
import { Card } from '../types/index.js';
import { apiService } from '../services/apiService.js';

export function useCards(groupId?: string | null, userId?: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!groupId || !userId) {
      setCards([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCards(groupId, userId);
      setCards(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleLike = async (cardId: number, memberId: string) => {
    try {
      await apiService.toggleLike(cardId, memberId);
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (cardId: number, memberId: string) => {
    try {
      await apiService.deleteCard(cardId, memberId);
      await fetchCards();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { cards, loading, error, fetchCards, handleLike, handleDelete };
}
