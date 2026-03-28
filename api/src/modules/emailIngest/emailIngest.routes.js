import express from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { runEmailIngest } from '../../utils/emailIngest.js';

const router = express.Router();

// GET /email-ingest/settings — return current config (no passwords)
router.get('/settings', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    enabled:         process.env.EMAIL_INGEST_ENABLED === 'true',
    host:            process.env.EMAIL_INGEST_HOST || '',
    port:            process.env.EMAIL_INGEST_PORT || '993',
    secure:          process.env.EMAIL_INGEST_SECURE !== 'false',
    user:            process.env.EMAIL_INGEST_USER || '',
    intervalMinutes: process.env.EMAIL_INGEST_INTERVAL_MINUTES || '5',
  });
});

// POST /email-ingest/run-now — manually trigger ingestion
router.post('/run-now', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await runEmailIngest(req.emitNotification);
    res.json({ message: 'Email ingestion completed. Check server logs for details.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
