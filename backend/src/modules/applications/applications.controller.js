import { db } from '../../config/database.js';
import { applications } from './applications.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { customers, customerApplications } from '../customers/customers.schema.js';
import { eq, desc, count, countDistinct, and } from 'drizzle-orm';
import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';

// Get all applications
export const getAllApplications = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const applicationsData = await db
      .select({
        id: applications.id,
        tenantId: applications.tenantId,
        name: applications.name,
        description: applications.description,
        version: applications.version,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        ticketCount: countDistinct(tickets.id),
        customerCount: countDistinct(customerApplications.customerId),
      })
      .from(applications)
      .leftJoin(tickets, eq(tickets.applicationId, applications.id))
      .leftJoin(customerApplications, eq(customerApplications.applicationId, applications.id))
      .where(tenantId ? eq(applications.tenantId, tenantId) : undefined)
      .groupBy(applications.id)
      .orderBy(desc(applications.createdAt));

    res.json(applicationsData);
  } catch (error) {
    next(error);
  }
};

// Get application by ID
export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const [application] = await db
      .select()
      .from(applications)
      .where(tenantId ? and(eq(applications.id, id), eq(applications.tenantId, tenantId)) : eq(applications.id, id))
      .limit(1);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const [appCustomers, appTickets] = await Promise.all([
      db
        .select({ id: customers.id, name: customers.name, email: customers.email })
        .from(customerApplications)
        .innerJoin(customers, eq(customers.id, customerApplications.customerId))
        .where(
          tenantId
            ? and(eq(customerApplications.applicationId, id), eq(customers.tenantId, tenantId))
            : eq(customerApplications.applicationId, id)
        ),
      db
        .select({
          id: tickets.id,
          title: tickets.title,
          status: tickets.status,
          priority: tickets.priority,
          dueDate: tickets.dueDate,
          createdAt: tickets.createdAt,
        })
        .from(tickets)
        .innerJoin(users, eq(tickets.createdById, users.id))
        .where(
          tenantId
            ? and(eq(tickets.applicationId, id), eq(users.tenantId, tenantId))
            : eq(tickets.applicationId, id)
        ),
    ]);

    res.json({ ...application, customers: appCustomers, tickets: appTickets });
  } catch (error) {
    next(error);
  }
};

// Create new application
export const createApplication = async (req, res, next) => {
  try {
    const { name, description, version } = req.body;
    // requireTenantScope throws 403 if SUPER_ADMIN has no tenant header
    const tenantId = requireTenantScope(req);

    const [existingApplication] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.name, name), eq(applications.tenantId, tenantId)))
      .limit(1);

    if (existingApplication) {
      return res.status(400).json({ error: 'Application with this name already exists' });
    }

    const [newApplication] = await db
      .insert(applications)
      .values({ tenantId, name, description, version })
      .returning();

    res.status(201).json(newApplication);
  } catch (error) {
    next(error);
  }
};

// Update application
export const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, version } = req.body;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const whereById = tenantId
      ? and(eq(applications.id, id), eq(applications.tenantId, tenantId))
      : eq(applications.id, id);

    const [existingApplication] = await db
      .select({ id: applications.id, name: applications.name })
      .from(applications)
      .where(whereById)
      .limit(1);

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (name && name !== existingApplication.name) {
      const [nameExists] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(
          tenantId
            ? and(eq(applications.name, name), eq(applications.tenantId, tenantId))
            : eq(applications.name, name)
        )
        .limit(1);

      if (nameExists) {
        return res.status(400).json({ error: 'Application with this name already exists' });
      }
    }

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (version !== undefined) updateData.version = version;

    const [updatedApplication] = await db
      .update(applications)
      .set(updateData)
      .where(whereById)
      .returning();

    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

// Delete application
export const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const whereById = tenantId
      ? and(eq(applications.id, id), eq(applications.tenantId, tenantId))
      : eq(applications.id, id);

    const [existingApplication] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(whereById)
      .limit(1);

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const [ticketCount] = await db
      .select({ count: count() })
      .from(tickets)
      .innerJoin(users, eq(tickets.createdById, users.id))
      .where(
        tenantId
          ? and(eq(tickets.applicationId, id), eq(users.tenantId, tenantId))
          : eq(tickets.applicationId, id)
      );

    if (ticketCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete application with existing tickets. Please reassign or delete tickets first.',
      });
    }

    await db.delete(applications).where(whereById);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Assign customer to application
export const assignCustomer = async (req, res, next) => {
  try {
    const { applicationId, customerId } = req.body;
    const tenantId = requireTenantScope(req);

    const [appRows, custRows] = await Promise.all([
      db
        .select({ id: applications.id })
        .from(applications)
        .where(and(eq(applications.id, applicationId), eq(applications.tenantId, tenantId)))
        .limit(1),
      db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
        .limit(1),
    ]);

    if (!appRows.length) return res.status(404).json({ error: 'Application not found' });
    if (!custRows.length) return res.status(404).json({ error: 'Customer not found' });

    const [existingAssignment] = await db
      .select({ id: customerApplications.id })
      .from(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)))
      .limit(1);

    if (existingAssignment) {
      return res.status(400).json({ error: 'Customer is already assigned to this application' });
    }

    const [assignment] = await db
      .insert(customerApplications)
      .values({ customerId, applicationId })
      .returning();

    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

// Remove customer from application
export const removeCustomer = async (req, res, next) => {
  try {
    const { applicationId, customerId } = req.params;
    const tenantId = requireTenantScope(req);

    const [appRows, custRows] = await Promise.all([
      db
        .select({ id: applications.id })
        .from(applications)
        .where(and(eq(applications.id, applicationId), eq(applications.tenantId, tenantId)))
        .limit(1),
      db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
        .limit(1),
    ]);

    if (!appRows.length) return res.status(404).json({ error: 'Application not found' });
    if (!custRows.length) return res.status(404).json({ error: 'Customer not found' });

    const [deleted] = await db
      .delete(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)))
      .returning({ id: customerApplications.id });

    if (!deleted) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Customer removed from application successfully' });
  } catch (error) {
    next(error);
  }
};
