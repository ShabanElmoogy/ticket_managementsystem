import { db } from '../src/config/database.js';
import { tickets } from '../src/modules/tickets/tickets.schema.js';
import { eq, and, lt, isNull, isNotNull, or } from 'drizzle-orm';

const PRIORITY_LADDER = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// 1. Show tickets that WOULD be escalated
console.log('\n=== Checking overdue tickets eligible for escalation ===\n');

const now = new Date();
const overdueTickets = await db
  .select({
    id: tickets.id,
    title: tickets.title,
    priority: tickets.priority,
    status: tickets.status,
    dueDate: tickets.dueDate,
    assignedToId: tickets.assignedToId,
  })
  .from(tickets)
  .where(
    and(
      lt(tickets.dueDate, now),
      isNotNull(tickets.dueDate),
      isNull(tickets.deletedAt),
      or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS'))
    )
  );

if (overdueTickets.length === 0) {
  console.log('❌ No overdue tickets found. Make sure a ticket has:');
  console.log('   - dueDate in the past');
  console.log('   - status = OPEN or IN_PROGRESS');
  console.log('   - deletedAt = null');
  console.log('   - priority != URGENT\n');
  process.exit(0);
}

console.log(`Found ${overdueTickets.length} overdue ticket(s):\n`);
overdueTickets.forEach(t => {
  const idx = PRIORITY_LADDER.indexOf(t.priority);
  const canEscalate = idx !== -1 && idx < PRIORITY_LADDER.length - 1;
  console.log(`  [${canEscalate ? '✓ WILL ESCALATE' : '✗ already URGENT'}] "${t.title}"`);
  console.log(`     priority: ${t.priority}${canEscalate ? ' → ' + PRIORITY_LADDER[idx + 1] : ''}`);
  console.log(`     status:   ${t.status}`);
  console.log(`     dueDate:  ${t.dueDate}`);
  console.log();
});

// 2. Run the actual escalation
console.log('=== Running escalation now ===\n');

const { escalatePriorities } = await import('../src/utils/scheduler.js');
await escalatePriorities();

// 3. Show results after
console.log('\n=== Priorities after escalation ===\n');
const after = await db
  .select({ id: tickets.id, title: tickets.title, priority: tickets.priority })
  .from(tickets)
  .where(
    and(
      lt(tickets.dueDate, now),
      isNotNull(tickets.dueDate),
      isNull(tickets.deletedAt),
      or(eq(tickets.status, 'OPEN'), eq(tickets.status, 'IN_PROGRESS'))
    )
  );

after.forEach(t => console.log(`  "${t.title}" → ${t.priority}`));
console.log('\n✅ Done.\n');
process.exit(0);
