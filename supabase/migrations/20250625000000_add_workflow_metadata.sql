-- Add channel, version, locale, and creator columns to workflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'channel'
  ) THEN
    ALTER TABLE workflows ADD COLUMN channel text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'version'
  ) THEN
    ALTER TABLE workflows ADD COLUMN version integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'locale'
  ) THEN
    ALTER TABLE workflows ADD COLUMN locale text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'creator'
  ) THEN
    ALTER TABLE workflows ADD COLUMN creator text;
  END IF;
END $$; 