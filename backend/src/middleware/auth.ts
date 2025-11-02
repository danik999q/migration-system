import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const JWT_SECRET = config.jwtSecret;

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'user' | 'admin';
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authorization token.' });
    }

    if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
      req.userId = decoded.userId as string;
      if ('role' in decoded) {
        req.userRole = decoded.role as 'user' | 'admin';
      }
    }
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userRole || req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};
