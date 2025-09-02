-- Add Kaha Srisuk Company to business_contexts table
-- This will make it a known business for consistent account mapping

INSERT INTO business_contexts (business_name, default_account_type, is_active) 
VALUES ('Kaha Srisuk Company', 'expense', true)
ON CONFLICT (business_name) DO UPDATE SET
  default_account_type = EXCLUDED.default_account_type,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verify the insertion
SELECT * FROM business_contexts WHERE business_name = 'Kaha Srisuk Company';
