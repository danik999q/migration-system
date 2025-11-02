import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getUserByUsername, createUser } from '../db/database.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config.js';

export const router = express.Router();

const SALT_ROUNDS = 10;

function getJwtSecret(): string {
  try {
    return config.jwtSecret;
  } catch (error) {
    console.error('Error getting JWT_SECRET:', error);
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET environment variable in Vercel.');
  }
}

router.post(
  '/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Имя пользователя должно быть от 3 до 30 символов'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен быть минимум 6 символов'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await createUser(username, passwordHash);

          const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, getJwtSecret(), {
            expiresIn: '24h',
          });

          res.status(201).json({
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
            },
          });
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);
      console.error('[Auth] Error name:', error?.name);
      console.error('[Auth] Error message:', error?.message);
      console.error('[Auth] Error stack:', error?.stack);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Ошибка регистрации',
          message: error?.message || 'Unknown error',
        });
      }
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('[Auth] Login attempt started');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[Auth] Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;
      console.log('[Auth] Login attempt for username:', username);

      console.log('[Auth] Fetching user from database...');
      const user = await getUserByUsername(username);
      if (!user) {
        console.log('[Auth] User not found:', username);
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
      }
      console.log('[Auth] User found:', user.id, user.username);

      console.log('[Auth] Comparing password...');
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log('[Auth] Invalid password for user:', username);
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
      }
      console.log('[Auth] Password verified');

      console.log('[Auth] Generating JWT token...');
      const jwtSecret = getJwtSecret();
      const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, jwtSecret, {
        expiresIn: '24h',
      });
      console.log('[Auth] Token generated successfully');

      console.log('[Auth] Login successful for user:', username);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      console.error('[Auth] Error name:', error?.name);
      console.error('[Auth] Error message:', error?.message);
      console.error('[Auth] Error stack:', error?.stack);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Ошибка входа',
          message: error?.message || 'Unknown error',
        });
      }
    }
  }
);

