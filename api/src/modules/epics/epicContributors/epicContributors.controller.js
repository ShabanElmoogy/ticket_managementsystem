import { db } from '../../../config/database.js';
import { epicContributors } from './epicContributors.schema.js';
import { epics } from '../epics/epics.schema.js';
import { users } from '../../users/users.schema.js';
import { eq, and } from 'drizzle-orm';

export const listContributors = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({
        id:        epicContributors.id,
        role:      epicContributors.role,
        createdAt: epicContributors.createdAt,
        userId:    users.id,
        userName:  users.name,
        userEmail: users.email,
      })
      .from(epicContributors)
      .innerJoin(users, eq(epicContributors.userId, users.id))
      .where(eq(epicContributors.epicId, id))
      .orderBy(epicContributors.createdAt);
    res.json(rows.map((r) => ({ id: r.id, role: r.role, createdAt: r.createdAt, user: { id: r.userId, name: r.userName, email: r.userEmail } })));
  } catch (err) {
    console.error('listContributors error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addContributor = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'OTHER' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [epic] = await db.select({ id: epics.id }).from(epics).where(eq(epics.id, id)).limit(1);
    if (!epic) return res.status(404).json({ error: 'Epic not found' });

    const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [row] = await db.insert(epicContributors)
      .values({ epicId: id, userId, role })
      .onConflictDoUpdate({ target: [epicContributors.epicId, epicContributors.userId], set: { role } })
      .returning();

    res.status(201).json({ id: row.id, role: row.role, createdAt: row.createdAt, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('addContributor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateContributor = async (req, res) => {
  try {
    const { contributorId } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role is required' });

    const [row] = await db.update(epicContributors)
      .set({ role })
      .where(eq(epicContributors.id, contributorId))
      .returning();
    if (!row) return res.status(404).json({ error: 'Contributor not found' });
    res.json(row);
  } catch (err) {
    console.error('updateContributor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeContributor = async (req, res) => {
  try {
    const { contributorId } = req.params;
    await db.delete(epicContributors).where(eq(epicContributors.id, contributorId));
    res.json({ message: 'Contributor removed' });
  } catch (err) {
    console.error('removeContributor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
