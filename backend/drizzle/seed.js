import "dotenv/config";
import { db } from "../config/database.js";
import bcrypt from "bcryptjs";
import { users, tickets, comments } from "./schema.js";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  let admin = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@company.com"))
    .limit(1);
  if (!admin.length) {
    await db
      .insert(users)
      .values({
        email: "admin@company.com",
        name: "System Administrator",
        password: adminPassword,
        role: "ADMIN",
      });
    admin = await db.select().from(users).where(eq(users.email, "admin@company.com")).limit(1);
    admin = admin[0];
  } else {
    admin = admin[0];
  }

  // Create employee users
  const employee1Password = await bcrypt.hash("employee123", 10);
  let employee1 = await db
    .select()
    .from(users)
    .where(eq(users.email, "john@company.com"))
    .limit(1);
  if (!employee1.length) {
    await db
      .insert(users)
      .values({
        email: "john@company.com",
        name: "John Smith",
        password: employee1Password,
        role: "EMPLOYEE",
      });
    employee1 = await db.select().from(users).where(eq(users.email, "john@company.com")).limit(1);
    employee1 = employee1[0];
  } else {
    employee1 = employee1[0];
  }

  const employee2Password = await bcrypt.hash("employee123", 10);
  let employee2 = await db
    .select()
    .from(users)
    .where(eq(users.email, "sarah@company.com"))
    .limit(1);
  if (!employee2.length) {
    await db
      .insert(users)
      .values({
        email: "sarah@company.com",
        name: "Sarah Johnson",
        password: employee2Password,
        role: "EMPLOYEE",
      });
    employee2 = await db.select().from(users).where(eq(users.email, "sarah@company.com")).limit(1);
    employee2 = employee2[0];
  } else {
    employee2 = employee2[0];
  }

  // Create additional users
  const additionalUsers = [
    { email: "mike@company.com", name: "Mike Davis", role: "EMPLOYEE" },
    { email: "emily@company.com", name: "Emily Chen", role: "EMPLOYEE" },
    { email: "alex@company.com", name: "Alex Rodriguez", role: "EMPLOYEE" },
    { email: "lisa@company.com", name: "Lisa Thompson", role: "EMPLOYEE" },
    { email: "manager@company.com", name: "David Wilson", role: "ADMIN" },
    { email: "supervisor@company.com", name: "Jennifer Brown", role: "ADMIN" },
  ];

  for (const userData of additionalUsers) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);
    if (!existing.length) {
      const password = await bcrypt.hash(
        userData.role === "ADMIN" ? "admin123" : "employee123",
        10
      );
      await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        password,
        role: userData.role,
      });
    }
  }

  // Create sample tickets with due dates for testing reminders
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await db.insert(tickets).values([
    {
      title: "Email server not responding",
      description:
        "Customer reports that they cannot send emails. The email server appears to be down or not responding to requests.",
      priority: "HIGH",
      status: "OPEN",
      createdById: admin.id,
      assignedToId: employee1.id,
      dueDate: yesterday, // Overdue ticket
    },
    {
      title: "Website loading slowly",
      description:
        "Multiple customers have reported that the company website is loading very slowly, especially the product pages.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      createdById: admin.id,
      assignedToId: employee1.id,
      dueDate: yesterday, // Overdue ticket
    },
    {
      title: "Database backup failed",
      description:
        "The automated database backup process failed last night. Need to investigate and ensure data integrity.",
      priority: "URGENT",
      status: "OPEN",
      createdById: admin.id,
      assignedToId: employee2.id,
      dueDate: tomorrow, // Future due date
    },
    {
      title: "User account locked",
      description:
        "Customer cannot access their account. Account appears to be locked after multiple failed login attempts.",
      priority: "LOW",
      status: "RESOLVED",
      createdById: admin.id,
      assignedToId: employee2.id,
    }
  ]);

  const allTickets = await db.select().from(tickets);
  const ticket2 = allTickets.find(t => t.title === "Website loading slowly");
  const ticket4 = allTickets.find(t => t.title === "User account locked");

  // Create sample comments
  if (ticket2 && ticket4) {
    await db.insert(comments).values([
      {
        content:
          "I have started investigating this issue. Checking server logs now.",
        ticketId: ticket2.id,
        userId: employee1.id,
      },
      {
        content:
          "Found the issue - there was a memory leak in the image processing module. Deploying fix now.",
        ticketId: ticket2.id,
        userId: employee1.id,
      },
      {
        content:
          "Account has been unlocked and password reset email sent to customer.",
        ticketId: ticket4.id,
        userId: employee2.id,
      },
    ]);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
