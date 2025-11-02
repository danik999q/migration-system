import express from 'express';
import { body, validationResult } from 'express-validator';
import { updatePerson, getPersonById } from '../db/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

export const router = express.Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.put('/:personId', requireAdmin, [body('status').trim().notEmpty().withMessage('Статус обязателен')], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const person = await getPersonById(req.params.personId);
    if (!person) {
      return res.status(404).json({ error: 'Человек не найден' });
    }

    const updatedPerson = await updatePerson(req.params.personId, { status: req.body.status });
    res.json(updatedPerson);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

