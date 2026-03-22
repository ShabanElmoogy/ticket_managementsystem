import { db } from '../../config/database.js';
import { applications } from './applications.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { customers, customerApplications } from '../customers/customers.schema.js';
import { eq, desc, count, and } from 'drizzle-orm';

const getTenantScope = (req) => {
  // SUPER_ADMIN can operate without tenant scope.
  if (req.user?.role === 'SUPER_ADMIN') return req.tenantId ?? null;
  // Tenant-scoped roles must have a tenant context (resolved header/param or token).
  return req.tenantId ?? req.user?.tenantId ?? null;
};

export const getAllApplications = async (req, res) => {
  try {
    const tenantId = getTenantScope(req);
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    const applicationsData = await db
      .select({
        id: applications.id,
        tenantId: applications.tenantId,
        name: applications.name,
        description: applications.description,
        version: applications.version,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        ticketCount: count(tickets.id),
        customerCount: count(customerApplications.customerId)
      })
      .from(applications)
      .leftJoin(tickets, eq(tickets.applicationId, applications.id))
      .leftJoin(customerApplications, eq(customerApplications.applicationId, applications.id))
      .where(tenantId ? eq(applications.tenantId, tenantId) : undefined)
      .groupBy(applications.id)
      .orderBy(desc(applications.createdAt));

    res.json(applicationsData);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenantId = getTenantScope(req);
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    const application = await db
      .select()
      .from(applications)
      .where(tenantId ? and(eq(applications.id, id), eq(applications.tenantId, tenantId)) : eq(applications.id, id))
      .limit(1);

    if (!application.length) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Get associated customers
    const appCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email
      })
      .from(customerApplications)
      .innerJoin(customers, eq(customers.id, customerApplications.customerId))
      .where(eq(customerApplications.applicationId, id));

    // Get associated tickets
    const appTickets = await db.select().from(tickets).where(eq(tickets.applicationId, id));

    const result = {
      ...application[0],
      customers: appCustomers,
      tickets: appTickets
    };

    res.json(result);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new application
export const createApplication = async (req, res) => {
  try {
    const { name, description, version } = req.body;

    const tenantId = getTenantScope(req);
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if application name already exists (within tenant)
    const existingApplication = await db
      .select()
      .from(applications)
      .where(and(eq(applications.name, name), eq(applications.tenantId, tenantId)))
      .limit(1);

    if (existingApplication.length) {
      return res.status(400).json({ error: 'Application with this name already exists' });
    }

    // Create application
    const newApplication = await db
      .insert(applications)
      .values({
        tenantId,
        name,
        description,
        version
      })
      .returning();

    res.status(201).json(newApplication[0]);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update application
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, version, isActive } = req.body;

    const tenantId = getTenantScope(req);
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Check if application exists (within tenant)
    const existingApplication = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.tenantId, tenantId)))
      .limit(1);

    if (!existingApplication.length) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if name is being changed and if it already exists (within tenant)
    if (name && name !== existingApplication[0].name) {
      const nameExists = await db
        .select()
        .from(applications)
        .where(and(eq(applications.name, name), eq(applications.tenantId, tenantId)))
        .limit(1);

      if (nameExists.length) {
        return res.status(400).json({ error: 'Application with this name already exists' });
      }
    }

    // Update application
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (version !== undefined) updateData.version = version;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    const updatedApplication = await db
      .update(applications)
      .set(updateData)
      .where(and(eq(applications.id, id), eq(applications.tenantId, tenantId)))
      .returning();

    res.json(updatedApplication[0]);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const tenantId = getTenantScope(req);
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Check if application exists (within tenant)
    const existingApplication = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.tenantId, tenantId)))
      .limit(1);

    if (!existingApplication.length) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if application has tickets
    const ticketCount = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.applicationId, id));

    if (ticketCount[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete application with existing tickets. Please reassign or delete tickets first.'
      });
    }

    await db.delete(applications).where(and(eq(applications.id, id), eq(applications.tenantId, tenantId)));

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign customer to application
export const assignCustomer = async (req, res) => {
  try {
    const { applicationId, customerId } = req.body;

    const tenantId = getTenantScope(req);
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Check if application and customer exist (within tenant)
    const application = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.tenantId, tenantId)))
      .limit(1);

    const customer = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!application.length) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!customer.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)))
      .limit(1);

    if (existingAssignment.length) {
      return res.status(400).json({ error: 'Customer is already assigned to this application' });
    }

    const assignment = await db
      .insert(customerApplications)
      .values({
        customerId,
        applicationId
      })
      .returning();

    res.status(201).json(assignment[0]);
  } catch (error) {
    console.error('Assign customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove customer from application
export const removeCustomer = async (req, res) => {
  try {
    const { applicationId, customerId } = req.params;

    const tenantId = getTenantScope(req);
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Ensure application belongs to tenant
    const application = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.tenantId, tenantId)))
      .limit(1);

    if (!application.length) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Ensure customer belongs to tenant
    const customer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!customer.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const assignment = await db
      .select()
      .from(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)))
      .limit(1);

    if (!assignment.length) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await db
      .delete(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)));

    res.json({ message: 'Customer removed from application successfully' });
  } catch (error) {
    console.error('Remove customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
