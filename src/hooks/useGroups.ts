import { useState, useCallback, useEffect } from 'react';
import { Group } from '../types/index.js';
import { apiService } from '../services/apiService.js';

export function useGroups(userId?: string | null) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      setActiveGroupId(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getGroups(userId);
      setGroups(data);
      if (!activeGroupId || !data.some((group: Group) => group.id === activeGroupId)) {
        setActiveGroupId(data[0]?.id ?? null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, activeGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string) => {
    if (!userId) return;
    const group = await apiService.createGroup(name, userId);
    await fetchGroups();
    if (group?.id) {
      setActiveGroupId(group.id);
    }
  };

  return { groups, activeGroupId, setActiveGroupId, loading, error, fetchGroups, createGroup };
}
