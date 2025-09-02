-- Add asset patterns to account_patterns table
-- These patterns will be used when --type asset is specified

-- ELECTRONICS & COMPUTERS
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
-- Computers & Laptops
('exact', 'laptop', 'Assets:Electronics:Computer', 'asset', NULL, 90, true),
('exact', 'computer', 'Assets:Electronics:Computer', 'asset', NULL, 90, true),
('exact', 'desktop', 'Assets:Electronics:Computer', 'asset', NULL, 85, true),
('exact', 'macbook', 'Assets:Electronics:Computer', 'asset', NULL, 95, true),
('exact', 'pc', 'Assets:Electronics:Computer', 'asset', NULL, 85, true),
('exact', 'notebook', 'Assets:Electronics:Computer', 'asset', NULL, 80, true),
('exact', 'ultrabook', 'Assets:Electronics:Computer', 'asset', NULL, 75, true),

-- Mobile Devices
('exact', 'phone', 'Assets:Electronics:Phone', 'asset', NULL, 90, true),
('exact', 'iphone', 'Assets:Electronics:Phone', 'asset', NULL, 95, true),
('exact', 'android', 'Assets:Electronics:Phone', 'asset', NULL, 85, true),
('exact', 'mobile', 'Assets:Electronics:Phone', 'asset', NULL, 80, true),
('exact', 'tablet', 'Assets:Electronics:Tablet', 'asset', NULL, 85, true),
('exact', 'ipad', 'Assets:Electronics:Tablet', 'asset', NULL, 90, true),

-- Audio Equipment
('exact', 'headphone', 'Assets:Electronics:Audio', 'asset', NULL, 80, true),
('exact', 'earbud', 'Assets:Electronics:Audio', 'asset', NULL, 80, true),
('exact', 'speaker', 'Assets:Electronics:Audio', 'asset', NULL, 75, true),
('exact', 'bluetooth', 'Assets:Electronics:Audio', 'asset', NULL, 70, true),
('exact', 'airpods', 'Assets:Electronics:Audio', 'asset', NULL, 85, true),

-- VEHICLES
('exact', 'car', 'Assets:Vehicle:Car', 'asset', NULL, 95, true),
('exact', 'vehicle', 'Assets:Vehicle:Car', 'asset', NULL, 90, true),
('exact', 'automobile', 'Assets:Vehicle:Car', 'asset', NULL, 85, true),
('exact', 'motorcycle', 'Assets:Vehicle:Motorcycle', 'asset', NULL, 90, true),
('exact', 'bike', 'Assets:Vehicle:Bicycle', 'asset', NULL, 80, true),
('exact', 'bicycle', 'Assets:Vehicle:Bicycle', 'asset', NULL, 80, true),

-- FURNITURE & OFFICE
('exact', 'furniture', 'Assets:Furniture:General', 'asset', NULL, 80, true),
('exact', 'desk', 'Assets:Furniture:Office', 'asset', NULL, 85, true),
('exact', 'chair', 'Assets:Furniture:Office', 'asset', NULL, 85, true),
('exact', 'table', 'Assets:Furniture:General', 'asset', NULL, 80, true),
('exact', 'sofa', 'Assets:Furniture:Living', 'asset', NULL, 80, true),
('exact', 'bed', 'Assets:Furniture:Bedroom', 'asset', NULL, 85, true),

-- EQUIPMENT & TOOLS
('exact', 'equipment', 'Assets:Equipment:General', 'asset', NULL, 75, true),
('exact', 'machinery', 'Assets:Equipment:Industrial', 'asset', NULL, 80, true),
('exact', 'tools', 'Assets:Equipment:Tools', 'asset', NULL, 75, true),
('exact', 'camera', 'Assets:Electronics:Camera', 'asset', NULL, 85, true),
('exact', 'drone', 'Assets:Electronics:Camera', 'asset', NULL, 80, true),

-- REAL ESTATE
('exact', 'house', 'Assets:RealEstate:Residential', 'asset', NULL, 95, true),
('exact', 'home', 'Assets:RealEstate:Residential', 'asset', NULL, 95, true),
('exact', 'apartment', 'Assets:RealEstate:Residential', 'asset', NULL, 90, true),
('exact', 'condo', 'Assets:RealEstate:Residential', 'asset', NULL, 90, true),
('exact', 'land', 'Assets:RealEstate:Land', 'asset', NULL, 95, true),
('exact', 'property', 'Assets:RealEstate:General', 'asset', NULL, 85, true);

-- Test the patterns
SELECT 
  pattern_type,
  pattern,
  account_path,
  account_type,
  priority
FROM account_patterns 
WHERE account_type = 'asset'
ORDER BY priority DESC, pattern;
