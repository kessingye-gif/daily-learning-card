import { API_ROUTES } from '../constants/index.js';
import { Card, User, Stats } from '../types/index.js';

type ApiUserResponse = {
  id: string;
  username: string;
  avatar_url: string;
  role: 'user' | 'admin';
  created_at?: string;
};

const toUser = (data: ApiUserResponse): User => ({
  id: data.id,
  username: data.username,
  avatarUrl: data.avatar_url,
  role: data.role,
  createdAt: data.created_at,
});

export const apiService = {
  async getCards(groupId: string, userId: string): Promise<Card[]> {
    const url = new URL(API_ROUTES.CARDS, window.location.origin);
    url.searchParams.set('group_id', groupId);
    url.searchParams.set('user_id', userId);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to fetch cards' }));
      throw new Error(error || 'Failed to fetch cards');
    }
    return res.json();
  },

  async getCardDetails(id: number, userId: string): Promise<Card> {
    const url = new URL(`${API_ROUTES.CARDS}/${id}`, window.location.origin);
    url.searchParams.set('user_id', userId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch card details');
    return res.json();
  },

  async createCard(data: { title: string; content: string; image_url: string | null; admin_id: string; group_id: string }): Promise<{ id: number }> {
    const res = await fetch(API_ROUTES.CARDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create card');
    return res.json();
  },

  async deleteCard(cardId: number, userId: string): Promise<void> {
    const endpoint = `${API_ROUTES.CARDS}/${cardId}?user_id=${encodeURIComponent(userId)}`;

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to delete card' }));
      throw new Error(error || 'Failed to delete card');
    }
  },

  async toggleLike(cardId: number, userId: string): Promise<void> {
    const res = await fetch(`${API_ROUTES.CARDS}/${cardId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to toggle like');
  },

  async toggleFavorite(cardId: number, userId: string): Promise<void> {
    const res = await fetch(`${API_ROUTES.CARDS}/${cardId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
  },

  async addComment(cardId: number, userId: string, content: string): Promise<void> {
    const res = await fetch(`${API_ROUTES.CARDS}/${cardId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, content }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
  },

  async getMembers(groupId: string, userId: string): Promise<User[]> {
    const url = new URL(`${API_ROUTES.GROUPS}/${groupId}/members`, window.location.origin);
    url.searchParams.set('user_id', userId);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Member fetch failed:', res.status, errorData);
      throw new Error(`Failed to fetch members: ${res.status} ${errorData.error || ''}`);
    }
    return res.json();
  },

  async deleteMember(memberId: string, requesterId: string): Promise<void> {
    const res = await fetch(`${API_ROUTES.MEMBERS}/${memberId}?requester_id=${encodeURIComponent(requesterId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': requesterId,
      },
      body: JSON.stringify({ requester_id: requesterId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to delete member' }));
      throw new Error(error || 'Failed to delete member');
    }
  },

  async getGroups(userId: string) {
    const url = new URL(API_ROUTES.GROUPS, window.location.origin);
    url.searchParams.set('user_id', userId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch groups');
    return res.json();
  },

  async createGroup(name: string, userId: string) {
    const res = await fetch(API_ROUTES.GROUPS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, user_id: userId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to create group' }));
      throw new Error(error || 'Failed to create group');
    }
    return res.json();
  },

  async inviteToGroup(groupId: string, inviterId: string, inviteeId: string) {
    const res = await fetch(`${API_ROUTES.GROUPS}/${groupId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviter_id: inviterId, invitee_id: inviteeId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '邀请失败' }));
      throw new Error(error || '邀请失败');
    }
    return res.json();
  },

  async getGroupInvites(groupId: string, userId: string) {
    const url = new URL(`${API_ROUTES.GROUPS}/${groupId}/invites`, window.location.origin);
    url.searchParams.set('user_id', userId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch invites');
    return res.json();
  },

  async approveInvite(groupId: string, inviteId: number, approverId: string) {
    const res = await fetch(`${API_ROUTES.GROUPS}/${groupId}/invites/${inviteId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver_id: approverId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '审批失败' }));
      throw new Error(error || '审批失败');
    }
    return res.json();
  },

  async updateMemberRole(groupId: string, memberId: string, requesterId: string, role: 'admin' | 'member') {
    const res = await fetch(`${API_ROUTES.GROUPS}/${groupId}/members/${memberId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_id: requesterId, role }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '角色调整失败' }));
      throw new Error(error || '角色调整失败');
    }
    return res.json();
  },

  async removeGroupMember(groupId: string, memberId: string, requesterId: string) {
    const res = await fetch(`${API_ROUTES.GROUPS}/${groupId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_id: requesterId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '移除成员失败' }));
      throw new Error(error || '移除成员失败');
    }
    return res.json();
  },

  async findUserByUsername(username: string) {
    const url = new URL('/api/users/search', window.location.origin);
    url.searchParams.set('username', username);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '查询失败' }));
      throw new Error(error || '查询失败');
    }
    return res.json();
  },

  async register(user: { username: string; password: string; avatarUrl?: string; role?: 'user' | 'admin'; id?: string }): Promise<User> {
    const res = await fetch(API_ROUTES.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        password: user.password,
        avatar_url: user.avatarUrl,
        role: user.role,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to register' }));
      throw new Error(error || 'Failed to register');
    }
    const data = await res.json();
    return toUser(data);
  },

  async login(credentials: { username: string; password: string }): Promise<User> {
    const res = await fetch(API_ROUTES.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '登录失败' }));
      throw new Error(error || '登录失败');
    }
    const data = await res.json();
    return toUser(data);
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(API_ROUTES.STATS);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};
