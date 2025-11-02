import { MongoClient, Db, Collection } from 'mongodb';
import { config } from '../config.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!client) {
    client = new MongoClient(config.mongodbUri);
    await client.connect();
    console.log('Connected to MongoDB');
  }

  db = client.db(config.mongodbDbName);
  return db;
}

export async function disconnectDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Disconnected from MongoDB');
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export function getCollection<T>(name: string): Collection<T> {
  return getDatabase().collection<T>(name);
}

