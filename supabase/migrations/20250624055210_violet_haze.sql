/*
  # Add category column to activity_templates table

  1. Changes
    - Add category column to activity_templates table
    - Set default value to 'Workflow' for backward compatibility
    - Update existing records to have appropriate categories

  2. Security
    - No changes to RLS policies needed
*/

-- Add category column to activity_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_templates' AND column_name = 'category'
  ) THEN
    ALTER TABLE activity_templates ADD COLUMN category text DEFAULT 'Workflow'::text NOT NULL;
  END IF;
END $$;

-- Update existing templates with appropriate categories
UPDATE activity_templates 
SET category = CASE 
  WHEN name ILIKE '%mail%' OR name ILIKE '%email%' OR name ILIKE '%message%' OR name ILIKE '%notification%' THEN 'Communication'
  WHEN name ILIKE '%trigger%' OR name ILIKE '%start%' THEN 'Workflow'
  ELSE 'Workflow'
END
WHERE category = 'Workflow';