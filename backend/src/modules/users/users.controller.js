import { db } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import { users } from './users.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { comments } from '../comments/comments.schema.js';
import { eq, count, desc, inArray, or } from 'drizzle-orm';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
      const usersData = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          whatsappNotifications: users.whatsappNotifications,
          reminderEnabled: users.reminderEnabled,
          reminderInterval: users.reminderInterval,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      // Get counts for each user
      const userIds = usersData.map(u => u.id);
      const assignedCounts = userIds.length > 0 ? await db
        .select({ userId: tickets.assignedToId, count: count() })
        .from(tickets)
        .where(inArray(tickets.assignedToId, userIds))
        .groupBy(tickets.assignedToId) : [];
      
      const createdCounts = userIds.length > 0 ? await db
        .select({ userId: tickets.createdById, count: count() })
        .from(tickets)
        .where(inArray(tickets.createdById, userIds))
        .groupBy(tickets.createdById) : [];
      
      const commentCounts = userIds.length > 0 ? await db
        .select({ userId: comments.userId, count: count() })
        .from(comments)
        .where(inArray(comments.userId, userIds))
        .groupBy(comments.userId) : [];

      // Combine data
      const usersWithCounts = usersData.map(user => ({
        ...user,
        _count: {
          assignedTickets: assignedCounts.find(c => c.userId === user.id)?.count || 0,
          createdTickets: createdCounts.find(c => c.userId === user.id)?.count || 0,
          comments: commentCounts.find(c => c.userId === user.id)?.count || 0
        }
      }));

      res.json(usersWithCounts);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          whatsappNotifications: users.whatsappNotifications,
          reminderEnabled: users.reminderEnabled,
          reminderInterval: users.reminderInterval,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get counts
      const [assignedCount] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.assignedToId, id));
      
      const [createdCount] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.createdById, id));
      
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.userId, id));

      const userWithCounts = {
        ...user[0],
        _count: {
          assignedTickets: assignedCount.count,
          createdTickets: createdCount.count,
          comments: commentCount.count
        }
      };

      res.json(userWithCounts);
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
      const { email, name, password, role = 'EMPLOYEE', phone, whatsappNotifications = false } = req.body;

      // Validate required fields
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Email, name, and password are required' });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email,
          name,
          password: hashedPassword,
          role,
          phone,
          whatsappNotifications
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          whatsappNotifications: users.whatsappNotifications,
          reminderEnabled: users.reminderEnabled,
          reminderInterval: users.reminderInterval,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        });

      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user's profile
export const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        whatsappNotifications: users.whatsappNotifications,
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update own profile
export const updateOwnProfile = async (req, res) => {
  try {
    console.log('Update profile request:', {
      user: req.user,
      body: req.body,
      userKeys: req.user ? Object.keys(req.user) : 'no user',
    });
    
    const userId = req.user?.userId || req.user?.id;
    console.log('Extracted userId:', userId, 'from req.user:', req.user);
    
    if (!userId) {
      console.log('❌ No user ID found. req.user:', req.user);
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('✅ Using userId:', userId);
    const { name, email, phone, reminderEnabled, reminderInterval } = req.body;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser[0].email) {
      const emailExists = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (emailExists.length) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderInterval !== undefined) updateData.reminderInterval = reminderInterval;

    console.log('Update data:', updateData);

    // Update user
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        whatsappNotifications: users.whatsappNotifications,
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    console.log('Updated user:', user);
    res.json(user);
  } catch (error) {
    console.error('Update own profile error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { email, name, role, password, phone, whatsappNotifications, reminderEnabled, reminderInterval } = req.body;

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!existingUser.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== existingUser[0].email) {
        const emailExists = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (emailExists.length) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      // Prepare update data
      const updateData = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (phone !== undefined) updateData.phone = phone;
      if (whatsappNotifications !== undefined) updateData.whatsappNotifications = whatsappNotifications;
      if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
      if (reminderInterval !== undefined) updateData.reminderInterval = reminderInterval;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Update user
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          whatsappNotifications: users.whatsappNotifications,
          reminderEnabled: users.reminderEnabled,
          reminderInterval: users.reminderInterval,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        });

      // Get counts
      const [assignedCount] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.assignedToId, id));
      
      const [createdCount] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.createdById, id));
      
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.userId, id));

      const user = {
        ...updatedUser,
        _count: {
          assignedTickets: assignedCount.count,
          createdTickets: createdCount.count,
          comments: commentCount.count
        }
      };

      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
try {
const { id } = req.params;
const force = req.query?.force === 'true';

// Check if user exists
const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);

if (!existingUser.length) {
return res.status(404).json({ error: 'User not found' });
}

// Get counts
const [assignedCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, id));
const [createdCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.createdById, id));
const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, id));

// Prevent deletion if user has associated data and not forcing
if (!force && (assignedCount.count > 0 || createdCount.count > 0 || commentCount.count > 0)) {
return res.status(400).json({ 
error: 'Cannot delete user with associated tickets or comments. Please reassign or remove associated data first.' 
});
}

if (force) {
// Force delete: remove related data and unassign references before deleting user
await db.transaction(async (tx) => {
// Delete comments authored by the user
await tx.delete(comments).where(eq(comments.userId, id));
// Delete activities authored by the user
await tx.delete(ticketActivities).where(eq(ticketActivities.userId, id));
// Unassign tickets assigned to the user
await tx.update(tickets).set({ assignedToId: null }).where(eq(tickets.assignedToId, id));
// Unassign tasks assigned to the user
await tx.update(tasks).set({ assigneeId: null }).where(eq(tasks.assigneeId, id));
// Delete tickets created by the user
await tx.delete(tickets).where(eq(tickets.createdById, id));
// Clean up direct relations
await tx.delete(notifications).where(eq(notifications.userId, id));
await tx.delete(boardPermissions).where(eq(boardPermissions.userId, id));
// Finally delete the user
await tx.delete(users).where(eq(users.id, id));
});
return res.json({ message: 'User and related data deleted successfully' });
}

// Regular delete when there is no related data
await db.delete(users).where(eq(users.id, id));

res.json({ message: 'User deleted successfully' });
} catch (error) {
console.error('Delete user error:', error);
res.status(500).json({ error: 'Internal server error' });
}
};

// Get all employees
export const getEmployees = async (req, res) => {
    try {
      const employees = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email
        })
        .from(users)
        .where(eq(users.role, 'EMPLOYEE'));
      res.json(employees);
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
      const stats = await db
        .select({
          role: users.role,
          count: count()
        })
        .from(users)
        .groupBy(users.role);

      const [totalUsersResult] = await db.select({ count: count() }).from(users);
      const totalUsers = totalUsersResult.count;
      
      const activeUsersResult = await db
        .select({ userId: tickets.assignedToId })
        .from(tickets)
        .where(or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS')))
        .groupBy(tickets.assignedToId);
      const activeUsers = activeUsersResult.length;

      res.json({
        total: totalUsers,
        active: activeUsers,
        byRole: stats.reduce((acc, stat) => {
          acc[stat.role] = stat.count;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};