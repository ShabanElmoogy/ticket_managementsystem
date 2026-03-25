-- 1. Extend user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PROGRAMMER';

-- 2. Extend ticket_status enum
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'PROGRAMMING';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'UNDER_DEVELOPMENT';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'CODE_REVIEW';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'TESTING';

-- 3. Add programmer_id column to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS programmer_id uuid REFERENCES users(id);

-- 4. Create programming_details table
CREATE TABLE IF NOT EXISTS programming_details (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id             uuid NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  programmer_id         uuid REFERENCES users(id),
  technical_description text,
  root_cause            text,
  steps_to_reproduce    text,
  solution_steps        jsonb DEFAULT '[]',
  code_snippets         jsonb DEFAULT '[]',
  attachments           jsonb DEFAULT '[]',
  estimated_hours       real,
  actual_hours          real,
  created_at            timestamp DEFAULT now(),
  updated_at            timestamp DEFAULT now()
);

-- 5. Extend activity_action enum
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'PROGRAMMER_ASSIGNED';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'PROGRAMMING_UPDATED';
