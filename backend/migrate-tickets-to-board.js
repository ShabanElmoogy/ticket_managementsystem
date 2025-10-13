import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTicketsToBoard() {
  try {
    console.log('Starting ticket migration to boards...');

    // Get or create default board
    let defaultBoard = await prisma.kanbanBoard.findFirst({
      where: { isDefault: true }
    });

    if (!defaultBoard) {
      // Create default board if none exists
      defaultBoard = await prisma.kanbanBoard.create({
        data: {
          name: 'Main Board',
          description: 'Default board for all tickets',
          isDefault: true,
          columns: {
            create: [
              { name: 'To Do', position: 0, color: '#e3f2fd' },
              { name: 'In Progress', position: 1, color: '#fff3e0' },
              { name: 'Review', position: 2, color: '#f3e5f5' },
              { name: 'Done', position: 3, color: '#e8f5e8' }
            ]
          }
        }
      });
      console.log('Created default board:', defaultBoard.name);
    }

    // Update all tickets without a boardId to use the default board
    const result = await prisma.ticket.updateMany({
      where: {
        boardId: null
      },
      data: {
        boardId: defaultBoard.id
      }
    });

    console.log(`Updated ${result.count} tickets to use the default board`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTicketsToBoard();