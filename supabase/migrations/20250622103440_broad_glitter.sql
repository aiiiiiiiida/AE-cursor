/*
  # Fix RLS policies for anonymous users

  1. Security Changes
    - Update activity_templates policies to allow anonymous users
    - Update workflows policies to allow anonymous users
    - This enables development without authentication setup

  Note: In production, you should implement proper authentication
  and restrict these policies to authenticated users only.
*/

-- Drop existing policies for activity_templates
DROP POLICY IF EXISTS "Users can create activity templates" ON activity_templates;
DROP POLICY IF EXISTS "Users can delete activity templates" ON activity_templates;
DROP POLICY IF EXISTS "Users can read all activity templates" ON activity_templates;
DROP POLICY IF EXISTS "Users can update activity templates" ON activity_templates;

-- Create new policies for activity_templates that allow anonymous access
CREATE POLICY "Allow anonymous read access to activity templates"
  ON activity_templates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anonymous insert access to activity templates"
  ON activity_templates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to activity templates"
  ON activity_templates
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to activity templates"
  ON activity_templates
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing policies for workflows
DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete workflows" ON workflows;
DROP POLICY IF EXISTS "Users can read all workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update workflows" ON workflows;

-- Create new policies for workflows that allow anonymous access
CREATE POLICY "Allow anonymous read access to workflows"
  ON workflows
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anonymous insert access to workflows"
  ON workflows
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to workflows"
  ON workflows
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to workflows"
  ON workflows
  FOR DELETE
  TO anon, authenticated
  USING (true);