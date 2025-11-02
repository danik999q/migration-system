import { Pool, PoolClient } from 'pg';
import { config } from '../config.js';

let pool: Pool | null = null;

export async function connectDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const databaseUrl = config.databaseUrl;

  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL is empty. Please check DATABASE_URL environment variable.');
  }

  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error(`Invalid PostgreSQL URI format. URI must start with 'postgres://' or 'postgresql://'. Got: ${databaseUrl.substring(0, 30)}...`);
  }

  console.log('Creating PostgreSQL connection pool...');

  pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Connected to PostgreSQL successfully');
  } catch (error: any) {
    console.error('Failed to connect to PostgreSQL');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    pool = null;
    throw new Error(`Database connection failed: ${error?.message || 'Unknown error'}`);
  }

  return pool;
}

export async function disconnectDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Disconnected from PostgreSQL');
  }
}

export async function getClient(): Promise<PoolClient> {
  const db = await connectDatabase();
  return db.connect();
}

export async function query(text: string, params?: any[]): Promise<any> {
  const db = await connectDatabase();
  const start = Date.now();
  try {
    const result = await db.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error: any) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
}

