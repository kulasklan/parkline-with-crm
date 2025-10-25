/*
  # Create Analytics Events Table

  1. New Tables
    - `analytics_events`
      - `id` (uuid, primary key) - Unique identifier for each event
      - `event_type` (text) - Type of event (e.g., page_load, apartment_click, filter_change)
      - `session_id` (text) - Session identifier for tracking user sessions
      - `visitor_id` (text) - Visitor identifier for tracking across sessions
      - `event_data` (jsonb) - Flexible JSON data for event-specific information
      - `created_at` (timestamptz) - Timestamp when the event was created

  2. Indexes
    - Index on `event_type` for fast filtering by event type
    - Index on `session_id` for session-based queries
    - Index on `visitor_id` for visitor-based analytics
    - Index on `created_at` for time-based queries

  3. Security
    - Enable RLS on `analytics_events` table
    - Add policy to allow anonymous users to insert events (public analytics)
    - Add policy to allow authenticated users to read all events (admin access)

  4. Notes
    - This table tracks user interactions for analytics purposes
    - Anonymous inserts allow tracking without authentication
    - JSONB format provides flexibility for different event types
*/

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous users to insert analytics events"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read all analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (true);