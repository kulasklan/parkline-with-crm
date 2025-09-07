/*
  # Complete CRM System Database Schema

  1. New Tables
    - `crm_users` - CRM system users (sales managers, agents)
    - `lead_notes` - Notes and comments on leads
    - `lead_assignments` - Lead assignment tracking
    - `lead_activities` - Activity log for leads
    - `crm_settings` - System configuration

  2. Enhanced Tables
    - Update `leads` table with additional CRM fields
    - Add indexes for better performance

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for CRM access
    - Secure user management policies

  4. Functions
    - Auto-assign leads function
    - Activity logging triggers
*/

-- Create CRM users table
CREATE TABLE IF NOT EXISTS crm_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
  is_active boolean DEFAULT true,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  created_by uuid REFERENCES crm_users(id)
);

-- Add additional fields to leads table
DO $$
BEGIN
  -- Add assigned_to field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_to uuid REFERENCES crm_users(id);
  END IF;

  -- Add priority field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'priority'
  ) THEN
    ALTER TABLE leads ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  -- Add source field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source'
  ) THEN
    ALTER TABLE leads ADD COLUMN source text DEFAULT 'website';
  END IF;

  -- Add follow_up_date field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'follow_up_date'
  ) THEN
    ALTER TABLE leads ADD COLUMN follow_up_date timestamptz;
  END IF;

  -- Add tags field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'tags'
  ) THEN
    ALTER TABLE leads ADD COLUMN tags text[];
  END IF;

  -- Add updated_at field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Update status field to include more options
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
  ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'follow_up'));
END $$;

-- Create lead notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES crm_users(id),
  note_text text NOT NULL,
  note_type text DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'follow_up', 'internal')),
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lead assignments table
CREATE TABLE IF NOT EXISTS lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES crm_users(id),
  assigned_by uuid NOT NULL REFERENCES crm_users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  notes text
);

-- Create lead activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES crm_users(id),
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'updated', 'assigned', 'note_added', 'status_changed', 'contacted', 'follow_up_scheduled')),
  description text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create CRM settings table
CREATE TABLE IF NOT EXISTS crm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_settings ENABLE ROW LEVEL SECURITY;

-- CRM Users policies
CREATE POLICY "CRM users can read all users"
  ON crm_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage users"
  ON crm_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON crm_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Lead notes policies
CREATE POLICY "CRM users can read lead notes"
  ON lead_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "CRM users can create notes"
  ON lead_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update own notes"
  ON lead_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Lead assignments policies
CREATE POLICY "CRM users can read assignments"
  ON lead_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can create assignments"
  ON lead_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

-- Lead activities policies
CREATE POLICY "CRM users can read activities"
  ON lead_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "System can create activities"
  ON lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- CRM settings policies
CREATE POLICY "CRM users can read settings"
  ON crm_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage settings"
  ON crm_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Update leads table policies for CRM access
DROP POLICY IF EXISTS "CRM users can read all leads" ON leads;
CREATE POLICY "CRM users can read all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "CRM users can update leads" ON leads;
CREATE POLICY "CRM users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);

-- Create function to automatically log activities
CREATE OR REPLACE FUNCTION log_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO lead_activities (lead_id, activity_type, description, old_value, new_value)
    VALUES (
      NEW.id,
      'status_changed',
      'Lead status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
      to_jsonb(OLD.status),
      to_jsonb(NEW.status)
    );
  END IF;

  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO lead_activities (lead_id, activity_type, description, old_value, new_value)
    VALUES (
      NEW.id,
      'assigned',
      'Lead assigned to ' || COALESCE((SELECT full_name FROM crm_users WHERE id = NEW.assigned_to), 'unassigned'),
      to_jsonb(OLD.assigned_to),
      to_jsonb(NEW.assigned_to)
    );
  END IF;

  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO lead_activities (lead_id, activity_type, description)
    VALUES (
      NEW.id,
      'created',
      'Lead created from ' || COALESCE(NEW.source, 'unknown source')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic activity logging
DROP TRIGGER IF EXISTS trigger_log_lead_activity ON leads;
CREATE TRIGGER trigger_log_lead_activity
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_activity();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON leads;
CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_crm_users_updated_at ON crm_users;
CREATE TRIGGER trigger_update_crm_users_updated_at
  BEFORE UPDATE ON crm_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_lead_notes_updated_at ON lead_notes;
CREATE TRIGGER trigger_update_lead_notes_updated_at
  BEFORE UPDATE ON lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default CRM settings
INSERT INTO crm_settings (setting_key, setting_value, description) VALUES
  ('auto_assign_leads', '"true"', 'Automatically assign new leads to available agents'),
  ('lead_follow_up_days', '3', 'Default days for follow-up reminders'),
  ('max_leads_per_agent', '50', 'Maximum leads per agent before auto-assignment stops'),
  ('business_hours_start', '"09:00"', 'Business hours start time'),
  ('business_hours_end', '"17:00"', 'Business hours end time'),
  ('email_notifications', '"true"', 'Send email notifications for new leads')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample CRM admin user (you'll need to update this with real data)
INSERT INTO crm_users (email, full_name, role, is_active) VALUES
  ('admin@izostone.mk', 'CRM Administrator', 'admin', true),
  ('sales@izostone.mk', 'Sales Manager', 'manager', true),
  ('agent1@izostone.mk', 'Sales Agent 1', 'agent', true)
ON CONFLICT (email) DO NOTHING;