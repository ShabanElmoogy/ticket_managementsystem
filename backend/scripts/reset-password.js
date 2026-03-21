import bcrypt from 'bcryptjs';
import { db } from '../src/config/database.js';
import { users } from '../src/modules/users/users.schema.js';
import { eq } from 'drizzle-orm';

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-password.js <email> <newPassword>');
  process.exit(1);
}

const run = async () => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const existing = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existing.length) {
    console.error(`User not found for email: ${email}`);
    process.exit(1);
  }

  const [updated] = await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role, updatedAt: users.updatedAt });

  console.log('Password reset OK:', updated);
  process.exit(0);
};

run().catch((e) => {
  console.error('Password reset failed:', e);
  process.exit(1);
});
