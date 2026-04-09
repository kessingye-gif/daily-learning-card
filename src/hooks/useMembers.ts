import { useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.js';
import { apiService } from '../services/apiService.js';

export function useMembers(groupId?: string | null, userId?: string | null) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!groupId || !userId) {
      setMembers([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMembers(groupId, userId);
      setMembers(
        data.map((member: any) => ({
          id: member.user_id ?? member.id,
          username: member.username,
          avatarUrl: member.avatar_url,
          role: member.global_role ?? 'user',
          membershipRole: member.role as 'owner' | 'admin' | 'member',
        }))
      );
    } catch (err) {
      setError((err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const deleteMember = async (memberId: string, requesterId: string) => {
    if (!groupId) return;
    try {
      await apiService.removeGroupMember(groupId, memberId, requesterId);
      await fetchMembers();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { members, loading, error, fetchMembers, deleteMember };
}
