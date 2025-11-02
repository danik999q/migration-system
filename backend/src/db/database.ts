import { v4 as uuidv4 } from 'uuid';
import { query, connectDatabase } from './postgres.js';
import { config } from '../config.js';
import path from 'path';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  personId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export async function initDatabase() {
  try {
    await connectDatabase();
    
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS people (
        id VARCHAR(255) PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        date_of_birth VARCHAR(255),
        nationality VARCHAR(255),
        passport_number VARCHAR(255),
        phone VARCHAR(255),
        email VARCHAR(255),
        address TEXT,
        status VARCHAR(255) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        person_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_people_person_id ON documents(person_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);`);

    console.log('Database tables and indexes created/verified');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function getAllPeople(): Promise<Person[]> {
  const result = await query(`
    SELECT 
      id,
      first_name as "firstName",
      last_name as "lastName",
      middle_name as "middleName",
      date_of_birth as "dateOfBirth",
      nationality,
      passport_number as "passportNumber",
      phone,
      email,
      address,
      status,
      notes,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt"
    FROM people
    ORDER BY created_at DESC
  `);
  
  return result.rows;
}

export async function getPersonById(id: string): Promise<Person | undefined> {
  const result = await query(`
    SELECT 
      id,
      first_name as "firstName",
      last_name as "lastName",
      middle_name as "middleName",
      date_of_birth as "dateOfBirth",
      nationality,
      passport_number as "passportNumber",
      phone,
      email,
      address,
      status,
      notes,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt"
    FROM people
    WHERE id = $1
  `, [id]);
  
  return result.rows[0];
}

export async function createPerson(personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> {
  const now = new Date().toISOString();
  const id = uuidv4();
  
  await query(`
    INSERT INTO people (
      id, first_name, last_name, middle_name, date_of_birth,
      nationality, passport_number, phone, email, address,
      status, notes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `, [
    id,
    personData.firstName,
    personData.lastName,
    personData.middleName || null,
    personData.dateOfBirth || null,
    personData.nationality || null,
    personData.passportNumber || null,
    personData.phone || null,
    personData.email || null,
    personData.address || null,
    personData.status,
    personData.notes || null,
    now,
    now,
  ]);
  
  const person = await getPersonById(id);
  if (!person) {
    throw new Error('Failed to retrieve created person');
  }
  return person;
}

export async function updatePerson(id: string, updates: Partial<Person>): Promise<Person | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.firstName !== undefined) {
    setParts.push(`first_name = $${paramIndex++}`);
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    setParts.push(`last_name = $${paramIndex++}`);
    values.push(updates.lastName);
  }
  if (updates.middleName !== undefined) {
    setParts.push(`middle_name = $${paramIndex++}`);
    values.push(updates.middleName);
  }
  if (updates.dateOfBirth !== undefined) {
    setParts.push(`date_of_birth = $${paramIndex++}`);
    values.push(updates.dateOfBirth);
  }
  if (updates.nationality !== undefined) {
    setParts.push(`nationality = $${paramIndex++}`);
    values.push(updates.nationality);
  }
  if (updates.passportNumber !== undefined) {
    setParts.push(`passport_number = $${paramIndex++}`);
    values.push(updates.passportNumber);
  }
  if (updates.phone !== undefined) {
    setParts.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.email !== undefined) {
    setParts.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.address !== undefined) {
    setParts.push(`address = $${paramIndex++}`);
    values.push(updates.address);
  }
  if (updates.status !== undefined) {
    setParts.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.notes !== undefined) {
    setParts.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }

  if (setParts.length === 0) {
    return await getPersonById(id);
  }

  setParts.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(id);

  await query(`
    UPDATE people
    SET ${setParts.join(', ')}
    WHERE id = $${paramIndex}
  `, values);
  
  return await getPersonById(id);
}

export async function deletePerson(id: string): Promise<boolean> {
  const result = await query('DELETE FROM people WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function getDocumentsByPersonId(personId: string): Promise<Document[]> {
  const result = await query(`
    SELECT 
      id,
      person_id as "personId",
      file_name as "fileName",
      original_name as "originalName",
      mime_type as "mimeType",
      size,
      uploaded_at::text as "uploadedAt"
    FROM documents
    WHERE person_id = $1
    ORDER BY uploaded_at DESC
  `, [personId]);
  
  return result.rows;
}

export async function getDocumentById(documentId: string): Promise<Document | undefined> {
  const result = await query(`
    SELECT 
      id,
      person_id as "personId",
      file_name as "fileName",
      original_name as "originalName",
      mime_type as "mimeType",
      size,
      uploaded_at::text as "uploadedAt"
    FROM documents
    WHERE id = $1
  `, [documentId]);
  
  return result.rows[0];
}

export async function addDocument(document: Document): Promise<void> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await query(`
    INSERT INTO documents (
      id, person_id, file_name, original_name, mime_type, size, uploaded_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    document.id || id,
    document.personId,
    document.fileName,
    document.originalName,
    document.mimeType,
    document.size,
    document.uploadedAt || now,
  ]);
}

export async function createDocument(documentData: Omit<Document, 'id' | 'uploadedAt'>): Promise<Document> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await query(`
    INSERT INTO documents (
      id, person_id, file_name, original_name, mime_type, size, uploaded_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    id,
    documentData.personId,
    documentData.fileName,
    documentData.originalName,
    documentData.mimeType,
    documentData.size,
    now,
  ]);
  
  const document = await getDocumentById(id);
  if (!document) {
    throw new Error('Failed to retrieve created document');
  }
  return document;
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const result = await query('DELETE FROM documents WHERE id = $1', [documentId]);
  return (result.rowCount || 0) > 0;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await query(`
    SELECT 
      id,
      username,
      password_hash as "passwordHash",
      role,
      created_at::text as "createdAt"
    FROM users
    WHERE username = $1
  `, [username]);
  
  return result.rows[0];
}

export async function getUserById(id: string): Promise<Omit<User, 'passwordHash'> | undefined> {
  const result = await query(`
    SELECT 
      id,
      username,
      role,
      created_at::text as "createdAt"
    FROM users
    WHERE id = $1
  `, [id]);
  
  return result.rows[0];
}

export async function createUser(username: string, passwordHash: string, role?: 'user' | 'admin'): Promise<User> {
  const userCountResult = await query('SELECT COUNT(*) as count FROM users');
  const userCount = parseInt(userCountResult.rows[0].count, 10);
  
  const finalRole = role || (userCount === 0 ? 'admin' : 'user');
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await query(`
    INSERT INTO users (id, username, password_hash, role, created_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, username, passwordHash, finalRole, now]);
  
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error('Failed to retrieve created user');
  }
  return user;
}

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  const result = await query(`
    SELECT 
      id,
      username,
      role,
      created_at::text as "createdAt"
    FROM users
    ORDER BY created_at DESC
  `);
  
  return result.rows;
}

export async function updateUserRole(id: string, role: 'user' | 'admin'): Promise<Omit<User, 'passwordHash'> | null> {
  await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  return await getUserById(id);
}

export function getUploadsDir(): string {
  return config.uploadsDir || path.join(process.cwd(), 'uploads');
}
