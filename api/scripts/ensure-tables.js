import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

const tables = await sql`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN ('ticket_watchers', 'ticket_templates')
`;
console.log('Existing tables:', tables.map(t => t.table_name));

if (!tables.find(t => t.table_name === 'ticket_watchers')) {
  console.log('Creating ticket_watchers...');
  await sql`
    CREATE TABLE "ticket_watchers" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "ticket_id" uuid NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "ticket_watchers_ticket_id_user_id_unique" UNIQUE("ticket_id","user_id")
    )
  `;
  console.log('ticket_watchers created.');
}

if (!tables.find(t => t.table_name === 'ticket_templates')) {
  console.log('Creating ticket_templates...');
  await sql`
    CREATE TABLE "ticket_templates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "description" text,
      "priority" text NOT NULL DEFAULT 'MEDIUM',
      "estimated_hours" real,
      "created_by_id" uuid NOT NULL REFERENCES "users"("id"),
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `;
  console.log('ticket_templates created.');
}

await sql.end();
