-- Backfill existing workflows with random values for channel, version, locale, and creator if NULL
UPDATE workflows SET
  channel = (ARRAY['Web', 'Chatbot'])[floor(random() * 2 + 1)]
WHERE channel IS NULL;

UPDATE workflows SET
  version = floor(random() * 20 + 1)::int
WHERE version IS NULL;

UPDATE workflows SET
  locale = (ARRAY['en_US', 'en_GB', 'fr_FR', 'de_DE', 'es_ES'])[floor(random() * 5 + 1)]
WHERE locale IS NULL;

UPDATE workflows SET
  creator = (ARRAY['Hannah Belle', 'Matthew Stone', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson'])[floor(random() * 5 + 1)]
WHERE creator IS NULL; 