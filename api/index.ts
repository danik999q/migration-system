import express from 'express';
import cors from 'cors';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { router as authRouter } from './routes/auth.js';
import { router as peopleRouter } from './routes/people.js';
import { router as documentsRouter } from './routes/documents.js';
import { router as statusRouter } from './routes/status.js';
import { router as usersRouter } from './routes/users.js';
import { initDatabase } from './db/database.js';
import { config } from './config.js';

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

try {
  const frontendUrl = config.frontendUrl;
  console.log('Frontend URL configured:', frontendUrl);
  
  const corsOptions: cors.CorsOptions = {
    credentials: true,
    origin: frontendUrl === '*' 
      ? true 
      : (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          
          if (frontendUrl === '*') {
            callback(null, true);
            return;
          }
          
          if (origin === frontendUrl) {
            callback(null, true);
            return;
          }
          
          try {
            const originUrl = new URL(origin);
            const allowedUrl = new URL(frontendUrl);
            
            if (originUrl.hostname === allowedUrl.hostname || 
                originUrl.hostname.endsWith('.' + allowedUrl.hostname) ||
                allowedUrl.hostname === '*') {
              callback(null, true);
              return;
            }
          } catch {
            if (origin.startsWith(frontendUrl)) {
              callback(null, true);
              return;
            }
          }
          
          console.warn('CORS blocked origin:', origin, 'allowed:', frontendUrl);
          callback(new Error('Not allowed by CORS'));
        },
  };
  
  app.use(cors(corsOptions));
  console.log('CORS configured successfully');
} catch (error) {
  console.error('Error setting up CORS:', error);
  app.use(cors({
    credentials: true,
    origin: true,
  }));
  console.log('CORS fallback to allow all origins');
}

app.use(express.json({ limit: '10mb' }));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error in Express:', err);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: err?.message || 'Unknown error',
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/people', peopleRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/status', statusRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDatabaseInitialized() {
  if (dbInitialized) {
    return;
  }
  
  if (!dbInitPromise) {
    dbInitPromise = initDatabase()
      .then(() => {
        dbInitialized = true;
        console.log('Database initialized successfully');
      })
      .catch((error) => {
        console.error('Database initialization error:', error);
        dbInitPromise = null;
        throw error;
      });
  }
  
  await dbInitPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[Handler] ${req.method} ${req.url}`);
  
  try {
    await Promise.race([
      ensureDatabaseInitialized(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout (30 seconds). Please check: 1) DATABASE_URL is correct, 2) PostgreSQL connection string is valid, 3) Database user has read/write permissions.')), 30000)
      )
    ]);
    console.log('[Handler] Database initialized');
  } catch (error) {
    console.error('[Handler] Database initialization failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: errorMessage,
        hint: 'Please check: 1) DATABASE_URL is set in Vercel environment variables, 2) PostgreSQL connection string is valid, 3) Database is accessible from Vercel.'
      });
    }
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error('[Handler] Request timeout');
        res.status(504).json({ error: 'Request timeout', message: 'The request took too long to complete. Please try again.' });
        resolve();
      }
    }, 28000);

    app(req, res, (err?: any) => {
      clearTimeout(timeout);
      if (err) {
        console.error('[Handler] Express error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error', message: err?.message });
        }
        reject(err);
      } else {
        console.log(`[Handler] Request completed: ${req.method} ${req.url}`);
        resolve();
      }
    });
  }).catch((error) => {
    console.error('[Handler] Promise rejection:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

