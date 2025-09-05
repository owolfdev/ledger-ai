-- Add streaming service vendor mappings to the database
-- These will have high priority (0.95 confidence) and override generic patterns

INSERT INTO vendor_mappings (vendor_name, vendor_pattern, account_path, account_type, business_context, is_active, created_at, updated_at)
VALUES 
  -- Netflix
  ('netflix', 'netflix', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Spotify
  ('spotify', 'spotify', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- YouTube Premium
  ('youtube premium', 'youtube\\s*premium|youtube\\s*red', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Disney+
  ('disney plus', 'disney\\s*plus|disney\\+', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Apple Music
  ('apple music', 'apple\\s*music', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Amazon Prime Video
  ('amazon prime', 'amazon\\s*prime|prime\\s*video', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- HBO Max
  ('hbo max', 'hbo\\s*max|hbo\\+', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Hulu
  ('hulu', 'hulu', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Twitch
  ('twitch', 'twitch', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW()),
  
  -- Patreon
  ('patreon', 'patreon', 'Expenses:Personal:Subscription:Entertainment', 'expense', 'Personal', true, NOW(), NOW());

-- Verify the insertions
SELECT vendor_name, account_path, account_type, is_active 
FROM vendor_mappings 
WHERE vendor_name IN ('netflix', 'spotify', 'youtube premium', 'disney plus', 'apple music', 'amazon prime', 'hbo max', 'hulu', 'twitch', 'patreon')
ORDER BY vendor_name;
