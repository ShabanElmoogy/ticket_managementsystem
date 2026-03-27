import { db } from '../../config/database.js';
import { customers, customerApplications } from './customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, and, count, desc } from 'drizzle-orm';

import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const whereClause = tenantId ? eq(customers.tenantId, tenantId) : undefined;

    const customerList = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        company: customers.company,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt));

    // For each customer, get their applications and ticket count
    const customersWithDetails = await Promise.all(
      customerList.map(async (customer) => {
        const customerApps = await db
          .select({
            id: customerApplications.id,
            assignedAt: customerApplications.assignedAt,
            application: {
              id: applications.id,
              name: applications.name,
              version: applications.version,
            },
          })
          .from(customerApplications)
          .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
          .where(eq(customerApplications.customerId, customer.id));

        const [ticketCount] = await db
          .select({ count: count() })
          .from(tickets)
          .where(eq(tickets.customerId, customer.id));

        return {
          ...customer,
          applications: customerApps,
          _count: {
            tickets: ticketCount.count,
          },
        };
      })
    );

    res.json(customersWithDetails);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const [customer] = await db
      .select()
      .from(customers)
      .where(tenantId ? and(eq(customers.id, id), eq(customers.tenantId, tenantId)) : eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerApps = await db
      .select({
        id: customerApplications.id,
        assignedAt: customerApplications.assignedAt,
        application: {
          id: applications.id,
          name: applications.name,
          version: applications.version,
        },
      })
      .from(customerApplications)
      .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
      .where(eq(customerApplications.customerId, id));

    // Tickets table has no tenantId; for tenant users we still ensure the customer belongs to tenant above.
    const customerTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        assignedTo: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.assignedToId, users.id))
      .where(eq(tickets.customerId, id));

    res.json({
      ...customer,
      applications: customerApps,
      tickets: customerTickets,
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, company, applicationIds = [] } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const tenantId = requireTenantScope(req);

    // Email uniqueness should be per-tenant
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.email, email), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const [customer] = await db
      .insert(customers)
      .values({
        tenantId,
        name,
        email,
        phone,
        address,
        company,
      })
      .returning();

    if (applicationIds.length > 0) {
      await db.insert(customerApplications).values(
        applicationIds.map((appId) => ({
          customerId: customer.id,
          applicationId: appId,
        }))
      );
    }

    const customerApps = await db
      .select({
        id: customerApplications.id,
        assignedAt: customerApplications.assignedAt,
        application: {
          id: applications.id,
          name: applications.name,
          version: applications.version,
        },
      })
      .from(customerApplications)
      .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
      .where(eq(customerApplications.customerId, customer.id));

    res.status(201).json({
      ...customer,
      applications: customerApps,
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, company, applicationIds } = req.body;

    const tenantId = requireTenantScope(req);

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (email && email !== existingCustomer.email) {
      const [emailExists] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.email, email), eq(customers.tenantId, tenantId)))
        .limit(1);

      if (emailExists) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (company !== undefined) updateData.company = company;

    const [customer] = await db
      .update(customers)
      .set(updateData)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    if (applicationIds !== undefined) {
      await db.delete(customerApplications).where(eq(customerApplications.customerId, id));

      if (applicationIds.length > 0) {
        await db.insert(customerApplications).values(
          applicationIds.map((appId) => ({
            customerId: id,
            applicationId: appId,
          }))
        );
      }
    }

    const customerApps = await db
      .select({
        id: customerApplications.id,
        assignedAt: customerApplications.assignedAt,
        application: {
          id: applications.id,
          name: applications.name,
          version: applications.version,
        },
      })
      .from(customerApplications)
      .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
      .where(eq(customerApplications.customerId, id));

    res.json({
      ...customer,
      applications: customerApps,
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const tenantId = requireTenantScope(req);

    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [ticketCount] = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.customerId, id));

    if (ticketCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing tickets. Please reassign or delete tickets first.',
      });
    }

    await db.delete(customerApplications).where(eq(customerApplications.customerId, id));
    await db.delete(customers).where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign application to customer
export const assignApplication = async (req, res) => {
  try {
    const { customerId, applicationId } = req.body;

    const tenantId = requireTenantScope(req);

    // Ensure both belong to tenant
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
      .limit(1);

    const [application] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.tenantId, tenantId)))
      .limit(1);

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const [existing] = await db
      .select({ id: customerApplications.id })
      .from(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: 'Customer is already assigned to this application' });
    }

    const [assignment] = await db
      .insert(customerApplications)
      .values({ customerId, applicationId })
      .returning();

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assign application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove application from customer
export const removeApplication = async (req, res) => {
  try {
    const { customerId, applicationId } = req.params;

    const tenantId = requireTenantScope(req);

    // Ensure customer belongs to tenant
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const [assignment] = await db
      .select({ id: customerApplications.id })
      .from(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)))
      .limit(1);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await db
      .delete(customerApplications)
      .where(and(eq(customerApplications.customerId, customerId), eq(customerApplications.applicationId, applicationId)));

    res.json({ message: 'Application removed from customer successfully' });
  } catch (error) {
    console.error('Remove application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
