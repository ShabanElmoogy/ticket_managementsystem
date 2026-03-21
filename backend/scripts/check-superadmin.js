import { db } from '../src/config/database.js';
import { users } from '../src/modules/users/users.schema.js';
import { eq } from 'drizzle-orm';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/check-superadmin.js <email>');
  process.exit(1);
}

const run = async () => {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(10);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
