import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all labels
export const getAllLabels = async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      include: {
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
};

// Create new label
export const createLabel = async (req, res) => {
  try {
    const { name, color, description } = req.body;

    const label = await prisma.label.create({
      data: {
        name,
        color,
        description
      }
    });

    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating label:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Label name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create label' });
    }
  }
};

// Update label
export const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;

    const label = await prisma.label.update({
      where: { id },
      data: { name, color, description }
    });

    res.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Label name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update label' });
    }
  }
};

// Delete label
export const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove label from all tickets first
    await prisma.ticketLabel.deleteMany({
      where: { labelId: id }
    });

    // Delete the label
    await prisma.label.delete({
      where: { id }
    });

    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
};

// Add label to ticket
export const addLabelToTicket = async (req, res) => {
  try {
    const { ticketId, labelId } = req.body;

    const ticketLabel = await prisma.ticketLabel.create({
      data: {
        ticketId,
        labelId
      },
      include: {
        label: true
      }
    });

    res.status(201).json(ticketLabel);
  } catch (error) {
    console.error('Error adding label to ticket:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Label already assigned to ticket' });
    } else {
      res.status(500).json({ error: 'Failed to add label to ticket' });
    }
  }
};

// Remove label from ticket
export const removeLabelFromTicket = async (req, res) => {
  try {
    const { ticketId, labelId } = req.params;

    await prisma.ticketLabel.delete({
      where: {
        ticketId_labelId: {
          ticketId,
          labelId
        }
      }
    });

    res.json({ message: 'Label removed from ticket successfully' });
  } catch (error) {
    console.error('Error removing label from ticket:', error);
    res.status(500).json({ error: 'Failed to remove label from ticket' });
  }
};