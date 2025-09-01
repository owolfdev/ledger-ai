-- Run the account mappings migration
\i scripts/expand-account-mappings.sql

-- Test the patterns
SELECT 
  pattern_type,
  pattern,
  account_path,
  business_context,
  priority
FROM account_patterns 
WHERE pattern IN ('coffee', 'croissant', 'pastry')
ORDER BY priority DESC, pattern_type;

-- Test business context patterns
SELECT 
  pattern_type,
  pattern,
  account_path,
  business_context,
  priority
FROM account_patterns 
WHERE business_context = 'Channel60'
ORDER BY priority DESC;
