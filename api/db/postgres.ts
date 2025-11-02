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
  
  let urlObj: URL;
  try {
    urlObj = new URL(databaseUrl);
    console.log('Database host:', urlObj.hostname);
    console.log('Database port:', urlObj.port || 'default (5432)');
    console.log('Database name:', urlObj.pathname.split('/').filter(Boolean)[0] || 'default');
    
    if (urlObj.hostname.includes('xxxxx') || urlObj.hostname.includes('example')) {
      throw new Error('Invalid database hostname. Please check DATABASE_URL - it appears to contain placeholder values.');
    }
    
    if (!urlObj.password || urlObj.password === '[YOUR-PASSWORD]' || urlObj.password.includes('YOUR')) {
      throw new Error('Database password not set or contains placeholder. Please check DATABASE_URL and replace [YOUR-PASSWORD] with actual password.');
    }
  } catch (error: any) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid DATABASE_URL format: ${error.message}. Expected format: postgresql://postgres:password@host:port/database`);
    }
    throw error;
  }

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
    console.log('Testing PostgreSQL connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('PostgreSQL version:', result.rows[0]?.version?.substring(0, 50));
    client.release();
    console.log('Connected to PostgreSQL successfully');
  } catch (error: any) {
    console.error('Failed to connect to PostgreSQL');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    if (error?.stack) {
      console.error('Error stack:', error.stack);
    }
    
    let errorMessage = 'Database connection failed';
    if (error?.code === 'ENOTFOUND') {
      errorMessage = `Cannot resolve database hostname. Please check: 1) Supabase project is fully created and active, 2) DATABASE_URL contains correct hostname (not placeholder), 3) DNS is working. Current hostname: ${urlObj?.hostname || 'unknown'}`;
    } else if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNREFUSED') {
      errorMessage = `Cannot reach database server. Please check: 1) Supabase project is active, 2) Connection string is correct, 3) Network connectivity.`;
    } else if (error?.code === '28P01' || error?.message?.includes('password')) {
      errorMessage = `Database authentication failed. Please check: 1) Password in DATABASE_URL is correct, 2) Special characters in password are URL-encoded.`;
    } else if (error?.message) {
      errorMessage = `Database connection failed: ${error.message}`;
    }
    
    pool = null;
    throw new Error(errorMessage);
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
    if (duration > 1000) {
      console.warn(`[PostgreSQL] Slow query (${duration}ms):`, text.substring(0, 100));
    } else {
      console.log('[PostgreSQL] Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
    }
    return result;
  } catch (error: any) {
    console.error('[PostgreSQL] Query error');
    console.error('[PostgreSQL] Query:', text.substring(0, 200));
    if (params && params.length > 0) {
      console.error('[PostgreSQL] Params count:', params.length);
      console.error('[PostgreSQL] Params preview:', params.slice(0, 3));
    }
    console.error('[PostgreSQL] Error name:', error?.name);
    console.error('[PostgreSQL] Error message:', error?.message);
    console.error('[PostgreSQL] Error code:', error?.code);
    console.error('[PostgreSQL] Error detail:', error?.detail);
    if (error?.stack) {
      console.error('[PostgreSQL] Error stack:', error.stack);
    }
    throw error;
  }
}

