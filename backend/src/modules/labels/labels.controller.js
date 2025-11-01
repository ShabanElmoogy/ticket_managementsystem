import { db } from '../../config/database.js';
import { labels, ticketLabels } from './labels.schema.js';
import { eq, asc, and, count } from 'drizzle-orm';

// Get all labels
export const getAllLabels = async (req, res) => {
  try {
    const labelsWithCount = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        description: labels.description,
        createdAt: labels.createdAt,
        updatedAt: labels.updatedAt,
        _count: {
          tickets: count(ticketLabels.ticketId)
        }
      })
      .from(labels)
      .leftJoin(ticketLabels, eq(labels.id, ticketLabels.labelId))
      .groupBy(labels.id)
      .orderBy(asc(labels.name));

    res.json(labelsWithCount);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
};

// Create new label
export const createLabel = async (req, res) => {
  try {
    const { name, color, description } = req.body;

    const [label] = await db
      .insert(labels)
      .values({ name, color, description })
      .returning();

    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating label:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
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

    const [label] = await db
      .update(labels)
      .set({ name, color, description })
      .where(eq(labels.id, id))
      .returning();

    res.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
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
    await db
      .delete(ticketLabels)
      .where(eq(ticketLabels.labelId, id));

    // Delete the label
    await db
      .delete(labels)
      .where(eq(labels.id, id));

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

    const [ticketLabel] = await db
      .insert(ticketLabels)
      .values({ ticketId, labelId })
      .returning();

    const ticketLabelWithLabel = await db
      .select({
        id: ticketLabels.id,
        ticketId: ticketLabels.ticketId,
        labelId: ticketLabels.labelId,
        label: {
          id: labels.id,
          name: labels.name,
          color: labels.color,
          description: labels.description
        }
      })
      .from(ticketLabels)
      .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
      .where(eq(ticketLabels.id, ticketLabel.id));

    res.status(201).json(ticketLabelWithLabel[0]);
  } catch (error) {
    console.error('Error adding label to ticket:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
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

    await db
      .delete(ticketLabels)
      .where(
        and(
          eq(ticketLabels.ticketId, ticketId),
          eq(ticketLabels.labelId, labelId)
        )
      );

    res.json({ message: 'Label removed from ticket successfully' });
  } catch (error) {
    console.error('Error removing label from ticket:', error);
    res.status(500).json({ error: 'Failed to remove label from ticket' });
  }
};