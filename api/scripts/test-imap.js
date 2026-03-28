import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
dotenv.config();

const client = new ImapFlow({
  host: process.env.EMAIL_INGEST_HOST || 'imap.gmail.com',
  port: parseInt(process.env.EMAIL_INGEST_PORT || '993'),
  secure: process.env.EMAIL_INGEST_SECURE !== 'false',
  auth: {
    user: process.env.EMAIL_INGEST_USER,
    pass: process.env.EMAIL_INGEST_PASSWORD,
  },
  tls: {
    servername: process.env.EMAIL_INGEST_HOST || 'imap.gmail.com',
    rejectUnauthorized: false,
  },
  logger: false,
});

console.log(`Testing IMAP connection to ${process.env.EMAIL_INGEST_HOST}:${process.env.EMAIL_INGEST_PORT}`);
console.log(`User: ${process.env.EMAIL_INGEST_USER}`);

try {
  await client.connect();
  console.log('CONNECTED ✅');

  const lock = await client.getMailboxLock('INBOX');
  try {
    const status = await client.status('INBOX', { messages: true, unseen: true });
    console.log(`INBOX — Total: ${status.messages}, Unseen: ${status.unseen} ✅`);
  } finally {
    lock.release();
  }

  await client.logout();
  console.log('LOGOUT ✅ — Email ingest is ready to use.');
} catch (err) {
  console.error('FAILED ❌:', err.message);
  if (err.response) console.error('Server response:', JSON.stringify(err.response, null, 2));
  process.exit(1);
}
