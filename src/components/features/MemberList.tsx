import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, Shield } from 'lucide-react';
import { User } from '../../types/index.js';

interface MemberListProps {
  members: User[];
  currentUserId?: string;
  canManageMembers?: boolean;
  onDeleteMember?: (memberId: string) => void;
  onPromote?: (memberId: string) => void;
  onDemote?: (memberId: string) => void;
}

export const MemberList = ({
  members,
  currentUserId,
  canManageMembers,
  onDeleteMember,
  onPromote,
  onDemote,
}: MemberListProps) => (
  <div className="grid grid-cols-3 gap-4">
    {members.map((member) => {
      const avatar = member.avatarUrl || (member as any).avatar_url;
      const membershipRole = member.membershipRole || 'member';
      const isOwner = membershipRole === 'owner';
      const isAdmin = membershipRole === 'admin';

      const canRemove =
        Boolean(canManageMembers && onDeleteMember) &&
        !isOwner &&
        member.id !== currentUserId;

      const canPromote = Boolean(canManageMembers && onPromote && membershipRole === 'member');
      const canDemote = Boolean(canManageMembers && onDemote && membershipRole === 'admin' && member.id !== currentUserId);

      return (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center p-4 bg-background-alt rounded-2xl border border-border card-shadow relative"
        >
          <div className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {membershipRole === 'owner' ? '创建者' : membershipRole === 'admin' ? '管理员' : '成员'}
          </div>
          {canRemove && (
            <button
              onClick={() => onDeleteMember?.(member.id)}
              className="absolute top-3 right-3 text-[10px] text-red-500 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </button>
          )}
          <div className="relative mb-3 mt-6">
            <img 
              src={avatar} 
              className="h-16 w-16 rounded-full border-2 border-background shadow-sm" 
              alt={member.username} 
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xs font-bold text-foreground text-center line-clamp-1">{member.username}</span>
          {canManageMembers && (
            <div className="flex items-center gap-2 mt-3">
              {canPromote && (
                <button
                  onClick={() => onPromote?.(member.id)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  设为管理员
                </button>
              )}
              {canDemote && (
                <button
                  onClick={() => onDemote?.(member.id)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  取消管理员
                </button>
              )}
            </div>
          )}
        </motion.div>
      );
    })}
  </div>
);
