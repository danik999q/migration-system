import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getUserByUsername, createUser } from '../db/database.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config.js';

export const router = express.Router();

const JWT_SECRET = config.jwtSecret;
const SALT_ROUNDS = 10;

const handleValidationErrors = (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

router.post(
  '/register',
  authLimiter,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
  ],
  async (req, res) => {
    try {
      if (handleValidationErrors(req, res)) {
        return;
      }

      const { username, password } = req.body;

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this username already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await createUser(username, passwordHash);

          const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
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
    } catch (error) {
      console.error('Error while registering user:', error);
      res.status(500).json({ error: 'Failed to register user.' });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    try {
      if (handleValidationErrors(req, res)) {
        return;
      }

      const { username, password } = req.body;

      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
        expiresIn: '24h',
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error while logging in user:', error);
      res.status(500).json({ error: 'Failed to log in.' });
    }
  }
);
