import express from 'express';
import cors from 'cors';
import { router as authRouter } from './routes/auth.js';
import { router as peopleRouter } from './routes/people.js';
import { router as documentsRouter } from './routes/documents.js';
import { router as statusRouter } from './routes/status.js';
import { router as usersRouter } from './routes/users.js';
import { initDatabase } from './db/database.js';
import { config } from './config.js';

const app = express();
const PORT = config.port;

app.use(cors({
  credentials: true,
  origin: config.frontendUrl,
}));

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/people', peopleRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/status', statusRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

startServer();
