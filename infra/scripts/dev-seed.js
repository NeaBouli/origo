// Dev seed — creates test users, factions, GHIFR for local testing
import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.POSTGRES_URL });

async function seed() {
  console.log('Seeding dev data...');

  const hash = await bcrypt.hash('password123', 10);
  const { rows: [user] } = await db.query(
    `INSERT INTO users (email, password_hash) VALUES ('test@origo.app', $1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [hash]
  );

  const factions = [
    { name: 'NeaBouli',   color: '#00ff88', pattern: 'Glider'    },
    { name: 'TestAlpha',  color: '#ff3366', pattern: 'Acorn'     },
    { name: 'TestBravo',  color: '#00aaff', pattern: 'Spaceship' },
  ];

  for (const f of factions) {
    const { rows: [faction] } = await db.query(
      `INSERT INTO factions (user_id, name, color, seed_pattern)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [user.id, f.name, f.color, f.pattern]
    );
    if (faction) {
      await db.query(
        `INSERT INTO ghifr_ledger (faction_id, amount, type, tick)
         VALUES ($1, 1000, 'seed', 0)`,
        [faction.id]
      );
      console.log(`  ✅ Faction: ${f.name} (${faction.id}) — 1000 GHIFR`);
    }
  }

  await db.end();
  console.log('Seed complete.');
}

seed().catch(err => { console.error(err); process.exit(1); });
