/*
  # Create Leads Table for ParkLine Residences Contact Form

  ## Overview
  This migration creates a secure leads management system for storing contact form submissions
  from the ParkLine Residences apartment visualization website.

  ## 1. New Tables
    - `leads`
      - `id` (uuid, primary key) - Unique identifier for each lead
      - `name` (text, required) - Full name of the contact
      - `email` (text, required) - Email address of the contact
      - `phone` (text, optional) - Phone number of the contact
      - `message` (text, required) - Message or inquiry from the contact
      - `apartment_id` (text, optional) - Apartment ID of interest (e.g., "1.5", "DP1")
      - `status` (text, default 'new') - Lead status (new, contacted, qualified, closed)
      - `created_at` (timestamptz, default now()) - Timestamp when lead was created
      - `updated_at` (timestamptz, default now()) - Timestamp when lead was last updated

  ## 2. Security
    - Enable Row Level Security (RLS) on `leads` table
    - Add policy for anonymous users to insert their own leads (contact form submission)
    - Add policy for authenticated users to view all leads (for CRM access)
    - Add policy for authenticated users to update lead status (for CRM management)

  ## 3. Indexes
    - Create index on email for faster lookups
    - Create index on status for filtering
    - Create index on created_at for sorting

  ## 4. Important Notes
    - Data integrity is prioritized with NOT NULL constraints on required fields
    - RLS ensures that anonymous users can only submit leads, not view them
    - Only authenticated users (CRM staff) can view and manage leads
    - Timestamps are automatically managed with triggers
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  apartment_id text,
  status text DEFAULT 'new' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_apartment_id ON leads(apartment_id) WHERE apartment_id IS NOT NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON leads;
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (including anonymous users) to insert leads via contact form
CREATE POLICY "Anyone can submit leads"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can view leads (for CRM access)
CREATE POLICY "Authenticated users can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update lead status and notes
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only authenticated users can delete leads (if needed)
CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);
