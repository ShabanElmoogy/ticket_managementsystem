import { db } from './src/config/database.js';
import { docs } from './src/modules/docs/docs.schema.js';

async function checkDocs() {
  try {
    const result = await db.select().from(docs).limit(1);
    console.log('Docs data:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkDocs();