export function getJwtSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('Environment variable JWT_SECRET is required but was not provided.');
  }
  return value;
}

export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error('Environment variable DATABASE_URL is required but was not provided.');
  }
  return value;
}

export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || '*';
}

export function getUploadsDir(): string {
  return '/tmp/uploads';
}

export const config = {
  get jwtSecret() { return getJwtSecret(); },
  get frontendUrl() { return getFrontendUrl(); },
  get uploadsDir() { return getUploadsDir(); },
  get databaseUrl() { return getDatabaseUrl(); },
};
