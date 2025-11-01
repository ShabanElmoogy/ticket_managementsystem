import { db } from "../src/config/database.js";
import { labels, kanbanBoards, kanbanColumns, users, boardPermissions } from './schema.js';
import { eq, and } from 'drizzle-orm';

async function seedKanban() {
  try {
    console.log('🌱 Seeding Kanban data...');

    // Create default labels
    const labelData = [
      { name: 'Bug', color: '#f44336', description: 'Bug reports and fixes' },
      { name: 'Feature', color: '#2196f3', description: 'New features and enhancements' },
      { name: 'Urgent', color: '#ff5722', description: 'Urgent tasks requiring immediate attention' },
      { name: 'Documentation', color: '#9c27b0', description: 'Documentation updates and improvements' },
      { name: 'Testing', color: '#ff9800', description: 'Testing and quality assurance' }
    ];

    const createdLabels = [];
    for (const labelInfo of labelData) {
      const existing = await db.select().from(labels).where(eq(labels.name, labelInfo.name)).limit(1);
      if (!existing.length) {
        const [newLabel] = await db.insert(labels).values(labelInfo).returning();
        createdLabels.push(newLabel);
      } else {
        createdLabels.push(existing[0]);
      }
    }

    console.log(`✅ Created ${createdLabels.length} labels`);

    // Check if default board already exists
    let defaultBoard = await db.select().from(kanbanBoards).where(eq(kanbanBoards.isDefault, true)).limit(1);

    if (!defaultBoard.length) {
      // Create default Kanban board
      const [newBoard] = await db.insert(kanbanBoards).values({
        name: 'Default Board',
        description: 'Default Kanban board for ticket management',
        isDefault: true
      }).returning();

      // Create columns for the board
      const columnData = [
        { name: 'To Do', description: 'Tasks to be started', color: '#e3f2fd', position: 0, boardId: newBoard.id },
        { name: 'In Progress', description: 'Tasks currently being worked on', color: '#fff3e0', position: 1, wipLimit: 3, boardId: newBoard.id },
        { name: 'Review', description: 'Tasks ready for review', color: '#f3e5f5', position: 2, wipLimit: 2, boardId: newBoard.id },
        { name: 'Done', description: 'Completed tasks', color: '#e8f5e8', position: 3, boardId: newBoard.id }
      ];

      await db.insert(kanbanColumns).values(columnData);
      defaultBoard = newBoard;
    } else {
      defaultBoard = defaultBoard[0];
    }

    console.log(`✅ Created default board: ${defaultBoard.name}`);

    // Get admin user to assign board permissions
    const adminUser = await db.select().from(users).where(eq(users.role, 'ADMIN')).limit(1);

    if (adminUser.length) {
      const existing = await db.select().from(boardPermissions)
        .where(and(eq(boardPermissions.userId, adminUser[0].id), eq(boardPermissions.boardId, defaultBoard.id)))
        .limit(1);
      
      if (!existing.length) {
        await db.insert(boardPermissions).values({
          userId: adminUser[0].id,
          boardId: defaultBoard.id,
          role: 'ADMIN'
        });
      }

      console.log(`✅ Assigned admin permissions to ${adminUser[0].name}`);
    }

    console.log('🎉 Kanban seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding Kanban data:', error);
    throw error;
  } finally {
    // Drizzle doesn't need explicit disconnect
  }
}

seedKanban();