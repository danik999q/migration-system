import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function getJwtSecret(): string {
  try {
    return config.jwtSecret;
  } catch (error) {
    console.error('Error getting JWT_SECRET:', error);
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET environment variable in Vercel.');
  }
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'user' | 'admin';
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  jwt.verify(token, getJwtSecret(), (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }

    if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
      const userId = decoded.userId;
      if (typeof userId === 'string') {
        req.userId = userId;
      }
      if ('role' in decoded) {
        const role = decoded.role;
        if (role === 'user' || role === 'admin') {
          req.userRole = role;
        }
      }
    }
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userRole || req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Требуется доступ администратора' });
  }
  next();
};

