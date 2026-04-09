import { Router } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRepository, CardRepository } from '../db/repository.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const username = (req.body?.username ?? '').trim();
    const password = req.body?.password ?? '';
    const avatar_url = req.body?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
    const requestedRole = req.body?.role;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existing = UserRepository.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: '该用户名已被使用' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = req.body?.id ?? randomUUID();
    const role = (requestedRole === 'admin' || username.toLowerCase() === 'admin') ? 'admin' : 'user';

    UserRepository.register(id, username, avatar_url, role, password_hash);
    res.status(201).json({ id, username, avatar_url, role });
  } catch (error) {
    console.error('Register failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/members', (req, res) => {
  try {
    console.log('Fetching members...');
    const members = UserRepository.getAll();
    console.log('Members fetched:', members.length);
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = CardRepository.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/users/search', (req, res) => {
  const username = (req.query.username as string)?.trim();
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }
  const user = UserRepository.findByUsername(username);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const { password_hash, ...safeUser } = user as any;
  res.json(safeUser);
});

router.post('/login', async (req, res) => {
  try {
    const username = (req.body?.username ?? '').trim();
    const password = req.body?.password ?? '';
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = UserRepository.findByUsername(username);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const { password_hash, ...publicUser } = user;
    res.json(publicUser);
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/members/:id', (req, res) => {
  const rawRequesterId = req.body?.requester_id ?? req.query.requester_id ?? req.headers['x-user-id'];
  const requesterId = Array.isArray(rawRequesterId) ? rawRequesterId[0] : rawRequesterId;

  if (!requesterId || typeof requesterId !== 'string') {
    console.warn('[DELETE /members/:id] Missing requester ID', { requesterId, params: req.params });
    return res.status(400).json({ error: 'Requester ID is required' });
  }

  try {
    const result = UserRepository.deleteMember(requesterId, req.params.id);
    if (result.status === 'forbidden') {
      console.warn('[DELETE /members/:id] Forbidden', { requesterId, target: req.params.id });
      return res.status(403).json({ error: 'Only admins can delete members' });
    }
    if (result.status === 'not_found') {
      console.warn('[DELETE /members/:id] Target not found', { requesterId, target: req.params.id });
      return res.status(404).json({ error: 'Member not found' });
    }
    if (result.status === 'not_allowed') {
      console.warn('[DELETE /members/:id] Target is admin', { requesterId, target: req.params.id });
      return res.status(403).json({ error: 'Cannot delete another admin' });
    }

    console.log('[DELETE /members/:id] Success', { requesterId, target: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE /members/:id] Unexpected error', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
