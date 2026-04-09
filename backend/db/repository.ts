import { db } from './database.js';

const ADMIN_ROLES = new Set(['owner', 'admin']);
const MAX_ADMINS_PER_GROUP = 3;

const getMembership = (groupId: string, userId: string) => {
  return db.prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId);
};

const getAdminCount = (groupId: string) => {
  const result = db.prepare("SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status = 'active' AND role IN ('owner','admin')").get(groupId) as { count: number };
  return result?.count ?? 0;
};

const ensureAdminLimit = (groupId: string, additionalAdmins = 0) => {
  const current = getAdminCount(groupId);
  return current + additionalAdmins <= MAX_ADMINS_PER_GROUP;
};

const addMemberInternal = (groupId: string, userId: string, role: 'owner' | 'admin' | 'member', invitedBy?: string) => {
  if (role === 'admin' && !ensureAdminLimit(groupId, 1)) {
    return { status: 'admin_limit' as const };
  }
  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO group_members (group_id, user_id, role, status, invited_by) VALUES (?, ?, ?, ?, ?)')
      .run(groupId, userId, role, 'active', invitedBy ?? null);
    db.prepare('DELETE FROM group_invites WHERE group_id = ? AND invitee_id = ?').run(groupId, userId);
  });
  transaction();
  return { status: 'added' as const };
};

