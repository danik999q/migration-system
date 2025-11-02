import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  getAllPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
} from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

export const router = express.Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', async (req, res) => {
  try {
    const people = await getAllPeople();
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка людей' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const person = await getPersonById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Человек не найден' });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
});

router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('Имя обязательно'),
    body('lastName').trim().notEmpty().withMessage('Фамилия обязательна'),
    body('status').trim().notEmpty().withMessage('Статус обязателен'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const person = await createPerson(req.body);
      res.status(201).json(person);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания человека' });
    }
  }
);

router.put('/:id', async (req, res) => {
  try {
    const person = await updatePerson(req.params.id, req.body);
    if (!person) {
      return res.status(404).json({ error: 'Человек не найден' });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления данных' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deletePerson(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Человек не найден' });
    }
    res.json({ message: 'Человек удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

