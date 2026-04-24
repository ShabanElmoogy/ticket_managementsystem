import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(process.env.DATABASE_URL, {
  ssl:             process.env.DATABASE_SSL === 'true' ? 'require' : false,
  max:             parseInt(process.env.DB_POOL_MAX         ?? '10',  10),
  idle_timeout:    parseInt(process.env.DB_IDLE_TIMEOUT     ?? '30',  10),
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT  ?? '10',  10),
  onnotice: () => {},
});

export const db = drizzle(client);