export const CardRepository = {
  getAll: (groupId?: string) => {
    if (groupId) {
      return db.prepare('SELECT * FROM cards WHERE group_id = ? ORDER BY created_at DESC').all(groupId);
    }
    return db.prepare('SELECT * FROM cards ORDER BY created_at DESC').all();
  },

  getById: (id: string | number) => {
    return db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  },

  incrementViews: () => {
    return db.prepare('UPDATE cards SET view_count = view_count + 1').run();
  },

  create: (title: string, content: string, image_url: string, admin_id: string, group_id: string) => {
    return db.prepare('INSERT INTO cards (title, content, image_url, admin_id, group_id) VALUES (?, ?, ?, ?, ?)')
      .run(title, content, image_url, admin_id, group_id);
  },

  getComments: (cardId: string | number) => {
    return db.prepare(`
      SELECT c.*, u.username, u.avatar_url 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.card_id = ? 
      ORDER BY c.created_at DESC
    `).all(cardId);
  },

  toggleLike: (userId: string, cardId: string | number) => {
    const transaction = db.transaction(() => {
      const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND card_id = ?').get(userId, cardId);
      if (existing) {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND card_id = ?').run(userId, cardId);
      } else {
        db.prepare('INSERT INTO likes (user_id, card_id) VALUES (?, ?)').run(userId, cardId);
      }
      db.prepare('UPDATE cards SET likes_count = (SELECT COUNT(*) FROM likes WHERE card_id = ?) WHERE id = ?').run(cardId, cardId);
    });
    return transaction();
  },

  toggleFavorite: (userId: string, cardId: string | number) => {
    const transaction = db.transaction(() => {
      const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND card_id = ?').get(userId, cardId);
      if (existing) {
        db.prepare('DELETE FROM favorites WHERE user_id = ? AND card_id = ?').run(userId, cardId);
      } else {
        db.prepare('INSERT INTO favorites (user_id, card_id) VALUES (?, ?)').run(userId, cardId);
      }
      db.prepare('UPDATE cards SET favorites_count = (SELECT COUNT(*) FROM favorites WHERE card_id = ?) WHERE id = ?').run(cardId, cardId);
    });
    return transaction();
  },

  addComment: (userId: string, cardId: string | number, content: string) => {
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO comments (user_id, card_id, content) VALUES (?, ?, ?)').run(userId, cardId, content);
      db.prepare('UPDATE cards SET comments_count = (SELECT COUNT(*) FROM comments WHERE card_id = ?) WHERE id = ?').run(cardId, cardId);
    });
    return transaction();
  },

  delete: (cardId: string | number, userId: string) => {
    const transaction = db.transaction(() => {
      const card = db.prepare('SELECT admin_id FROM cards WHERE id = ?').get(cardId);
      if (!card) {
        return { status: 'not_found' as const };
      }
      if (card.admin_id !== userId) {
        return { status: 'forbidden' as const };
      }

      db.prepare('DELETE FROM likes WHERE card_id = ?').run(cardId);
      db.prepare('DELETE FROM favorites WHERE card_id = ?').run(cardId);
      db.prepare('DELETE FROM comments WHERE card_id = ?').run(cardId);
      db.prepare('DELETE FROM cards WHERE id = ?').run(cardId);

      return { status: 'deleted' as const };
    });

    return transaction();
  },

  getStats: (groupId?: string) => {
    const where = groupId ? 'WHERE group_id = ?' : '';
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(view_count) as total_views,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments
      FROM cards
      ${where}
    `);
    return groupId ? stmt.get(groupId) : stmt.get();
  }
};

export const UserRepository = {
  register: (id: string, username: string, avatar_url: string, role: string, password_hash: string) => {
    return db.prepare('INSERT INTO users (id, username, avatar_url, role, password_hash) VALUES (?, ?, ?, ?, ?)')
      .run(id, username, avatar_url, role, password_hash);
  },

  getAll: () => {
    return db.prepare('SELECT id, username, avatar_url, role, created_at FROM users ORDER BY created_at ASC').all();
  },

  getById: (id: string) => {
    return db.prepare('SELECT id, username, avatar_url, role FROM users WHERE id = ?').get(id);
  },

  findByUsername: (username: string) => {
    return db.prepare('SELECT id, username, avatar_url, role, password_hash FROM users WHERE username = ?').get(username);
  },

  deleteMember: (requesterId: string, memberId: string) => {
    const transaction = db.transaction(() => {
      const requester = db.prepare('SELECT role FROM users WHERE id = ?').get(requesterId);
      if (!requester || requester.role !== 'admin') {
        return { status: 'forbidden' as const };
      }

      const member = db.prepare('SELECT role FROM users WHERE id = ?').get(memberId);
      if (!member) {
        return { status: 'not_found' as const };
      }

      if (member.role === 'admin') {
        return { status: 'not_allowed' as const };
      }

      const cardIds = db.prepare('SELECT id FROM cards WHERE admin_id = ?').all(memberId) as { id: number }[];
      const deleteCardRelations = db.prepare('DELETE FROM likes WHERE card_id = ?');
      const deleteCardFavorites = db.prepare('DELETE FROM favorites WHERE card_id = ?');
      const deleteCardComments = db.prepare('DELETE FROM comments WHERE card_id = ?');
      const deleteCard = db.prepare('DELETE FROM cards WHERE id = ?');

      for (const card of cardIds) {
        deleteCardRelations.run(card.id);
        deleteCardFavorites.run(card.id);
        deleteCardComments.run(card.id);
        deleteCard.run(card.id);
      }

      db.prepare('DELETE FROM likes WHERE user_id = ?').run(memberId);
      db.prepare('DELETE FROM favorites WHERE user_id = ?').run(memberId);
      db.prepare('DELETE FROM comments WHERE user_id = ?').run(memberId);

      db.prepare('DELETE FROM users WHERE id = ?').run(memberId);

      return { status: 'deleted' as const };
    });

    return transaction();
  }
};

export const GroupRepository = {
  createGroup: (id: string, name: string, ownerId: string) => {
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO groups (id, name, owner_id) VALUES (?, ?, ?)').run(id, name, ownerId);
      db.prepare('INSERT INTO group_members (group_id, user_id, role, status, invited_by) VALUES (?, ?, ?, ?, ?)')
        .run(id, ownerId, 'owner', 'active', ownerId);
    });
    transaction();
    return { id, name, owner_id: ownerId };
  },

  getGroupsForUser: (userId: string) => {
    return db.prepare(`
      SELECT g.*, gm.role as membership_role
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = ? AND gm.status = 'active'
      ORDER BY g.created_at DESC
    `).all(userId);
  },

  getMembers: (groupId: string) => {
    return db.prepare(`
      SELECT gm.group_id, gm.user_id, gm.role, gm.status, gm.invited_by,
             u.username, u.avatar_url, u.role as global_role
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ? AND gm.status = 'active'
      ORDER BY CASE gm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.username ASC
    `).all(groupId);
  },

  isMember: (groupId: string, userId: string) => {
    const membership = getMembership(groupId, userId);
    return membership?.status === 'active';
  },

  isAdmin: (groupId: string, userId: string) => {
    const membership = getMembership(groupId, userId);
    return membership?.status === 'active' && ADMIN_ROLES.has(membership.role);
  },

  addMember: (groupId: string, userId: string, role: 'owner' | 'admin' | 'member', invitedBy?: string) => {
    return addMemberInternal(groupId, userId, role, invitedBy);
  },

  removeMember: (groupId: string, targetUserId: string) => {
    const membership = getMembership(groupId, targetUserId);
    if (!membership) {
      return { status: 'not_found' as const };
    }
    if (membership.role === 'owner') {
      return { status: 'not_allowed' as const };
    }
    db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').run(groupId, targetUserId);
    return { status: 'removed' as const };
  },

  setMemberRole: (groupId: string, targetUserId: string, nextRole: 'admin' | 'member') => {
    const membership = getMembership(groupId, targetUserId);
    if (!membership) {
      return { status: 'not_found' as const };
    }
    if (membership.role === 'owner') {
      return { status: 'not_allowed' as const };
    }
    if (nextRole === 'admin' && membership.role !== 'admin') {
      if (!ensureAdminLimit(groupId, 1)) {
        return { status: 'admin_limit' as const };
      }
    }
    if (nextRole === 'member' && membership.role === 'admin') {
      db.prepare('UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?')
        .run('member', groupId, targetUserId);
      return { status: 'updated' as const };
    }
    if (nextRole === 'admin') {
      db.prepare('UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?')
        .run('admin', groupId, targetUserId);
      return { status: 'updated' as const };
    }
    return { status: 'noop' as const };
  },

  requestInvite: (groupId: string, inviterId: string, inviteeId: string) => {
    const inviteeMember = getMembership(groupId, inviteeId);
    if (inviteeMember?.status === 'active') {
      return { status: 'already_member' as const };
    }
    const inviterMembership = getMembership(groupId, inviterId);
    if (!inviterMembership || inviterMembership.status !== 'active') {
      return { status: 'forbidden' as const };
    }
    if (ADMIN_ROLES.has(inviterMembership.role)) {
      const addResult = addMemberInternal(groupId, inviteeId, 'member', inviterId);
      return addResult.status === 'admin_limit' ? addResult : { status: 'added' as const };
    }
    try {
      db.prepare(`
        INSERT INTO group_invites (group_id, inviter_id, invitee_id, status)
        VALUES (?, ?, ?, 'pending')
        ON CONFLICT(group_id, invitee_id) DO UPDATE SET inviter_id=excluded.inviter_id, status='pending', created_at=CURRENT_TIMESTAMP
      `).run(groupId, inviterId, inviteeId);
    } catch (error) {
      console.error('Invite request failed:', error);
      return { status: 'error' as const };
    }
    return { status: 'pending' as const };
  },

  getPendingInvites: (groupId: string) => {
    return db.prepare(`
      SELECT gi.*, u.username as invitee_username, u.avatar_url as invitee_avatar,
             inv.username as inviter_username
      FROM group_invites gi
      JOIN users u ON u.id = gi.invitee_id
      JOIN users inv ON inv.id = gi.inviter_id
      WHERE gi.group_id = ? AND gi.status = 'pending'
      ORDER BY gi.created_at ASC
    `).all(groupId);
  },

  approveInvite: (inviteId: number, approverId: string) => {
    const invite = db.prepare('SELECT * FROM group_invites WHERE id = ?').get(inviteId);
    if (!invite || invite.status !== 'pending') {
      return { status: 'not_found' as const };
    }
    if (!GroupRepository.isAdmin(invite.group_id, approverId)) {
      return { status: 'forbidden' as const };
    }
    const addResult = addMemberInternal(invite.group_id, invite.invitee_id, 'member', approverId);
    if (addResult.status === 'added') {
      db.prepare('UPDATE group_invites SET status = ? WHERE id = ?').run('approved', inviteId);
    }
    return addResult;
  }
};
