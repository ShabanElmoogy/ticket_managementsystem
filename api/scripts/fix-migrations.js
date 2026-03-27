import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

const applied = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
console.log('Already applied:', applied.length, 'migrations');

// Read all sql files except 0014
const files = readdirSync('./drizzle/migrations')
  .filter(f => f.endsWith('.sql') && !f.startsWith('0014'))
  .sort();

let inserted = 0;
for (const file of files) {
  const content = readFileSync(`./drizzle/migrations/${file}`, 'utf8');
  const hash = createHash('sha256').update(content).digest('hex');
  const already = applied.find(r => r.hash === hash);
  if (!already) {
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`;
    console.log('Marked as applied:', file);
    inserted++;
  }
}

console.log(`Done. Inserted ${inserted} records. Now run: npm run db:migrate`);
await sql.end();
