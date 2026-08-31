import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  // Database stored in backend root directory
  const dbFile = process.env.NODE_ENV === 'test' ? 'bhusetu_test.db' : 'bhusetu.db';
  const dbPath = path.join(__dirname, '../../', dbFile);
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys support
  await dbInstance.run('PRAGMA foreign_keys = ON;');

  return dbInstance;
}
