import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create employee users
  const employee1Password = await bcrypt.hash('employee123', 10);
  const employee1 = await prisma.user.upsert({
    where: { email: 'john@company.com' },
    update: {},
    create: {
      email: 'john@company.com',
      name: 'John Smith',
      password: employee1Password,
      role: 'EMPLOYEE'
    }
  });

  const employee2Password = await bcrypt.hash('employee123', 10);
  const employee2 = await prisma.user.upsert({
    where: { email: 'sarah@company.com' },
    update: {},
    create: {
      email: 'sarah@company.com',
      name: 'Sarah Johnson',
      password: employee2Password,
      role: 'EMPLOYEE'
    }
  });

  // Create additional employee users
  const employee3Password = await bcrypt.hash('employee123', 10);
  const employee3 = await prisma.user.upsert({
    where: { email: 'mike@company.com' },
    update: {},
    create: {
      email: 'mike@company.com',
      name: 'Mike Davis',
      password: employee3Password,
      role: 'EMPLOYEE'
    }
  });

  const employee4Password = await bcrypt.hash('employee123', 10);
  const employee4 = await prisma.user.upsert({
    where: { email: 'emily@company.com' },
    update: {},
    create: {
      email: 'emily@company.com',
      name: 'Emily Chen',
      password: employee4Password,
      role: 'EMPLOYEE'
    }
  });

  const employee5Password = await bcrypt.hash('employee123', 10);
  const employee5 = await prisma.user.upsert({
    where: { email: 'alex@company.com' },
    update: {},
    create: {
      email: 'alex@company.com',
      name: 'Alex Rodriguez',
      password: employee5Password,
      role: 'EMPLOYEE'
    }
  });

  const employee6Password = await bcrypt.hash('employee123', 10);
  const employee6 = await prisma.user.upsert({
    where: { email: 'lisa@company.com' },
    update: {},
    create: {
      email: 'lisa@company.com',
      name: 'Lisa Thompson',
      password: employee6Password,
      role: 'EMPLOYEE'
    }
  });

  // Create additional admin users
  const admin2Password = await bcrypt.hash('admin123', 10);
  const admin2 = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      name: 'David Wilson',
      password: admin2Password,
      role: 'ADMIN'
    }
  });

  const admin3Password = await bcrypt.hash('admin123', 10);
  const admin3 = await prisma.user.upsert({
    where: { email: 'supervisor@company.com' },
    update: {},
    create: {
      email: 'supervisor@company.com',
      name: 'Jennifer Brown',
      password: admin3Password,
      role: 'ADMIN'
    }
  });

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Email server not responding',
      description: 'Customer reports that they cannot send emails. The email server appears to be down or not responding to requests.',
      priority: 'HIGH',
      status: 'OPEN',
      createdById: admin.id
    }
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Website loading slowly',
      description: 'Multiple customers have reported that the company website is loading very slowly, especially the product pages.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      createdById: admin.id,
      assignedToId: employee1.id
    }
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Database backup failed',
      description: 'The automated database backup process failed last night. Need to investigate and ensure data integrity.',
      priority: 'URGENT',
      status: 'OPEN',
      createdById: admin.id
    }
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'User account locked',
      description: 'Customer cannot access their account. Account appears to be locked after multiple failed login attempts.',
      priority: 'LOW',
      status: 'RESOLVED',
      createdById: admin.id,
      assignedToId: employee2.id
    }
  });

  // Create sample comments
  await prisma.comment.create({
    data: {
      content: 'I have started investigating this issue. Checking server logs now.',
      ticketId: ticket2.id,
      userId: employee1.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Found the issue - there was a memory leak in the image processing module. Deploying fix now.',
      ticketId: ticket2.id,
      userId: employee1.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Account has been unlocked and password reset email sent to customer.',
      ticketId: ticket4.id,
      userId: employee2.id
    }
  });

  console.log('Database seeded successfully!');
  console.log('\nDefault users created:');
  console.log('\nAdmins:');
  console.log('- admin@company.com / admin123 (System Administrator)');
  console.log('- manager@company.com / admin123 (David Wilson)');
  console.log('- supervisor@company.com / admin123 (Jennifer Brown)');
  console.log('\nEmployees:');
  console.log('- john@company.com / employee123 (John Smith)');
  console.log('- sarah@company.com / employee123 (Sarah Johnson)');
  console.log('- mike@company.com / employee123 (Mike Davis)');
  console.log('- emily@company.com / employee123 (Emily Chen)');
  console.log('- alex@company.com / employee123 (Alex Rodriguez)');
  console.log('- lisa@company.com / employee123 (Lisa Thompson)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });