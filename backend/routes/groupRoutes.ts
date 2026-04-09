import { Router } from 'express';
import { randomUUID } from 'crypto';
import { GroupRepository, UserRepository } from '../db/repository.js';

const router = Router();

router.post('/', (req, res) => {
  const name = (req.body?.name ?? '').trim();
  const userId = req.body?.user_id;
  if (!name || !userId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const user = UserRepository.getById(userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  try {
    const groupId = randomUUID();
    const group = GroupRepository.createGroup(groupId, name, userId);
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/', (req, res) => {
  const userId = req.query.user_id as string;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const groups = GroupRepository.getGroupsForUser(userId);
    res.json(groups);
  } catch (error) {
    console.error('List groups failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:groupId/members', (req, res) => {
  const requesterId = req.query.user_id as string;
  if (!requesterId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!GroupRepository.isMember(req.params.groupId, requesterId)) {
    return res.status(403).json({ error: '无权查看成员列表' });
  }
  try {
    const members = GroupRepository.getMembers(req.params.groupId);
    res.json(members);
  } catch (error) {
    console.error('Fetch members failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:groupId/invite', (req, res) => {
  const { inviter_id, invitee_id } = req.body ?? {};
  if (!inviter_id || !invitee_id) {
    return res.status(400).json({ error: '缺少邀请参数' });
  }
  if (!UserRepository.getById(invitee_id)) {
    return res.status(404).json({ error: '被邀请的用户不存在' });
  }
  const result = GroupRepository.requestInvite(req.params.groupId, inviter_id, invitee_id);
  if (result.status === 'forbidden') {
    return res.status(403).json({ error: '只有小组成员可以发起邀请' });
  }
  if (result.status === 'already_member') {
    return res.status(409).json({ error: '该用户已在小组中' });
  }
  if (result.status === 'added') {
    return res.json({ success: true, status: 'added' });
  }
  if (result.status === 'admin_limit') {
    return res.status(403).json({ error: '管理员数量已达上限' });
  }
  res.json({ success: true, status: 'pending' });
});

router.get('/:groupId/invites', (req, res) => {
  const requesterId = req.query.user_id as string;
  if (!requesterId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!GroupRepository.isAdmin(req.params.groupId, requesterId)) {
    return res.status(403).json({ error: '只有管理员可以查看邀请列表' });
  }
  try {
    const invites = GroupRepository.getPendingInvites(req.params.groupId);
    res.json(invites);
  } catch (error) {
    console.error('List invites failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:groupId/invites/:inviteId/approve', (req, res) => {
  const approverId = req.body?.approver_id;
  if (!approverId) {
    return res.status(400).json({ error: 'approver_id is required' });
  }
  const result = GroupRepository.approveInvite(Number(req.params.inviteId), approverId);
  if (result.status === 'forbidden') {
    return res.status(403).json({ error: '只有管理员可以批准邀请' });
  }
  if (result.status === 'not_found') {
    return res.status(404).json({ error: '邀请不存在或已处理' });
  }
  if (result.status === 'admin_limit') {
    return res.status(403).json({ error: '管理员数量已达上限' });
  }
  res.json({ success: true });
});

router.patch('/:groupId/members/:memberId/role', (req, res) => {
  const requesterId = req.body?.requester_id;
  const nextRole = req.body?.role;
  if (!requesterId || !nextRole) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  if (!GroupRepository.isAdmin(req.params.groupId, requesterId)) {
    return res.status(403).json({ error: '只有管理员可以调整角色' });
  }
  if (!['admin', 'member'].includes(nextRole)) {
    return res.status(400).json({ error: '不支持的角色' });
  }
  const result = GroupRepository.setMemberRole(req.params.groupId, req.params.memberId, nextRole);
  if (result.status === 'not_found') {
    return res.status(404).json({ error: '成员不存在' });
  }
  if (result.status === 'not_allowed') {
    return res.status(403).json({ error: '无法调整创建者角色' });
  }
  if (result.status === 'admin_limit') {
    return res.status(403).json({ error: '管理员数量已达上限 (最多 3 位)' });
  }
  res.json({ success: true });
});

router.delete('/:groupId/members/:memberId', (req, res) => {
  const requesterId = req.body?.requester_id;
  if (!requesterId) {
    return res.status(400).json({ error: 'requester_id is required' });
  }
  if (!GroupRepository.isAdmin(req.params.groupId, requesterId)) {
    return res.status(403).json({ error: '只有管理员可以移除成员' });
  }
  if (requesterId === req.params.memberId) {
    return res.status(400).json({ error: '不能删除自己' });
  }
  const result = GroupRepository.removeMember(req.params.groupId, req.params.memberId);
  if (result.status === 'not_found') {
    return res.status(404).json({ error: '成员不存在' });
  }
  if (result.status === 'not_allowed') {
    return res.status(403).json({ error: '无法删除创建者' });
  }
  res.json({ success: true });
});

export default router;
