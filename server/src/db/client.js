import pg from 'pg';
const { Pool } = pg;

export let db;

export async function connectDB() {
  db = new Pool({ connectionString: process.env.POSTGRES_URL });
  await db.query('SELECT 1'); // verify connection
  db.on('error', err => console.error('[DB] Pool error:', err.message));
}
