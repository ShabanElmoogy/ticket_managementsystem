import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKanban() {
  try {
    console.log('🌱 Seeding Kanban data...');

    // Create default labels
    const labels = await Promise.all([
      prisma.label.upsert({
        where: { name: 'Bug' },
        update: {},
        create: {
          name: 'Bug',
          color: '#f44336',
          description: 'Bug reports and fixes'
        }
      }),
      prisma.label.upsert({
        where: { name: 'Feature' },
        update: {},
        create: {
          name: 'Feature',
          color: '#2196f3',
          description: 'New features and enhancements'
        }
      }),
      prisma.label.upsert({
        where: { name: 'Urgent' },
        update: {},
        create: {
          name: 'Urgent',
          color: '#ff5722',
          description: 'Urgent tasks requiring immediate attention'
        }
      }),
      prisma.label.upsert({
        where: { name: 'Documentation' },
        update: {},
        create: {
          name: 'Documentation',
          color: '#9c27b0',
          description: 'Documentation updates and improvements'
        }
      }),
      prisma.label.upsert({
        where: { name: 'Testing' },
        update: {},
        create: {
          name: 'Testing',
          color: '#ff9800',
          description: 'Testing and quality assurance'
        }
      })
    ]);

    console.log(`✅ Created ${labels.length} labels`);

    // Check if default board already exists
    let defaultBoard = await prisma.kanbanBoard.findFirst({
      where: { isDefault: true },
      include: { columns: true }
    });

    if (!defaultBoard) {
      // Create default Kanban board
      defaultBoard = await prisma.kanbanBoard.create({
        data: {
          name: 'Default Board',
          description: 'Default Kanban board for ticket management',
          isDefault: true,
          columns: {
            create: [
              {
                name: 'To Do',
                description: 'Tasks to be started',
                color: '#e3f2fd',
                position: 0
              },
              {
                name: 'In Progress',
                description: 'Tasks currently being worked on',
                color: '#fff3e0',
                position: 1,
                wipLimit: 3
              },
              {
                name: 'Review',
                description: 'Tasks ready for review',
                color: '#f3e5f5',
                position: 2,
                wipLimit: 2
              },
              {
                name: 'Done',
                description: 'Completed tasks',
                color: '#e8f5e8',
                position: 3
              }
            ]
          }
        },
        include: {
          columns: true
        }
      });
    }

    console.log(`✅ Created default board: ${defaultBoard.name}`);

    // Get admin user to assign board permissions
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (adminUser) {
      await prisma.boardPermission.upsert({
        where: {
          userId_boardId: {
            userId: adminUser.id,
            boardId: defaultBoard.id
          }
        },
        update: {},
        create: {
          userId: adminUser.id,
          boardId: defaultBoard.id,
          role: 'ADMIN'
        }
      });

      console.log(`✅ Assigned admin permissions to ${adminUser.name}`);
    }

    console.log('🎉 Kanban seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding Kanban data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedKanban();