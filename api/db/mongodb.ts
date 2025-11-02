import { MongoClient, Db, Collection } from 'mongodb';
import { config } from '../config.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!client) {
    const uri = config.mongodbUri;
    
    if (!uri || uri.trim() === '') {
      throw new Error('MongoDB URI is empty. Please check MONGODB_URI environment variable.');
    }
    
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(`Invalid MongoDB URI format. URI must start with 'mongodb://' or 'mongodb+srv://'. Got: ${uri.substring(0, 20)}...`);
    }
    
    console.log('Attempting to connect to MongoDB...');
    const isSrv = uri.startsWith('mongodb+srv://');
    console.log('MongoDB URI format:', isSrv ? 'mongodb+srv' : 'mongodb');
    
    const clientOptions: any = {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 0,
      retryWrites: true,
      retryReads: true,
      directConnection: false,
      heartbeatFrequencyMS: 10000,
      compressors: ['zlib'],
      zlibCompressionLevel: 6,
    };
    
    if (!isSrv) {
      clientOptions.ssl = true;
      clientOptions.sslValidate = true;
    }
    
    console.log('MongoDB connection options configured');
    console.log('Starting MongoDB connection...');
    
    client = new MongoClient(uri, clientOptions);
    
    try {
      const connectStartTime = Date.now();
      console.log('Calling client.connect()...');
      
      await client.connect();
      
      const connectTime = Date.now() - connectStartTime;
      console.log(`MongoDB client connected in ${connectTime}ms`);
      
      console.log('Testing connection with ping...');
      const pingStartTime = Date.now();
      await client.db('admin').command({ ping: 1 });
      const pingTime = Date.now() - pingStartTime;
      console.log(`MongoDB ping successful in ${pingTime}ms`);
      console.log('Connected to MongoDB successfully');
    } catch (error: any) {
      console.error('Failed to connect to MongoDB');
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      if (error?.stack) {
        console.error('Error stack:', error.stack);
      }
      
      let errorMessage = 'Database connection failed';
      if (error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
        errorMessage = 'Cannot reach MongoDB server. Please check your MONGODB_URI and network access settings in MongoDB Atlas.';
      } else if (error?.code === 'EAUTH') {
        errorMessage = 'MongoDB authentication failed. Please check your username and password in MONGODB_URI.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = `Connection timeout: ${error.message}. Please check network access in MongoDB Atlas and ensure IP 0.0.0.0/0 is allowed.`;
      } else if (error?.message) {
        errorMessage = `Database connection failed: ${error.message}`;
      }
      
      client = null;
      throw new Error(errorMessage);
    }
  }

  const dbName = config.mongodbDbName;
  db = client.db(dbName);
  console.log(`Using database: ${dbName}`);
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

export function getCollection<T extends Record<string, any>>(name: string): Collection<T> {
  return getDatabase().collection<T>(name);
}

