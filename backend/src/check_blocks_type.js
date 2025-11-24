import { db } from './config/database.js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkColumnType() {
    try {
        const result = await client`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'docs' AND column_name = 'blocks'
    `;
        console.log('Current blocks column info:', result);

        // Also check actual data
        const data = await client`SELECT blocks FROM docs LIMIT 1`;
        console.log('Sample data:', data);
        console.log('Type of blocks:', typeof data[0]?.blocks);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

checkColumnType();
