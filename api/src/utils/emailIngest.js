import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { db } from '../config/database.js';
import { tickets } from '../modules/tickets/tickets.schema.js';
import { users } from '../modules/users/users.schema.js';
import { customers } from '../modules/customers/customers.schema.js';
import { tenants } from '../modules/tenants/tenants.schema.js';
import { eq, and } from 'drizzle-orm';
import { logActivityAndNotify } from './activityUtils.js';
import { getSlaHours, computeSlaDeadline } from './slaUtils.js';

let pollerInterval = null;
let isRunning = false;

const getConfig = () => ({
  enabled:         process.env.EMAIL_INGEST_ENABLED === 'true',
  host:            process.env.EMAIL_INGEST_HOST || '',
  port:            parseInt(process.env.EMAIL_INGEST_PORT || '993'),
  secure:          process.env.EMAIL_INGEST_SECURE !== 'false',
  user:            process.env.EMAIL_INGEST_USER || '',
  password:        process.env.EMAIL_INGEST_PASSWORD || '',
  intervalMinutes: parseInt(process.env.EMAIL_INGEST_INTERVAL_MINUTES || '5'),
});

const resolveTenant = async (toAddresses) => {
  // 1. Match by supportEmail set on tenant
  for (const addr of toAddresses) {
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.supportEmail, addr.toLowerCase()))
      .limit(1);
    if (tenant) return tenant;
  }
  // 2. Match by EMAIL_INGEST_USER — the mailbox itself belongs to a tenant
  const ingestUser = (process.env.EMAIL_INGEST_USER || '').toLowerCase();
  if (ingestUser && toAddresses.includes(ingestUser)) {
    const all = await db.select({ id: tenants.id }).from(tenants).limit(2);
    if (all.length === 1) return all[0];
  }
  // 3. Fallback: if only one tenant exists, use it
  const all = await db.select({ id: tenants.id }).from(tenants).limit(2);
  return all.length === 1 ? all[0] : null;
};

export const runEmailIngest = async (emitNotification) => {
  const cfg = getConfig();
  if (!cfg.enabled || !cfg.host || !cfg.user || !cfg.password) return;
  if (isRunning) return;
  isRunning = true;

  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
    tls: { rejectUnauthorized: false, servername: cfg.host },
    logger: false,
    disableAutoIdle: true,
    socketTimeout: 30000,
  });

  // Prevent unhandled error event from crashing the server
  client.on('error', (err) => {
    console.error('[EmailIngest] IMAP client error:', err.message);
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const uids = await client.search({ seen: false }, { uid: true });

      if (!uids || uids.length === 0) {
        // nothing to process
      } else {
        for await (const msg of client.fetch(uids, { envelope: true, source: true }, { uid: true })) {
          try {
            const parsed = await simpleParser(msg.source);
            const messageId = parsed.messageId || `msg-${msg.uid}`;
            const fromEmail = parsed.from?.value?.[0]?.address || '';
            const subject   = parsed.subject || '(No Subject)';
            const toAddresses = (parsed.to?.value || []).map((a) => a.address?.toLowerCase()).filter(Boolean);

            const [existing] = await db
              .select({ id: tickets.id })
              .from(tickets)
              .where(eq(tickets.emailMessageId, messageId))
              .limit(1);
            if (existing) { continue; } // already imported

            const fromName = parsed.from?.value?.[0]?.name || fromEmail;
            const body     = parsed.text || parsed.html?.replace(/<[^>]+>/g, '') || '';

            const tenant = await resolveTenant(toAddresses);
            if (!tenant) { continue; } // no tenant matched this recipient — not a support email

            const [adminUser] = await db
              .select({ id: users.id })
              .from(users)
              .where(and(eq(users.tenantId, tenant.id), eq(users.role, 'TENANT_ADMIN')))
              .limit(1);
            if (!adminUser) {
              console.warn('[EmailIngest] No TENANT_ADMIN for tenant:', tenant.id);
              continue;
            }

            const [matchedCustomer] = await db
              .select({ id: customers.id })
              .from(customers)
              .where(and(eq(customers.email, fromEmail), eq(customers.tenantId, tenant.id)))
              .limit(1);

            const slaHours = await getSlaHours(tenant.id);
            const slaDeadline = computeSlaDeadline(new Date(), 'MEDIUM', slaHours);

            const [ticket] = await db
              .insert(tickets)
              .values({
                title: subject.slice(0, 200),
                description: `From: ${fromName} <${fromEmail}>\n\n${body.slice(0, 5000)}`,
                priority: 'MEDIUM',
                status: 'OPEN',
                createdById: adminUser.id,
                customerId: matchedCustomer?.id || null,
                emailMessageId: messageId,
                emailFrom: fromEmail,
                slaDeadline,
              })
              .returning({ id: tickets.id, title: tickets.title });

            await logActivityAndNotify({
              ticketId:    ticket.id,
              actorId:     adminUser.id,
              action:      'CREATED',
              description: `Ticket created from email: ${fromEmail}`,
              tenantId:    tenant.id,
            });

            await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], { uid: true });

            const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenant.id));
            const notifPayload = {
              type: 'TICKET_CREATED',
              data: { ticket: { id: ticket.id, title: ticket.title }, createdBy: `Email: ${fromEmail}` },
            };
            tenantUsers.forEach(({ id }) => emitNotification?.(id, notifPayload));
            // Also broadcast so any connected user in this tenant sees it
            emitNotification?.('broadcast', notifPayload);
          } catch (msgErr) {
            console.error('[EmailIngest] Error processing message:', msgErr.message);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout().catch(() => {});
  } catch (err) {
    console.error('[EmailIngest] Connection error:', err.message);
    if (err.response) console.error('[EmailIngest] Server response:', err.response);
    try { client.close(); } catch (_) {}
  } finally {
    isRunning = false;
  }
};

export const startEmailIngestScheduler = (emitNotification) => {
  const cfg = getConfig();
  if (!cfg.enabled) return;

  const ms = cfg.intervalMinutes * 60 * 1000;
  pollerInterval = setInterval(() => runEmailIngest(emitNotification).catch((e) => console.error('[EmailIngest] Scheduler error:', e.message)), ms);

  runEmailIngest(emitNotification).catch((e) => console.error('[EmailIngest] Initial run error:', e.message));
};

export const stopEmailIngestScheduler = () => {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
};
