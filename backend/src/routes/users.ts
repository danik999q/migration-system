import express from 'express';
import { body, validationResult } from 'express-validator';
import { getAllUsers, getUserById, updateUserRole } from '../db/database.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

export const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);
router.use(apiLimiter);

router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
});

router.put(
  '/:id/role',
  [body('role').isIn(['user', 'admin']).withMessage('Роль должна быть "user" или "admin"')],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (req.userId === id) {
        return res.status(400).json({ error: 'Нельзя изменить свою собственную роль' });
      }

      const updatedUser = await updateUserRole(id, role);
      if (!updatedUser) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      const { passwordHash, ...user } = updatedUser;
      res.json(user);
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
      res.status(500).json({ error: 'Ошибка обновления роли' });
    }
  }
);
