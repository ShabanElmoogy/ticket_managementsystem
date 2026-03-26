import { db } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import { users } from './users.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { tickets, ticketActivities } from '../tickets/tickets.schema.js';
import { comments } from '../comments/comments.schema.js';
import { eq, count, desc, inArray, or, and } from 'drizzle-orm';
import { Role } from '../../constants/roles.js';

import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';

// Get all users (super admin only)
export const getAllUsers = async (req, res) => {
  try {
    const usersData = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        whatsappNotifications: users.whatsappNotifications,
        reminderEnabled: users.reminderEnabled,
        reminderInterval: users.reminderInterval,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.role, Role.TENANT_ADMIN))
      .orderBy(desc(users.createdAt));

    // Get counts for each user
    const userIds = usersData.map((u) => u.id);

    const assignedCounts =
      userIds.length > 0
        ? await db
            .select({ userId: tickets.assignedToId, count: count() })
            .from(tickets)
            .where(inArray(tickets.assignedToId, userIds))
            .groupBy(tickets.assignedToId)
        : [];

    const createdCounts =
      userIds.length > 0
        ? await db
            .select({ userId: tickets.createdById, count: count() })
            .from(tickets)
            .where(inArray(tickets.createdById, userIds))
            .groupBy(tickets.createdById)
        : [];

    const commentCounts =
      userIds.length > 0
        ? await db
            .select({ userId: comments.userId, count: count() })
            .from(comments)
            .where(inArray(comments.userId, userIds))
            .groupBy(comments.userId)
        : [];

    const usersWithCounts = usersData.map((user) => ({
      ...user,
      _count: {
        assignedTickets: assignedCounts.find((c) => c.userId === user.id)?.count || 0,
        createdTickets: createdCounts.find((c) => c.userId === user.id)?.count || 0,
        comments: commentCounts.find((c) => c.userId === user.id)?.count || 0,
      },
    }));

    res.json(usersWithCounts);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID (super admin only)
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
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [assignedCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, id));
    const [createdCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.createdById, id));
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, id));

    res.json({
      ...user[0],
      _count: {
        assignedTickets: assignedCount.count,
        createdTickets: createdCount.count,
        comments: commentCount.count,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new user (super admin only — role locked to TENANT_ADMIN)
export const createUser = async (req, res) => {
  try {
    const { email, name, password, phone, whatsappNotifications = false } = req.body;
    const role = Role.TENANT_ADMIN; // SUPER_ADMIN can only create tenant admins

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // SUPER_ADMIN must supply X-Tenant-Slug to scope the new user to a tenant.
    // SUPER_ADMIN itself (role === SUPER_ADMIN) is the only role allowed without a tenant.
    const scope = getTenantScope(req);
    let tenantId;
    if (role === Role.SUPER_ADMIN) {
      tenantId = null;
    } else if (scope.type === 'TENANT') {
      tenantId = scope.tenantId;
    } else {
      return res.status(400).json({ error: 'X-Tenant-Slug header is required to create a tenant-scoped user' });
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);

    if (existingUser.length) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        tenantId,
        email,
        name,
        password: hashedPassword,
        role,
        phone,
        whatsappNotifications,
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
        updatedAt: users.updatedAt,
      });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get tenant suspension status for the current user (tenant-scoped users only)
export const getTenantStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const [user] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.tenantId) return res.json({ suspended: false });

    const [tenant] = await db
      .select({ subscriptionStatus: tenants.subscriptionStatus, subscriptionEnd: tenants.subscriptionEnd })
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    if (!tenant) return res.json({ suspended: false });

    const expired = tenant.subscriptionEnd && new Date(tenant.subscriptionEnd) < new Date();
    const suspended = tenant.subscriptionStatus === 'CANCELED' || !!expired;

    return res.json({ suspended });
  } catch (error) {
    console.error('Get tenant status error:', error);
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
        updatedAt: users.updatedAt,
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
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, email, phone, reminderEnabled, reminderInterval } = req.body;

    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== existingUser[0].email) {
      // NOTE: this is global uniqueness; if you want tenant-scoped uniqueness, adjust to include tenantId.
      const emailExists = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (emailExists.length) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderInterval !== undefined) updateData.reminderInterval = reminderInterval;

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
        updatedAt: users.updatedAt,
      });

    res.json(user);
  } catch (error) {
    console.error('Update own profile error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update user (super admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, password, phone, whatsappNotifications, reminderEnabled, reminderInterval } = req.body;

    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== existingUser[0].email) {
      const emailExists = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (emailExists.length) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsappNotifications !== undefined) updateData.whatsappNotifications = whatsappNotifications;
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderInterval !== undefined) updateData.reminderInterval = reminderInterval;
    if (password) updateData.password = await bcrypt.hash(password, 10);

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
        updatedAt: users.updatedAt,
      });

    const [assignedCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, id));
    const [createdCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.createdById, id));
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, id));

    res.json({
      ...updatedUser,
      _count: {
        assignedTickets: assignedCount.count,
        createdTickets: createdCount.count,
        comments: commentCount.count,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user (super admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query?.force === 'true';

    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [assignedCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.assignedToId, id));
    const [createdCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.createdById, id));
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, id));

    if (!force && (assignedCount.count > 0 || createdCount.count > 0 || commentCount.count > 0)) {
      return res.status(400).json({
        error: 'Cannot delete user with associated tickets or comments. Please reassign or remove associated data first.',
      });
    }

    if (force) {
      await db.transaction(async (tx) => {
        await tx.delete(comments).where(eq(comments.userId, id));
        await tx.delete(ticketActivities).where(eq(ticketActivities.userId, id));
        await tx.update(tickets).set({ assignedToId: null }).where(eq(tickets.assignedToId, id));
        await tx.delete(tickets).where(eq(tickets.createdById, id));
        await tx.delete(users).where(eq(users.id, id));
      });
      return res.json({ message: 'User and related data deleted successfully' });
    }

    await db.delete(users).where(eq(users.id, id));
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset user password (super admin only)
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'User not found' });

    const hashed = await bcrypt.hash(password, 10);
    await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, id));

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all employees
// - SUPER_ADMIN: sees all employees
// - TENANT_ADMIN/EMPLOYEE: sees employees only within resolved tenant
export const getEmployees = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const whereClause = tenantId
      ? and(eq(users.role, Role.EMPLOYEE), eq(users.tenantId, tenantId))
      : eq(users.role, Role.EMPLOYEE);

    const employees = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(whereClause);

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all programmers in the resolved tenant
export const getProgrammers = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const whereClause = tenantId
      ? and(eq(users.role, Role.PROGRAMMER), eq(users.tenantId, tenantId))
      : eq(users.role, Role.PROGRAMMER);

    const programmers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(whereClause);

    res.json(programmers);
  } catch (error) {
    console.error('Get programmers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// Tenant-scoped endpoints (TENANT_ADMIN)
// ============================================================================

export const getTenantSeats = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);
    const [tenant] = await db
      .select({ subscriptionSeats: tenants.subscriptionSeats })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const [{ count: used }] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    return res.json({ used: Number(used), total: tenant?.subscriptionSeats ?? 0 });
  } catch (error) {
    console.error('Get tenant seats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTenantUsers = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);

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
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(users.createdAt));

    res.json(usersData);
  } catch (error) {
    console.error('Get tenant users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTenantUser = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);

    const { email, name, password, role = Role.EMPLOYEE, phone, whatsappNotifications = false } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    if (role === Role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Not allowed to create SUPER_ADMIN' });
    }

    // Enforce seat limit
    const [tenant] = await db
      .select({ subscriptionSeats: tenants.subscriptionSeats })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant?.subscriptionSeats > 0) {
      const [{ count: currentCount }] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tenantId, tenantId));

      if (currentCount >= tenant.subscriptionSeats) {
        return res.status(403).json({
          error: `Seat limit reached. Your plan allows ${tenant.subscriptionSeats} user(s). Please upgrade your subscription to add more users.`,
        });
      }
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);

    if (existingUser.length) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        tenantId,
        email,
        name,
        password: hashedPassword,
        role,
        phone,
        whatsappNotifications,
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
        updatedAt: users.updatedAt,
      });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create tenant user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user statistics (super admin only)
export const getUserStats = async (req, res) => {
  try {
    const stats = await db
      .select({
        role: users.role,
        count: count(),
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
      }, {}),
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
