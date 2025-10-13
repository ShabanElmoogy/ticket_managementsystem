import { prisma } from '../config/database.js';

// Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        customers: {
          include: {
            customer: true
          }
        },
        _count: {
          select: {
            tickets: true,
            customers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        customers: {
          include: {
            customer: true
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
            },
            customer: {
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

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new application
export const createApplication = async (req, res) => {
  try {
    const { name, description, version } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if application name already exists
    const existingApplication = await prisma.application.findFirst({
      where: { name }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Application with this name already exists' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        name,
        description,
        version,
      },
      include: {
        customers: {
          include: {
            customer: true
          }
        }
      }
    });

    res.status(201).json(application);
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

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingApplication.name) {
      const nameExists = await prisma.application.findFirst({
        where: { name }
      });

      if (nameExists) {
        return res.status(400).json({ error: 'Application with this name already exists' });
      }
    }

    // Update application
    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(version !== undefined && { version }),
      ...(isActive !== undefined && { isActive })
    };

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        customers: {
          include: {
            customer: true
          }
        }
      }
    });

    res.json(application);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if application has tickets
    if (existingApplication._count.tickets > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete application with existing tickets. Please reassign or delete tickets first.' 
      });
    }

    await prisma.application.delete({
      where: { id }
    });

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

    // Check if application and customer exist
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
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
    console.error('Assign customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove customer from application
export const removeCustomer = async (req, res) => {
  try {
    const { applicationId, customerId } = req.params;

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

    res.json({ message: 'Customer removed from application successfully' });
  } catch (error) {
    console.error('Remove customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};