ALTER TABLE tenants ADD COLUMN IF NOT EXISTS escalation_interval_minutes integer NOT NULL DEFAULT 60;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_escalated_at timestamp;
