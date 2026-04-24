import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle migrations');
}

export default defineConfig({
  schema:  './src/modules/schema.js',
  out:     './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
  },
  // Set DRIZZLE_VERBOSE=true to print every SQL statement during migrations
  verbose: process.env.DRIZZLE_VERBOSE === 'true',
  strict:  true,
});
