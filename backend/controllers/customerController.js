import { prisma } from '../config/database.js';

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        applications: {
          include: {
            application: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            application: true
          }
        },
        tickets: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, description, applicationIds = [] } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    // Create customer with applications
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        description,
        applications: {
          create: applicationIds.map(appId => ({
            applicationId: appId
          }))
        }
      },
      include: {
        applications: {
          include: {
            application: true
          }
        }
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, description, isActive, applicationIds } = req.body;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    // Update customer
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive })
    };

    // Handle application updates if provided
    if (applicationIds !== undefined) {
      // Remove existing applications and add new ones
      await prisma.customerApplication.deleteMany({
        where: { customerId: id }
      });

      updateData.applications = {
        create: applicationIds.map(appId => ({
          applicationId: appId
        }))
      };
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        applications: {
          include: {
            application: true
          }
        }
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has tickets
    if (existingCustomer._count.tickets > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing tickets. Please reassign or delete tickets first.' 
      });
    }

    await prisma.customer.delete({
      where: { id }
    });

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