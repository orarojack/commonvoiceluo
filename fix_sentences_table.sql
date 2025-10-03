-- Fix sentences table field size constraint
-- Run this in Supabase SQL Editor

-- Increase the mozilla_id field size from VARCHAR(50) to VARCHAR(255)
ALTER TABLE sentences ALTER COLUMN mozilla_id TYPE VARCHAR(255);

-- Also increase bucket and hash field sizes to be safe
ALTER TABLE sentences ALTER COLUMN bucket TYPE VARCHAR(255);
ALTER TABLE sentences ALTER COLUMN hash TYPE VARCHAR(255);

-- Update the constraint to reflect the new size
ALTER TABLE sentences DROP CONSTRAINT IF EXISTS sentences_mozilla_id_key;
ALTER TABLE sentences ADD CONSTRAINT sentences_pkey_new UNIQUE (id);

SELECT 'Sentences table fixed - ready for Mozilla data!' as status;
