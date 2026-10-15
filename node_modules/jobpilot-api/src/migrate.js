import 'dotenv/config';
import { initializeDatabase, pool, usingEmbeddedDatabase } from './db.js';

await initializeDatabase();
console.log(`Schema applied${usingEmbeddedDatabase ? ' to the local embedded database' : ''}.`);
await pool.end();
