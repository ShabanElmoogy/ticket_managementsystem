import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          whatsappNotifications: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedTickets: true,
              createdTickets: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          whatsappNotifications: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedTickets: true,
              createdTickets: true,
              comments: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
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
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
          phone,
          whatsappNotifications
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          whatsappNotifications: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { email, name, role, password, phone, whatsappNotifications } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });

        if (emailExists) {
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
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          whatsappNotifications: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedTickets: true,
              createdTickets: true,
              comments: true
            }
          }
        }
      });

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
const existingUser = await prisma.user.findUnique({
where: { id },
include: {
_count: {
select: {
assignedTickets: true,
createdTickets: true,
comments: true
}
}
}
});

if (!existingUser) {
return res.status(404).json({ error: 'User not found' });
}

// Prevent deletion if user has associated data and not forcing
if (!force && (existingUser._count.assignedTickets > 0 || 
existingUser._count.createdTickets > 0 || 
existingUser._count.comments > 0)) {
return res.status(400).json({ 
error: 'Cannot delete user with associated tickets or comments. Please reassign or remove associated data first.' 
});
}

if (force) {
// Force delete: remove related data and unassign references before deleting user
await prisma.$transaction(async (tx) => {
// Delete comments authored by the user
await tx.comment.deleteMany({ where: { userId: id } });
// Delete activities authored by the user
await tx.ticketActivity.deleteMany({ where: { userId: id } });
// Unassign tickets assigned to the user
await tx.ticket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
// Unassign tasks assigned to the user
await tx.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } });
// Delete tickets created by the user (cascades will clean related labels, notifications, etc.)
await tx.ticket.deleteMany({ where: { createdById: id } });
// Clean up direct relations with cascade defined (also safe to explicitly delete)
await tx.notification.deleteMany({ where: { userId: id } });
await tx.boardPermission.deleteMany({ where: { userId: id } });
// Finally delete the user
await tx.user.delete({ where: { id } });
});
return res.json({ message: 'User and related data deleted successfully' });
}

// Regular delete when there is no related data
await prisma.user.delete({
where: { id }
});

res.json({ message: 'User deleted successfully' });
} catch (error) {
console.error('Delete user error:', error);
res.status(500).json({ error: 'Internal server error' });
}
};

// Get all employees
export const getEmployees = async (req, res) => {
    try {
      const employees = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
      res.json(employees);
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
      const stats = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      });

      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          assignedTickets: {
            some: {
              status: {
                in: ['OPEN', 'IN_PROGRESS']
              }
            }
          }
        }
      });

      res.json({
        total: totalUsers,
        active: activeUsers,
        byRole: stats.reduce((acc, stat) => {
          acc[stat.role] = stat._count.id;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};