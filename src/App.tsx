import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './lib/AuthContext.js';
import { useCards } from './hooks/useCards.js';
import { useMembers } from './hooks/useMembers.js';
import { useCardDetails } from './hooks/useCardDetails.js';
import { useGroups } from './hooks/useGroups.js';
import { apiService } from './services/apiService.js';
import type { Group, GroupInvite } from './types/index.js';

// UI Components
import { Button } from './components/ui/Button.js';
import { SectionHeader } from './components/ui/SectionHeader.js';

// Layout Components
import { Navbar } from './components/layout/Navbar.js';
import { BottomBar } from './components/layout/BottomBar.js';

// Feature Components
import { CardList } from './components/features/CardList.js';
import { MemberList } from './components/features/MemberList.js';
import { UploadModal } from './components/features/UploadModal.js';
import { CardDetailModal } from './components/features/CardDetailModal.js';
import { InviteModal } from './components/features/InviteModal.js';
import { AuthPanel } from './components/features/AuthPanel.js';
import { CreateGroupModal } from './components/features/CreateGroupModal.js';

export default function App() {
  const { user, login, registerUser, logout } = useAuth();
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
    loading: groupsLoading,
    error: groupsError,
    fetchGroups,
    createGroup,
  } = useGroups(user?.id ?? null);
  const { cards, fetchCards, handleLike, handleDelete, error: cardsError } = useCards(activeGroupId, user?.id ?? null);
  const { members, fetchMembers, deleteMember, error: membersError } = useMembers(activeGroupId, user?.id ?? null);
  const { 
    selectedCard, 
    setSelectedCard, 
    commentText, 
    setCommentText, 
    fetchCardDetails, 
    handleComment, 
    handleFavorite 
  } = useCardDetails(user?.id ?? null);

  const [activeTab, setActiveTab] = useState<'home' | 'members'>('home');
  const [showUpload, setShowUpload] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
  const hasActiveGroup = Boolean(activeGroupId);
  const activeGroup = groups.find((group: Group) => group.id === activeGroupId) ?? null;
  const activeMembershipRole = activeGroup?.membership_role ?? null;
  const canManageGroup = activeMembershipRole === 'owner' || activeMembershipRole === 'admin';

  const fetchInvites = useCallback(async () => {
    if (!user || !activeGroupId || !canManageGroup) {
      setPendingInvites([]);
      return;
    }
    try {
      const data = await apiService.getGroupInvites(activeGroupId, user.id);
      setPendingInvites(data);
    } catch (err) {
      console.error(err);
    }
  }, [user, activeGroupId, canManageGroup]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  useEffect(() => {
    if (!user) {
      setPendingInvites([]);
      setShowInvite(false);
      setShowUpload(false);
    }
  }, [user]);

  const handleDeleteCard = async (cardId: number) => {
    if (!user || !activeGroupId) return;
    const confirmation = window.confirm('确定要删除这条动态吗？');
    if (!confirmation) return;
    try {
      await handleDelete(cardId, user.id);
      if (selectedCard?.id === cardId) {
        setSelectedCard(null);
      }
    } catch (err) {
      console.error(err);
      alert('删除失败，请稍后再试');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>, image: string | null) => {
    e.preventDefault();
    if (!user || !activeGroupId) {
      alert('请先选择一个学习小组');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    try {
      await apiService.createCard({
        title,
        content,
        image_url: image,
        admin_id: user.id,
        group_id: activeGroupId
      });
      setShowUpload(false);
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCredentialLogin = async (username: string, password: string) => {
    await login(username, password);
    fetchGroups();
  };

  const handleCredentialRegister = async (username: string, password: string) => {
    await registerUser(username, password);
    fetchGroups();
  };

  const handleInviteSubmit = async () => {
    if (!activeGroupId) {
      alert('请选择一个小组');
      return;
    }
    if (!inviteName.trim()) {
      alert('请输入邀请对象的用户名');
      return;
    }
    if (!user) return;
    try {
      const invitee = await apiService.findUserByUsername(inviteName.trim());
      const result = await apiService.inviteToGroup(activeGroupId, user.id, invitee.id);
      setInviteName('');
      setShowInvite(false);
      if (result.status === 'pending') {
        alert('邀请已提交，等待管理员审核');
        fetchInvites();
      } else {
        await fetchMembers();
        fetchInvites();
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message || '邀请失败，请稍后再试');
    }
  };

  const handleApproveInvite = async (inviteId: number) => {
    if (!user || !activeGroupId) return;
    try {
      await apiService.approveInvite(activeGroupId, inviteId, user.id);
      await fetchMembers();
      await fetchInvites();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || '审批失败，请稍后再试');
    }
  };

  const handlePromoteMember = async (memberId: string) => {
    if (!user || !activeGroupId) return;
    try {
      await apiService.updateMemberRole(activeGroupId, memberId, user.id, 'admin');
      await fetchMembers();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || '操作失败，请稍后重试');
    }
  };

  const handleDemoteMember = async (memberId: string) => {
    if (!user || !activeGroupId) return;
    try {
      await apiService.updateMemberRole(activeGroupId, memberId, user.id, 'member');
      await fetchMembers();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || '操作失败，请稍后重试');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('请输入小组名称');
      return;
    }
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowCreateGroup(false);
    } catch (err) {
      console.error(err);
      alert((err as Error).message || '创建失败，请稍后再试');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!user || !canManageGroup) return;
    if (memberId === user.id) {
      alert('不能删除自己');
      return;
    }
    const confirmation = window.confirm('确定要移除该成员吗？');
    if (!confirmation) return;
    try {
      await deleteMember(memberId, user.id);
      await fetchInvites();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || '删除成员失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center">
      <Navbar 
        user={user} 
        logout={logout} 
        onLoginClick={() => setActiveTab('home')} 
      />

      <main className="w-full max-w-md px-4 pt-6 pb-32 flex-1">
        {user && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">当前学习小组</p>
                {groupsError && <p className="text-xs text-destructive mt-1">{groupsError}</p>}
              </div>
              <Button variant="secondary" className="h-9 px-3" onClick={() => setShowCreateGroup(true)}>
                新建小组
              </Button>
            </div>
            {groupsLoading ? (
              <p className="text-sm text-muted-foreground">加载小组中...</p>
            ) : groups.length > 0 ? (
              <select
                value={activeGroupId ?? ''}
                onChange={(e) => setActiveGroupId(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              >
                {groups.map((group: Group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.membership_role === 'owner' ? '(创建者)' : group.membership_role === 'admin' ? '(管理员)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 rounded-2xl bg-muted text-sm text-muted-foreground">
                你还没有加入任何小组，可以创建一个新的学习小组或让管理员邀请你加入。
              </div>
            )}
          </section>
        )}

        {activeTab === 'home' ? (
          <>
            {!user && (
              <section className="mb-12 py-8">
                <h2 className="text-3xl font-extrabold mb-4 text-center">欢迎来到学习小组</h2>
                <p className="text-muted-foreground text-sm mb-8 px-4 text-center">
                  注册新账号或登录已有账户，保持学习足迹的唯一性。
                </p>
                <AuthPanel 
                  onLogin={handleCredentialLogin}
                  onRegister={handleCredentialRegister}
                />
              </section>
            )}

            {user && !hasActiveGroup && (
              <div className="p-6 rounded-2xl bg-muted text-sm text-muted-foreground text-center">
                请选择或创建一个学习小组后即可发布和浏览小组动态。
              </div>
            )}

            {user && hasActiveGroup && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader title="学习动态" subtitle="看看伙伴们都在学什么" />
                  <Button variant="accent" className="h-10 px-4 rounded-xl" onClick={() => setShowUpload(true)}>
                    <Plus className="h-4 w-4" /> 发布
                  </Button>
                </div>

                {cardsError && (
                  <div className="bg-accent/10 text-accent p-4 rounded-2xl mb-6 text-sm font-medium border border-accent/20">
                    加载动态失败: {cardsError}
                  </div>
                )}

                <CardList 
                  cards={cards} 
                  currentUserId={user?.id}
                  onCardClick={(id) => user && fetchCardDetails(id)} 
                  onLike={(e, id) => { e.stopPropagation(); user && handleLike(id, user.id); }} 
                  onDelete={(id) => handleDeleteCard(id)}
                />
              </>
            )}
          </>
        ) : (
          <section className="py-4">
            {!user && (
              <div className="p-4 rounded-2xl bg-muted text-sm text-muted-foreground text-center">
                请先登录后再查看成员。
              </div>
            )}

            {user && !hasActiveGroup && (
              <div className="p-4 rounded-2xl bg-muted text-sm text-muted-foreground text-center">
                请先加入或创建一个学习小组。
              </div>
            )}

            {user && hasActiveGroup && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader title="小组成员" subtitle={`${members.length} 位共同进取的伙伴`} />
                  <Button variant="secondary" className="h-10 px-4 rounded-xl" onClick={() => setShowInvite(true)}>
                    <Plus className="h-4 w-4" /> 邀请
                  </Button>
                </div>

                {canManageGroup && pendingInvites.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-muted border border-border space-y-3">
                    <p className="text-sm font-semibold">待审批邀请</p>
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-semibold">{invite.invitee_username}</span>
                          <span className="text-muted-foreground text-xs ml-2">由 {invite.inviter_username} 发起</span>
                        </div>
                        <Button variant="accent" className="h-8 px-3 text-xs" onClick={() => handleApproveInvite(invite.id)}>
                          同意
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {membersError && (
                  <div className="bg-accent/10 text-accent p-4 rounded-2xl mb-6 text-sm font-medium border border-accent/20">
                    加载成员失败: {membersError}
                  </div>
                )}

                <MemberList 
                  members={members} 
                  currentUserId={user?.id}
                  canManageMembers={!!user && canManageGroup}
                  onDeleteMember={handleDeleteMember}
                  onPromote={handlePromoteMember}
                  onDemote={handleDemoteMember}
                />
              </>
            )}
          </section>
        )}
      </main>

      <BottomBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <UploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
        onSubmit={handleUploadSubmit} 
      />

      <CardDetailModal 
        card={selectedCard} 
        user={user} 
        commentText={commentText}
        onClose={() => setSelectedCard(null)}
        onLike={(e, id) => user && handleLike(id, user.id)}
        onFavorite={(e, id) => user && handleFavorite(id, user.id)}
        onComment={(e) => user && handleComment(e, user.id)}
        onCommentChange={setCommentText}
        onDelete={handleDeleteCard}
      />

      <InviteModal 
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        inviteName={inviteName}
        onInviteNameChange={setInviteName}
        onInvite={handleInviteSubmit}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        groupName={newGroupName}
        onGroupNameChange={setNewGroupName}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
