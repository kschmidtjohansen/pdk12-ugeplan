-- Populate case_number from title where it's NULL and title looks like a case number
UPDATE assignments 
SET case_number = title 
WHERE case_number IS NULL 
  AND title ~ '^[0-9]+-[0-9]+';

-- Log the migration
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % assignments with case numbers from title', updated_count;
END $$;