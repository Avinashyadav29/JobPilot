import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const usingEmbeddedDatabase = !process.env.DATABASE_URL;
const embeddedDb = usingEmbeddedDatabase
  ? new (await import('@electric-sql/pglite')).PGlite(path.join(backendDir, 'data'))
  : null;
const postgresPool = usingEmbeddedDatabase
  ? null
  : new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const pool = embeddedDb || postgresPool;
export const q = (text, params = []) => pool.query(text, params).then((r) => r.rows);

export async function initializeDatabase() {
  const schema = await fs.readFile(path.join(backendDir, 'schema.sql'), 'utf8');
  if (embeddedDb) {
    await embeddedDb.exec(schema);
  } else {
    await postgresPool.query(schema);
  }
}
