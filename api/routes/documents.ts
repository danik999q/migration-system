import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import {
  getDocumentsByPersonId,
  createDocument,
  deleteDocument,
  getDocumentById,
  getPersonById,
  getUploadsDir,
} from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

export const router = express.Router();

const UPLOADS_DIR = getUploadsDir();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  },
});

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/person/:personId', async (req: express.Request, res: express.Response) => {
  try {
    const documents = await getDocumentsByPersonId(req.params.personId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения документов' });
  }
});

router.post('/person/:personId', upload.single('document'), async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const person = await getPersonById(req.params.personId);
    if (!person) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: 'Человек не найден' });
    }

    const document = {
      id: uuidv4(),
      personId: req.params.personId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    };

    await createDocument(document);
    res.status(201).json(document);
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Ошибка загрузки документа' });
  }
});

router.delete('/:documentId', async (req: express.Request, res: express.Response) => {
  try {
    const document = await getDocumentById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Документ не найден' });
    }

    const filePath = path.join(UPLOADS_DIR, document.fileName);
    await fs.unlink(filePath).catch(() => {});

    const deleted = await deleteDocument(req.params.documentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Документ не найден' });
    }

    res.json({ message: 'Документ удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления документа' });
  }
});

router.get('/:documentId/download', async (req: express.Request, res: express.Response) => {
  try {
    const document = await getDocumentById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Документ не найден' });
    }

    const filePath = path.join(UPLOADS_DIR, document.fileName);
    res.download(filePath, document.originalName, (err) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка загрузки файла' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения файла' });
  }
});

router.get('/:documentId/content', async (req: express.Request, res: express.Response) => {
  try {
    const document = await getDocumentById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Документ не найден' });
    }

    const filePath = path.join(UPLOADS_DIR, document.fileName);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Ошибка отправки файла:', err);
        res.status(500).json({ error: 'Ошибка отправки файла' });
      }
    });
  } catch (error) {
    console.error('Ошибка получения файла:', error);
    res.status(500).json({ error: 'Ошибка получения файла' });
  }
});

