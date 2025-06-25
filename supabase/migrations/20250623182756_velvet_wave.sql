/*
  # Add trigger metadata column to workflows table

  1. Changes
    - Add trigger_metadata column to workflows table to store trigger configuration
    - Set default value to empty JSON object
    - Allow null values for backward compatibility

  2. Security
    - No changes to RLS policies needed
*/

-- Add trigger_metadata column to workflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflows' AND column_name = 'trigger_metadata'
  ) THEN
    ALTER TABLE workflows ADD COLUMN trigger_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;