import { db } from '../../config/database.js';
import { customers, customerApplications } from './customers.schema.js';
import { applications } from '../applications/applications.schema.js';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';
import { eq, count, desc } from 'drizzle-orm';

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customerList = await db.select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      address: customers.address,
      company: customers.company,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt
    }).from(customers).orderBy(desc(customers.createdAt));

    // For each customer, get their applications and ticket count
    const customersWithDetails = await Promise.all(
      customerList.map(async (customer) => {
        // Get applications
        const customerApps = await db.select({
          id: customerApplications.id,
          assignedAt: customerApplications.assignedAt,
          application: {
            id: applications.id,
            name: applications.name,
            version: applications.version
          }
        })
        .from(customerApplications)
        .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
        .where(eq(customerApplications.customerId, customer.id));

        // Get ticket count
        const [ticketCount] = await db.select({ count: count() })
          .from(tickets)
          .where(eq(tickets.customerId, customer.id));

        return {
          ...customer,
          applications: customerApps,
          _count: {
            tickets: ticketCount.count
          }
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
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get applications
    const customerApps = await db.select({
      id: customerApplications.id,
      assignedAt: customerApplications.assignedAt,
      application: {
        id: applications.id,
        name: applications.name,
        version: applications.version
      }
    })
    .from(customerApplications)
    .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
    .where(eq(customerApplications.customerId, id));

    // Get tickets with assigned and created users
    const customerTickets = await db.select({
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
        email: users.email
      },
      createdBy: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.assignedToId, users.id))
    .where(eq(tickets.customerId, id));

    const customerWithDetails = {
      ...customer,
      applications: customerApps,
      tickets: customerTickets
    };

    res.json(customerWithDetails);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, company, applicationIds = [] } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email already exists
    const [existingCustomer] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);

    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const tenantId = req.user?.tenantId ?? null;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Create customer
    const [customer] = await db.insert(customers).values({
      tenantId,
      name,
      email,
      phone,
      address,
      company
    }).returning();

    // Create customer-application relationships
    if (applicationIds.length > 0) {
      await db.insert(customerApplications).values(
        applicationIds.map(appId => ({
          customerId: customer.id,
          applicationId: appId
        }))
      );
    }

    // Get customer with applications for response
    const customerApps = await db.select({
      id: customerApplications.id,
      assignedAt: customerApplications.assignedAt,
      application: {
        id: applications.id,
        name: applications.name,
        version: applications.version
      }
    })
    .from(customerApplications)
    .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
    .where(eq(customerApplications.customerId, customer.id));

    const customerWithApps = {
      ...customer,
      applications: customerApps
    };

    res.status(201).json(customerWithApps);
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

    // Check if customer exists
    const [existingCustomer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingCustomer.email) {
      const [emailExists] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);

      if (emailExists) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (company !== undefined) updateData.company = company;

    // Update customer
    const [customer] = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();

    // Handle application updates if provided
    if (applicationIds !== undefined) {
      // Remove existing applications
      await db.delete(customerApplications).where(eq(customerApplications.customerId, id));

      // Add new applications
      if (applicationIds.length > 0) {
        await db.insert(customerApplications).values(
          applicationIds.map(appId => ({
            customerId: id,
            applicationId: appId
          }))
        );
      }
    }

    // Get updated customer with applications
    const customerApps = await db.select({
      id: customerApplications.id,
      assignedAt: customerApplications.assignedAt,
      application: {
        id: applications.id,
        name: applications.name,
        version: applications.version
      }
    })
    .from(customerApplications)
    .leftJoin(applications, eq(customerApplications.applicationId, applications.id))
    .where(eq(customerApplications.customerId, id));

    const customerWithApps = {
      ...customer,
      applications: customerApps
    };

    res.json(customerWithApps);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const [existingCustomer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has tickets
    const [ticketCount] = await db.select({ count: count() }).from(tickets).where(eq(tickets.customerId, id));

    if (ticketCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing tickets. Please reassign or delete tickets first.'
      });
    }

    // Remove customer-app relations
    await db.delete(customerApplications).where(eq(customerApplications.customerId, id));

    await db.delete(customers).where(eq(customers.id, id));

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

    // Check if customer and application exist
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.customerApplication.findUnique({
      where: {
        customerId_applicationId: {
          customerId,
          applicationId
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Customer is already assigned to this application' });
    }

    const assignment = await prisma.customerApplication.create({
      data: {
        customerId,
        applicationId
      },
      include: {
        customer: true,
        application: true
      }
    });

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

    const assignment = await prisma.customerApplication.findUnique({
      where: {
        customerId_applicationId: {
          customerId,
          applicationId
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await prisma.customerApplication.delete({
      where: {
        customerId_applicationId: {
          customerId,
          applicationId
        }
      }
    });

    res.json({ message: 'Application removed from customer successfully' });
  } catch (error) {
    console.error('Remove application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};