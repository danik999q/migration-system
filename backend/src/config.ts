import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is required but was not provided.`);
  }
}

const parsePort = (value?: string): number => {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : 3001;
};

export const config = {
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET as string,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  uploadsDir: process.env.UPLOADS_DIR,
  databaseUrl: process.env.DATABASE_URL as string,
};
