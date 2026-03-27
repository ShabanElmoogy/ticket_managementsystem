/**
 * add-programmer.js
 *
 * Creates a PROGRAMMER user under a specific tenant.
 *
 * Usage:
 *   node scripts/add-programmer.js <email> <name> <password> <tenantSlug>
 *
 * Examples:
 *   node scripts/add-programmer.js dev@acme.com "Ali Hassan" pass123 acme
 *   node scripts/add-programmer.js  (interactive prompts)
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import { db } from '../src/config/database.js';
import { users } from '../src/modules/users/users.schema.js';
import { tenants } from '../src/modules/tenants/tenants.schema.js';
import { eq, and } from 'drizzle-orm';

// ─── helpers ────────────────────────────────────────────────────────────────

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function promptPassword(rl, question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    // hide input on TTY
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    let input = '';
    const onData = (ch) => {
      ch = ch.toString();
      if (ch === '\n' || ch === '\r' || ch === '\u0003') {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdout.write('\n');
        process.stdin.removeListener('data', onData);
        resolve(input);
      } else if (ch === '\u007f') {
        input = input.slice(0, -1);
      } else {
        input += ch;
        process.stdout.write('*');
      }
    };
    if (process.stdin.isTTY) {
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      // non-TTY (piped input) — just read normally
      rl.question('', resolve);
    }
  });
}

function ok(msg)   { console.log(`\x1b[32m✔\x1b[0m  ${msg}`); }
function err(msg)  { console.error(`\x1b[31m✖\x1b[0m  ${msg}`); }
function info(msg) { console.log(`\x1b[36mℹ\x1b[0m  ${msg}`); }

// ─── main ────────────────────────────────────────────────────────────────────

async function run() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  let [,, emailArg, nameArg, passwordArg, tenantSlugArg] = process.argv;

  console.log('\n\x1b[1m── Add Programmer ──────────────────────────────────\x1b[0m\n');

  // ── 1. Collect inputs ──────────────────────────────────────────────────────
  const email      = emailArg      || await prompt(rl, 'Email:          ');
  const name       = nameArg       || await prompt(rl, 'Full name:      ');
  const tenantSlug = tenantSlugArg || await prompt(rl, 'Tenant slug:    ');
  const password   = passwordArg   || await promptPassword(rl, 'Password:       ');

  rl.close();

  // ── 2. Validate ────────────────────────────────────────────────────────────
  const missing = [];
  if (!email.trim())      missing.push('email');
  if (!name.trim())       missing.push('name');
  if (!tenantSlug.trim()) missing.push('tenantSlug');
  if (!password.trim())   missing.push('password');

  if (missing.length) {
    err(`Missing required fields: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    err('Invalid email address.');
    process.exit(1);
  }

  if (password.length < 6) {
    err('Password must be at least 6 characters.');
    process.exit(1);
  }

  // ── 3. Resolve tenant ──────────────────────────────────────────────────────
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug.trim()))
    .limit(1);

  if (!tenant) {
    err(`Tenant with slug "${tenantSlug}" not found.`);
    info('Available tenants:');
    const all = await db.select({ slug: tenants.slug, name: tenants.name }).from(tenants);
    if (all.length === 0) {
      info('  (no tenants in database)');
    } else {
      all.forEach(t => info(`  • ${t.slug}  (${t.name})`));
    }
    process.exit(1);
  }

  info(`Tenant: ${tenant.name} (${tenant.id})`);

  // ── 4. Check duplicate email within tenant ─────────────────────────────────
  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.email, email.trim()), eq(users.tenantId, tenant.id)))
    .limit(1);

  if (existing) {
    if (existing.role === 'PROGRAMMER') {
      err(`A PROGRAMMER with email "${email}" already exists in this tenant.`);
    } else {
      err(`A user with email "${email}" already exists in this tenant (role: ${existing.role}).`);
      info('Use scripts/reset-password.js to change their password, or choose a different email.');
    }
    process.exit(1);
  }

  // ── 5. Create user ─────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      email:    email.trim(),
      name:     name.trim(),
      password: hashedPassword,
      role:     'PROGRAMMER',
    })
    .returning({
      id:        users.id,
      email:     users.email,
      name:      users.name,
      role:      users.role,
      tenantId:  users.tenantId,
      createdAt: users.createdAt,
    });

  console.log('');
  ok('Programmer created successfully!\n');
  console.table([{
    id:       created.id,
    name:     created.name,
    email:    created.email,
    role:     created.role,
    tenant:   tenant.name,
    tenantId: created.tenantId,
  }]);
  console.log('');
}

run()
  .catch(e => {
    err(`Unexpected error: ${e.message}`);
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
