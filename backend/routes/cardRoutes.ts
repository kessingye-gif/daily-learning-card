import { Router } from 'express';
import { CardRepository, GroupRepository } from '../db/repository.js';

const router = Router();

router.get('/', (req, res) => {
  const groupId = req.query.group_id as string;
  const userId = req.query.user_id as string | undefined;
  if (!groupId) {
    return res.status(400).json({ error: 'group_id is required' });
  }
  if (userId && !GroupRepository.isMember(groupId, userId)) {
    return res.status(403).json({ error: '无权查看该小组数据' });
  }
  try {
    const cards = CardRepository.getAll(groupId);
    CardRepository.incrementViews();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', (req, res) => {
  const userId = req.query.user_id as string | undefined;
  try {
    const card = CardRepository.getById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.group_id && userId && !GroupRepository.isMember(card.group_id, userId)) {
      return res.status(403).json({ error: '无权查看该动态' });
    }
    const comments = CardRepository.getComments(req.params.id);
    res.json({ ...card, comments });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', (req, res) => {
  const { title, content, image_url, admin_id, group_id } = req.body;
  if (!group_id) {
    return res.status(400).json({ error: 'group_id is required' });
  }
  if (!GroupRepository.isMember(group_id, admin_id)) {
    return res.status(403).json({ error: '仅小组成员可以发布内容' });
  }
  try {
    const info = CardRepository.create(title, content, image_url, admin_id, group_id);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/like', (req, res) => {
  const { user_id } = req.body;
  const card = CardRepository.getById(req.params.id);
  if (!card?.group_id) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (!GroupRepository.isMember(card.group_id, user_id)) {
    return res.status(403).json({ error: '仅小组成员可以点赞' });
  }
  try {
    CardRepository.toggleLike(user_id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/favorite', (req, res) => {
  const { user_id } = req.body;
  const card = CardRepository.getById(req.params.id);
  if (!card?.group_id) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (!GroupRepository.isMember(card.group_id, user_id)) {
    return res.status(403).json({ error: '仅小组成员可以收藏' });
  }
  try {
    CardRepository.toggleFavorite(user_id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/comment', (req, res) => {
  const { user_id, content } = req.body;
  const card = CardRepository.getById(req.params.id);
  if (!card?.group_id) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (!GroupRepository.isMember(card.group_id, user_id)) {
    return res.status(403).json({ error: '仅小组成员可以评论' });
  }
  try {
    CardRepository.addComment(user_id, req.params.id, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', (req, res) => {
  const rawUserId = req.body?.user_id ?? req.query.user_id ?? req.headers['x-user-id'];
  const user_id = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const result = CardRepository.delete(req.params.id, user_id);
    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Card not found' });
    }
    if (result.status === 'forbidden') {
      return res.status(403).json({ error: 'You can only delete your own cards' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
