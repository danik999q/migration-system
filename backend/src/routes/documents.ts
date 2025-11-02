import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import {
  getDocumentsByPersonId,
  addDocument,
  deleteDocument,
  getDocumentById,
  getPersonById,
} from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type.'));
    }
  },
});

export const router = express.Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/person/:personId', async (req, res) => {
  try {
    const documents = await getDocumentsByPersonId(req.params.personId);
    res.json(documents);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

router.post('/person/:personId', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required.' });
    }

    const person = await getPersonById(req.params.personId);
    if (!person) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: 'Person not found.' });
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

    await addDocument(document);
    res.status(201).json(document);
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Failed to upload document:', error);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
});

router.get('/:documentId/content', async (req, res) => {
  try {
    const document = await getDocumentById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const filePath = path.join(UPLOADS_DIR, document.fileName);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Failed to stream document content:', err);
        res.status(500).json({ error: 'Failed to stream document content.' });
      }
    });
  } catch (error) {
    console.error('Failed to stream document content:', error);
    res.status(500).json({ error: 'Failed to stream document content.' });
  }
});

router.delete('/:documentId', async (req, res) => {
  try {
    const document = await getDocumentById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const deleted = await deleteDocument(req.params.documentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json({ message: 'Document deleted.' });
  } catch (error) {
    console.error('Failed to delete document:', error);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

router.get('/:documentId/download', async (req, res) => {
  try {
    const document = await getDocumentById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const filePath = path.join(UPLOADS_DIR, document.fileName);
    res.download(filePath, document.originalName, (err) => {
      if (err) {
        console.error('Failed to download document:', err);
        res.status(500).json({ error: 'Failed to download document.' });
      }
    });
  } catch (error) {
    console.error('Failed to download document:', error);
    res.status(500).json({ error: 'Failed to download document.' });
  }
});
