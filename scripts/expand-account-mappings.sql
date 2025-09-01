-- Expand account_patterns table with comprehensive tag-based mappings
-- Run this after the initial migration to add more granular categorization

-- Clear existing patterns to avoid duplicates (optional - comment out if you want to keep existing)
-- DELETE FROM account_patterns WHERE pattern_type = 'exact';

-- FOOD & BEVERAGES
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
-- Coffee & Beverages
('exact', 'coffee', 'Expenses:Food:Coffee', 'expense', NULL, 90, true),
('exact', 'bubble-tea', 'Expenses:Food:BubbleTea', 'expense', NULL, 85, true),
('exact', 'coconut-water', 'Expenses:Food:Beverages', 'expense', NULL, 75, true),
('exact', 'smoothie', 'Expenses:Food:Beverages', 'expense', NULL, 70, true),
('exact', 'beer', 'Expenses:Food:Alcohol', 'expense', NULL, 65, true),
('exact', 'wine', 'Expenses:Food:Alcohol', 'expense', NULL, 60, true),

-- Thai Food
('exact', 'pad-thai', 'Expenses:Food:ThaiFood', 'expense', NULL, 80, true),
('exact', 'som-tam', 'Expenses:Food:ThaiFood', 'expense', NULL, 75, true),
('exact', 'tom-yum', 'Expenses:Food:ThaiFood', 'expense', NULL, 75, true),
('exact', 'mango-sticky-rice', 'Expenses:Food:ThaiFood', 'expense', NULL, 70, true),

-- Food Venues
('exact', 'street-food', 'Expenses:Food:StreetFood', 'expense', NULL, 85, true),
('exact', 'food-court', 'Expenses:Food:FoodCourt', 'expense', NULL, 80, true),
('exact', 'restaurant', 'Expenses:Food:Restaurant', 'expense', NULL, 80, true),
('exact', 'takeout', 'Expenses:Food:Takeout', 'expense', NULL, 75, true),
('exact', 'cafe', 'Expenses:Food:Cafe', 'expense', NULL, 80, true),

-- Meals
('exact', 'breakfast', 'Expenses:Food:Breakfast', 'expense', NULL, 70, true),
('exact', 'lunch', 'Expenses:Food:Lunch', 'expense', NULL, 75, true),
('exact', 'dinner', 'Expenses:Food:Dinner', 'expense', NULL, 75, true),
('exact', 'meal', 'Expenses:Food:Meals', 'expense', NULL, 75, true),
('exact', 'snacks', 'Expenses:Food:Snacks', 'expense', NULL, 65, true),

-- Groceries & Markets
('exact', 'groceries', 'Expenses:Food:Groceries', 'expense', NULL, 85, true),
('exact', 'convenience-store', 'Expenses:Food:Convenience', 'expense', NULL, 90, true),
('exact', 'market', 'Expenses:Food:Market', 'expense', NULL, 75, true),
('exact', '7-eleven', 'Expenses:Food:Convenience', 'expense', NULL, 95, true),

-- Food Categories
('exact', 'bakery', 'Expenses:Food:Bakery', 'expense', NULL, 65, true),
('exact', 'dairy', 'Expenses:Food:Dairy', 'expense', NULL, 80, true),
('exact', 'grains', 'Expenses:Food:Grains', 'expense', NULL, 75, true),
('exact', 'pantry', 'Expenses:Food:Pantry', 'expense', NULL, 70, true),

-- Specific Foods
('exact', 'apples', 'Expenses:Food:Fruits', 'expense', NULL, 70, true),
('exact', 'cheese', 'Expenses:Food:Dairy', 'expense', NULL, 65, true),
('exact', 'citrus', 'Expenses:Food:Fruits', 'expense', NULL, 65, true),
('exact', 'yogurt', 'Expenses:Food:Dairy', 'expense', NULL, 70, true),
('exact', 'pasta', 'Expenses:Food:Grains', 'expense', NULL, 65, true),
('exact', 'rice', 'Expenses:Food:Grains', 'expense', NULL, 85, true),
('exact', 'noodles', 'Expenses:Food:Grains', 'expense', NULL, 80, true),
('exact', 'beef', 'Expenses:Food:Meat', 'expense', NULL, 70, true),
('exact', 'steak', 'Expenses:Food:Meat', 'expense', NULL, 60, true),
('exact', 'pork', 'Expenses:Food:Meat', 'expense', NULL, 75, true),
('exact', 'chicken', 'Expenses:Food:Meat', 'expense', NULL, 80, true),
('exact', 'fish', 'Expenses:Food:Seafood', 'expense', NULL, 70, true),
('exact', 'milk', 'Expenses:Food:Dairy', 'expense', NULL, 75, true),
('exact', 'eggs', 'Expenses:Food:Dairy', 'expense', NULL, 75, true),
('exact', 'bread', 'Expenses:Food:Bakery', 'expense', NULL, 70, true),
('exact', 'instant-noodles', 'Expenses:Food:Grains', 'expense', NULL, 75, true),
('exact', 'ice-cream', 'Expenses:Food:Desserts', 'expense', NULL, 75, true),
('exact', 'chocolate', 'Expenses:Food:Sweets', 'expense', NULL, 65, true),
('exact', 'crackers', 'Expenses:Food:Snacks', 'expense', NULL, 60, true),
('exact', 'cookies', 'Expenses:Food:Sweets', 'expense', NULL, 65, true),
('exact', 'chips', 'Expenses:Food:Snacks', 'expense', NULL, 65, true),
('exact', 'seaweed', 'Expenses:Food:Snacks', 'expense', NULL, 60, true),
('exact', 'oil', 'Expenses:Food:Pantry', 'expense', NULL, 70, true),
('exact', 'olive-oil', 'Expenses:Food:Pantry', 'expense', NULL, 60, true),
('exact', 'tomatoes', 'Expenses:Food:Vegetables', 'expense', NULL, 65, true),
('exact', 'tomato-sauce', 'Expenses:Food:Pantry', 'expense', NULL, 60, true),
('exact', 'mangos', 'Expenses:Food:Fruits', 'expense', NULL, 80, true),
('exact', 'bananas', 'Expenses:Food:Fruits', 'expense', NULL, 75, true),
('exact', 'grapes', 'Expenses:Food:Fruits', 'expense', NULL, 65, true),
('exact', 'berries', 'Expenses:Food:Fruits', 'expense', NULL, 60, true),
('exact', 'berry', 'Expenses:Food:Fruits', 'expense', NULL, 60, true),
('exact', 'jam', 'Expenses:Food:Pantry', 'expense', NULL, 65, true),
('exact', 'pastry', 'Expenses:Food:Bakery', 'expense', NULL, 70, true),
('exact', 'butter', 'Expenses:Food:Dairy', 'expense', NULL, 70, true),
('exact', 'candy', 'Expenses:Food:Sweets', 'expense', NULL, 60, true),
('exact', 'fruit', 'Expenses:Food:Fruits', 'expense', NULL, 70, true),
('exact', 'meat', 'Expenses:Food:Meat', 'expense', NULL, 70, true),

-- International Cuisine
('exact', 'japanese', 'Expenses:Food:Japanese', 'expense', NULL, 70, true),
('exact', 'korean', 'Expenses:Food:Korean', 'expense', NULL, 65, true),
('exact', 'western', 'Expenses:Food:Western', 'expense', NULL, 65, true),
('exact', 'chinese', 'Expenses:Food:Chinese', 'expense', NULL, 65, true),
('exact', 'indian', 'Expenses:Food:Indian', 'expense', NULL, 60, true),
('exact', 'sushi', 'Expenses:Food:Japanese', 'expense', NULL, 70, true),

-- TRANSPORTATION
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
-- Ride Sharing
('exact', 'grab', 'Expenses:Transportation:RideSharing', 'expense', NULL, 95, true),
('exact', 'grab-bike', 'Expenses:Transportation:RideSharing', 'expense', NULL, 90, true),
('exact', 'grab-car', 'Expenses:Transportation:RideSharing', 'expense', NULL, 85, true),

-- Local Transport
('exact', 'motorbike-taxi', 'Expenses:Transportation:Local', 'expense', NULL, 85, true),
('exact', 'taxi', 'Expenses:Transportation:Local', 'expense', NULL, 75, true),
('exact', 'tuk-tuk', 'Expenses:Transportation:Local', 'expense', NULL, 70, true),
('exact', 'motorbike', 'Expenses:Transportation:Personal', 'expense', NULL, 75, true),

-- Public Transport
('exact', 'bts', 'Expenses:Transportation:Public', 'expense', NULL, 90, true),
('exact', 'mrt', 'Expenses:Transportation:Public', 'expense', NULL, 85, true),
('exact', 'bus', 'Expenses:Transportation:Public', 'expense', NULL, 75, true),
('exact', 'boat', 'Expenses:Transportation:Public', 'expense', NULL, 70, true),
('exact', 'airport-link', 'Expenses:Transportation:Public', 'expense', NULL, 65, true),

-- Vehicle Expenses
('exact', 'gas', 'Expenses:Transportation:Fuel', 'expense', NULL, 80, true),
('exact', 'gasoline', 'Expenses:Transportation:Fuel', 'expense', NULL, 80, true),
('exact', 'parking', 'Expenses:Transportation:Parking', 'expense', NULL, 75, true),
('exact', 'toll', 'Expenses:Transportation:Tolls', 'expense', NULL, 65, true),
('exact', 'tollway', 'Expenses:Transportation:Tolls', 'expense', NULL, 65, true),
('exact', 'easypass', 'Expenses:Transportation:Tolls', 'expense', NULL, 70, true),
('exact', 'car-wash', 'Expenses:Transportation:Maintenance', 'expense', NULL, 50, true),
('exact', 'maintenance', 'Expenses:Transportation:Maintenance', 'expense', NULL, 55, true),
('exact', 'car', 'Expenses:Transportation:Personal', 'expense', NULL, 75, true),
('exact', 'automobile', 'Expenses:Transportation:Personal', 'expense', NULL, 70, true),
('exact', 'tires', 'Expenses:Transportation:Maintenance', 'expense', NULL, 60, true),
('exact', 'engine', 'Expenses:Transportation:Maintenance', 'expense', NULL, 65, true),

-- Travel
('exact', 'flight', 'Expenses:Transportation:Travel', 'expense', NULL, 60, true),
('exact', 'airline', 'Expenses:Transportation:Travel', 'expense', NULL, 60, true),
('exact', 'ticket', 'Expenses:Transportation:Travel', 'expense', NULL, 65, true),
('exact', 'hotel', 'Expenses:Transportation:Accommodation', 'expense', NULL, 55, true),
('exact', 'visa', 'Expenses:Transportation:Travel', 'expense', NULL, 45, true),

-- BUSINESS
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'coworking', 'Expenses:Business:OfficeSpace', 'expense', NULL, 70, true),
('exact', 'office-supplies', 'Expenses:Business:Supplies', 'expense', NULL, 60, true),
('exact', 'software', 'Expenses:Business:Software', 'expense', NULL, 75, true),
('exact', 'saas', 'Expenses:Business:Software', 'expense', NULL, 70, true),
('exact', 'client-lunch', 'Expenses:Business:Meals', 'expense', NULL, 65, true),
('exact', 'networking', 'Expenses:Business:Networking', 'expense', NULL, 60, true),
('exact', 'conference', 'Expenses:Business:Events', 'expense', NULL, 55, true),
('exact', 'training', 'Expenses:Business:Training', 'expense', NULL, 60, true),
('exact', 'books', 'Expenses:Business:Materials', 'expense', NULL, 50, true),
('exact', 'laptop', 'Expenses:Business:Equipment', 'expense', NULL, 65, true),
('exact', 'phone', 'Expenses:Business:Equipment', 'expense', NULL, 70, true),
('exact', 'internet', 'Expenses:Business:Utilities', 'expense', NULL, 80, true),
('exact', 'marketing', 'Expenses:Business:Marketing', 'expense', NULL, 55, true),
('exact', 'freelancer', 'Expenses:Business:Services', 'expense', NULL, 60, true),
('exact', 'consulting', 'Expenses:Business:Services', 'expense', NULL, 75, true),
('exact', 'lawyer', 'Expenses:Business:Legal', 'expense', NULL, 70, true),
('exact', 'architect', 'Expenses:Business:Services', 'expense', NULL, 60, true),
('exact', 'google', 'Expenses:Business:Software', 'expense', NULL, 70, true),
('exact', 'openai', 'Expenses:Business:Software', 'expense', NULL, 65, true),
('exact', 'claude', 'Expenses:Business:Software', 'expense', NULL, 65, true),
('exact', 'paper', 'Expenses:Business:Supplies', 'expense', NULL, 55, true),
('exact', 'pen', 'Expenses:Business:Supplies', 'expense', NULL, 55, true),
('exact', 'pencil', 'Expenses:Business:Supplies', 'expense', NULL, 50, true),
('exact', 'tool', 'Expenses:Business:Equipment', 'expense', NULL, 60, true),

-- HEALTH & PERSONAL CARE
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'massage', 'Expenses:Health:Wellness', 'expense', NULL, 80, true),
('exact', 'spa', 'Expenses:Health:Wellness', 'expense', NULL, 70, true),
('exact', 'doctor', 'Expenses:Health:Medical', 'expense', NULL, 75, true),
('exact', 'dentist', 'Expenses:Health:Dental', 'expense', NULL, 65, true),
('exact', 'pharmacy', 'Expenses:Health:Medical', 'expense', NULL, 75, true),
('exact', 'vitamins', 'Expenses:Health:Supplements', 'expense', NULL, 60, true),
('exact', 'gym', 'Expenses:Health:Fitness', 'expense', NULL, 70, true),
('exact', 'fitness', 'Expenses:Health:Fitness', 'expense', NULL, 65, true),
('exact', 'haircut', 'Expenses:Personal:Grooming', 'expense', NULL, 70, true),
('exact', 'nails', 'Expenses:Personal:Grooming', 'expense', NULL, 65, true),
('exact', 'skincare', 'Expenses:Personal:Grooming', 'expense', NULL, 70, true),
('exact', 'cosmetics', 'Expenses:Personal:Grooming', 'expense', NULL, 60, true),
('exact', 'shampoo', 'Expenses:Personal:Hygiene', 'expense', NULL, 65, true),
('exact', 'sunscreen', 'Expenses:Personal:Grooming', 'expense', NULL, 70, true),
('exact', 'umbrella', 'Expenses:Personal:Accessories', 'expense', NULL, 65, true),
('exact', 'salon', 'Expenses:Personal:Grooming', 'expense', NULL, 70, true),
('exact', 'makeup', 'Expenses:Personal:Grooming', 'expense', NULL, 60, true),
('exact', 'veterinarian', 'Expenses:Health:PetCare', 'expense', NULL, 60, true),
('exact', 'medicine', 'Expenses:Health:Medical', 'expense', NULL, 75, true),
('exact', 'dental', 'Expenses:Health:Dental', 'expense', NULL, 65, true),
('exact', 'eye', 'Expenses:Health:Medical', 'expense', NULL, 60, true),
('exact', 'health-insurance', 'Expenses:Health:Insurance', 'expense', NULL, 75, true),

-- EDUCATION
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'school', 'Expenses:Education:General', 'expense', NULL, 80, true),
('exact', 'tuition', 'Expenses:Education:Tuition', 'expense', NULL, 90, true),
('exact', 'uniform', 'Expenses:Education:Supplies', 'expense', NULL, 70, true),
('exact', 'stationery', 'Expenses:Education:Supplies', 'expense', NULL, 65, true),
('exact', 'activities', 'Expenses:Education:Activities', 'expense', NULL, 60, true),
('exact', 'field-trip', 'Expenses:Education:Activities', 'expense', NULL, 60, true),
('exact', 'registration', 'Expenses:Education:Fees', 'expense', NULL, 55, true),
('exact', 'exam-fee', 'Expenses:Education:Fees', 'expense', NULL, 55, true),
('exact', 'transport-school', 'Expenses:Education:Transport', 'expense', NULL, 50, true),
('exact', 'language-lessons', 'Expenses:Education:Lessons', 'expense', NULL, 60, true),
('exact', 'online-courses', 'Expenses:Education:Courses', 'expense', NULL, 55, true),
('exact', 'textbooks', 'Expenses:Education:Materials', 'expense', NULL, 50, true),
('exact', 'tutor', 'Expenses:Education:Lessons', 'expense', NULL, 65, true),
('exact', 'workshop', 'Expenses:Education:Workshops', 'expense', NULL, 55, true),
('exact', 'lesson', 'Expenses:Education:Lessons', 'expense', NULL, 60, true),

-- ENTERTAINMENT
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'cinema', 'Expenses:Entertainment:Movies', 'expense', NULL, 65, true),
('exact', 'rooftop-bar', 'Expenses:Entertainment:Nightlife', 'expense', NULL, 60, true),
('exact', 'nightclub', 'Expenses:Entertainment:Nightlife', 'expense', NULL, 55, true),
('exact', 'karaoke', 'Expenses:Entertainment:Activities', 'expense', NULL, 60, true),
('exact', 'bowling', 'Expenses:Entertainment:Activities', 'expense', NULL, 50, true),
('exact', 'pool-hall', 'Expenses:Entertainment:Activities', 'expense', NULL, 45, true),
('exact', 'temple', 'Expenses:Entertainment:Culture', 'expense', NULL, 55, true),
('exact', 'museum', 'Expenses:Entertainment:Culture', 'expense', NULL, 45, true),
('exact', 'park', 'Expenses:Entertainment:Outdoor', 'expense', NULL, 50, true),
('exact', 'books-leisure', 'Expenses:Entertainment:Reading', 'expense', NULL, 45, true),
('exact', 'games', 'Expenses:Entertainment:Gaming', 'expense', NULL, 50, true),
('exact', 'netflix', 'Expenses:Entertainment:Streaming', 'expense', NULL, 60, true),
('exact', 'spotify', 'Expenses:Entertainment:Streaming', 'expense', NULL, 55, true),
('exact', 'youtube', 'Expenses:Entertainment:Streaming', 'expense', NULL, 50, true),
('exact', 'disney', 'Expenses:Entertainment:Streaming', 'expense', NULL, 55, true),
('exact', 'roblox', 'Expenses:Entertainment:Gaming', 'expense', NULL, 50, true),
('exact', 'itunes', 'Expenses:Entertainment:Digital', 'expense', NULL, 55, true),
('exact', 'vacation', 'Expenses:Entertainment:Travel', 'expense', NULL, 60, true),
('exact', 'swimming', 'Expenses:Entertainment:Activities', 'expense', NULL, 55, true),
('exact', 'trampoline', 'Expenses:Entertainment:Activities', 'expense', NULL, 50, true),
('exact', 'play', 'Expenses:Entertainment:Activities', 'expense', NULL, 55, true),
('exact', 'sports', 'Expenses:Entertainment:Activities', 'expense', NULL, 60, true),
('exact', 'skateboard', 'Expenses:Entertainment:Activities', 'expense', NULL, 45, true),
('exact', 'lottery', 'Expenses:Entertainment:Gambling', 'expense', NULL, 50, true),

-- HOME & UTILITIES
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'rent', 'Expenses:Housing:Rent', 'expense', NULL, 85, true),
('exact', 'electricity', 'Expenses:Utilities:Electricity', 'expense', NULL, 80, true),
('exact', 'water', 'Expenses:Utilities:Water', 'expense', NULL, 75, true),
('exact', 'internet-home', 'Expenses:Utilities:Internet', 'expense', NULL, 75, true),
('exact', 'phone-bill', 'Expenses:Utilities:Phone', 'expense', NULL, 75, true),
('exact', 'cable-tv', 'Expenses:Utilities:Cable', 'expense', NULL, 60, true),
('exact', 'insurance', 'Expenses:Utilities:Insurance', 'expense', NULL, 70, true),
('exact', 'condo-fees', 'Expenses:Housing:Fees', 'expense', NULL, 80, true),
('exact', 'security-deposit', 'Expenses:Housing:Deposits', 'expense', NULL, 60, true),
('exact', 'key-money', 'Expenses:Housing:Deposits', 'expense', NULL, 55, true),
('exact', 'wifi', 'Expenses:Utilities:Internet', 'expense', NULL, 70, true),
('exact', 'mobile-data', 'Expenses:Utilities:Phone', 'expense', NULL, 75, true),
('exact', 'sim-card', 'Expenses:Utilities:Phone', 'expense', NULL, 65, true),
('exact', 'air-conditioning', 'Expenses:Utilities:Electricity', 'expense', NULL, 85, true),
('exact', 'fan', 'Expenses:Home:Appliances', 'expense', NULL, 65, true),
('exact', 'government', 'Expenses:Utilities:Government', 'expense', NULL, 60, true),
('exact', 'license', 'Expenses:Utilities:Government', 'expense', NULL, 55, true),
('exact', 'certificate', 'Expenses:Utilities:Government', 'expense', NULL, 50, true),
('exact', 'lift', 'Expenses:Housing:Maintenance', 'expense', NULL, 50, true),
('exact', 'elevator', 'Expenses:Housing:Maintenance', 'expense', NULL, 50, true),

-- SHOPPING
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'clothing', 'Expenses:Shopping:Clothing', 'expense', NULL, 70, true),
('exact', 'shoes', 'Expenses:Shopping:Clothing', 'expense', NULL, 60, true),
('exact', 'accessories', 'Expenses:Shopping:Clothing', 'expense', NULL, 55, true),
('exact', 'electronics', 'Expenses:Shopping:Electronics', 'expense', NULL, 65, true),
('exact', 'phone-accessories', 'Expenses:Shopping:Electronics', 'expense', NULL, 60, true),
('exact', 'headphones', 'Expenses:Shopping:Electronics', 'expense', NULL, 55, true),
('exact', 'furniture', 'Expenses:Shopping:Furniture', 'expense', NULL, 60, true),
('exact', 'home-decor', 'Expenses:Shopping:Home', 'expense', NULL, 50, true),
('exact', 'cleaning-supplies', 'Expenses:Shopping:Home', 'expense', NULL, 65, true),
('exact', 'appliances', 'Expenses:Shopping:Appliances', 'expense', NULL, 55, true),
('exact', 'lazada', 'Expenses:Shopping:Online', 'expense', NULL, 75, true),
('exact', 'iphone', 'Expenses:Shopping:Electronics', 'expense', NULL, 65, true),
('exact', 'ipad', 'Expenses:Shopping:Electronics', 'expense', NULL, 60, true),
('exact', 'apple', 'Expenses:Shopping:Electronics', 'expense', NULL, 65, true),
('exact', 'jewelry', 'Expenses:Shopping:Luxury', 'expense', NULL, 55, true),
('exact', 'gem', 'Expenses:Shopping:Luxury', 'expense', NULL, 50, true),
('exact', 'gem-stone', 'Expenses:Shopping:Luxury', 'expense', NULL, 50, true),
('exact', 'bag', 'Expenses:Shopping:Clothing', 'expense', NULL, 65, true),
('exact', 'pants', 'Expenses:Shopping:Clothing', 'expense', NULL, 65, true),
('exact', 'shirt', 'Expenses:Shopping:Clothing', 'expense', NULL, 65, true),
('exact', 'jacket', 'Expenses:Shopping:Clothing', 'expense', NULL, 60, true),

-- FINANCIAL
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'bank-fees', 'Expenses:Financial:Fees', 'expense', NULL, 60, true),
('exact', 'atm-fees', 'Expenses:Financial:Fees', 'expense', NULL, 65, true),
('exact', 'money-transfer', 'Expenses:Financial:Transfers', 'expense', NULL, 55, true),
('exact', 'tax', 'Expenses:Financial:Taxes', 'expense', NULL, 50, true),
('exact', 'accountant', 'Expenses:Financial:Services', 'expense', NULL, 45, true),
('exact', 'interest-on-debt', 'Expenses:Financial:Interest', 'expense', NULL, 75, true),
('exact', 'loan', 'Expenses:Financial:Loans', 'expense', NULL, 70, true),
('exact', 'bangkok-bank', 'Expenses:Financial:Banking', 'expense', NULL, 60, true),
('exact', 'kasikorn-bank', 'Expenses:Financial:Banking', 'expense', NULL, 60, true),
('exact', 'fine', 'Expenses:Financial:Fines', 'expense', NULL, 55, true),
('exact', 'cash-withdrawal', 'Expenses:Financial:ATM', 'expense', NULL, 70, true),

-- GIFTS & CHARITY
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'gifts', 'Expenses:Gifts:General', 'expense', NULL, 55, true),
('exact', 'flowers', 'Expenses:Gifts:Flowers', 'expense', NULL, 45, true),
('exact', 'birthday', 'Expenses:Gifts:Celebrations', 'expense', NULL, 50, true),
('exact', 'holiday', 'Expenses:Gifts:Celebrations', 'expense', NULL, 45, true),
('exact', 'donation', 'Expenses:Charity:General', 'expense', NULL, 45, true),
('exact', 'donation-temple', 'Expenses:Charity:Religious', 'expense', NULL, 60, true),
('exact', 'merit-making', 'Expenses:Charity:Religious', 'expense', NULL, 55, true),
('exact', 'funeral', 'Expenses:Gifts:Memorial', 'expense', NULL, 45, true),

-- HOUSEHOLD SERVICES
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'maid', 'Expenses:Household:Services', 'expense', NULL, 70, true),
('exact', 'domestic-worker', 'Expenses:Household:Services', 'expense', NULL, 65, true),
('exact', 'construction', 'Expenses:Household:Maintenance', 'expense', NULL, 60, true),
('exact', 'renovation', 'Expenses:Household:Maintenance', 'expense', NULL, 55, true),
('exact', 'repair', 'Expenses:Household:Maintenance', 'expense', NULL, 65, true),
('exact', 'domestic', 'Expenses:Household:Services', 'expense', NULL, 75, true),
('exact', 'handyman', 'Expenses:Household:Maintenance', 'expense', NULL, 80, true),
('exact', 'gardener', 'Expenses:Household:Services', 'expense', NULL, 75, true),
('exact', 'cook', 'Expenses:Household:Services', 'expense', NULL, 70, true),
('exact', 'nanny', 'Expenses:Household:Services', 'expense', NULL, 90, true),
('exact', 'driver', 'Expenses:Household:Services', 'expense', NULL, 65, true),
('exact', 'security', 'Expenses:Household:Services', 'expense', NULL, 70, true),
('exact', 'elder-care', 'Expenses:Household:Services', 'expense', NULL, 80, true),
('exact', 'pet-care', 'Expenses:Household:Services', 'expense', NULL, 55, true),
('exact', 'deep-clean', 'Expenses:Household:Services', 'expense', NULL, 65, true),

-- PERSONAL SERVICES
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'dry-cleaning', 'Expenses:Personal:Laundry', 'expense', NULL, 60, true),
('exact', 'laundry-service', 'Expenses:Personal:Laundry', 'expense', NULL, 70, true),
('exact', 'alteration', 'Expenses:Personal:Clothing', 'expense', NULL, 60, true),
('exact', 'key-cutting', 'Expenses:Personal:Services', 'expense', NULL, 50, true),
('exact', 'photo-printing', 'Expenses:Personal:Services', 'expense', NULL, 45, true),
('exact', 'laundry', 'Expenses:Personal:Laundry', 'expense', NULL, 65, true),

-- HOME ITEMS
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'dishwashing-liquid', 'Expenses:Home:Cleaning', 'expense', NULL, 60, true),
('exact', 'laundry-detergent', 'Expenses:Home:Cleaning', 'expense', NULL, 65, true),
('exact', 'kitchen-towels', 'Expenses:Home:Supplies', 'expense', NULL, 55, true),
('exact', 'bathroom-tissue', 'Expenses:Home:Supplies', 'expense', NULL, 60, true),
('exact', 'appliance', 'Expenses:Home:Appliances', 'expense', NULL, 60, true),
('exact', 'utensil', 'Expenses:Home:Kitchen', 'expense', NULL, 60, true),
('exact', 'box', 'Expenses:Home:Storage', 'expense', NULL, 50, true),
('exact', 'storage', 'Expenses:Home:Storage', 'expense', NULL, 55, true),
('exact', 'bedding', 'Expenses:Home:Furnishings', 'expense', NULL, 60, true),
('exact', 'cleaning', 'Expenses:Home:Cleaning', 'expense', NULL, 65, true),
('exact', 'household', 'Expenses:Home:General', 'expense', NULL, 60, true),
('exact', 'pest', 'Expenses:Home:Maintenance', 'expense', NULL, 55, true),

-- PETS
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'pet', 'Expenses:Pets:Supplies', 'expense', NULL, 65, true),

-- MISC
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
('exact', 'tip', 'Expenses:Food:Tips', 'expense', NULL, 70, true),
('exact', 'emergency', 'Expenses:Emergency:General', 'expense', NULL, 40, true),
('exact', 'miscellaneous', 'Expenses:Miscellaneous:General', 'expense', NULL, 30, true),
('exact', 'personal', 'Expenses:Personal:General', 'expense', NULL, 0, true),
('exact', 'worker', 'Expenses:Services:General', 'expense', NULL, 0, true);

-- Add some regex patterns for variations
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
-- Coffee variations
('regex', '\\b(coffee|latte|cappuccino|espresso|americano)\\b', 'Expenses:Food:Coffee', 'expense', NULL, 85, true),
-- Thai food variations
('regex', '\\b(pad\\s*thai|som\\s*tam|tom\\s*yum|green\\s*curry|red\\s*curry|massaman|panang)\\b', 'Expenses:Food:ThaiFood', 'expense', NULL, 80, true),
-- Transportation variations
('regex', '\\b(grab|uber|bolt|line\\s*man)\\b', 'Expenses:Transportation:RideSharing', 'expense', NULL, 90, true),
-- Food court variations
('regex', '\\b(food\\s*court|terminal\\s*21|central\\s*world|siam\\s*paragon)\\b', 'Expenses:Food:FoodCourt', 'expense', NULL, 80, true),
-- Convenience store variations
('regex', '\\b(7\\s*eleven|7\\-11|family\\s*mart|lawson|circle\\s*k)\\b', 'Expenses:Food:Convenience', 'expense', NULL, 90, true),
-- Grocery store variations
('regex', '\\b(big\\s*c|lotus|tesco|villa\\s*market|tops|makro)\\b', 'Expenses:Food:Groceries', 'expense', NULL, 85, true),
-- Bank variations
('regex', '\\b(bangkok\\s*bank|kasikorn|scb|krungthai|tmb|ktb)\\b', 'Expenses:Financial:Banking', 'expense', NULL, 60, true),
-- Hospital variations
('regex', '\\b(bumrungrad|bangkok\\s*hospital|samitivej|phayathai|praram\\s*9)\\b', 'Expenses:Health:Medical', 'expense', NULL, 75, true),
-- Mall variations
('regex', '\\b(siam|central|terminal\\s*21|mbk|pantip|chatuchak)\\b', 'Expenses:Shopping:General', 'expense', NULL, 70, true);

-- Update vendor mappings to use new account paths
UPDATE vendor_mappings SET account_path = 'Expenses:Food:Coffee' WHERE vendor_name ILIKE '%starbucks%';
UPDATE vendor_mappings SET account_path = 'Expenses:Food:Convenience' WHERE vendor_name ILIKE '%7-eleven%' OR vendor_name ILIKE '%family mart%';
UPDATE vendor_mappings SET account_path = 'Expenses:Food:Groceries' WHERE vendor_name ILIKE '%big c%' OR vendor_name ILIKE '%lotus%' OR vendor_name ILIKE '%tesco%';
UPDATE vendor_mappings SET account_path = 'Expenses:Transportation:RideSharing' WHERE vendor_name ILIKE '%grab%';
UPDATE vendor_mappings SET account_path = 'Expenses:Transportation:Public' WHERE vendor_name ILIKE '%bts%' OR vendor_name ILIKE '%mrt%';
UPDATE vendor_mappings SET account_path = 'Expenses:Health:Medical' WHERE vendor_name ILIKE '%bumrungrad%' OR vendor_name ILIKE '%bangkok hospital%';
UPDATE vendor_mappings SET account_path = 'Expenses:Financial:Banking' WHERE vendor_name ILIKE '%bangkok bank%' OR vendor_name ILIKE '%kasikorn%';

-- Add some business-specific patterns
INSERT INTO account_patterns (pattern_type, pattern, account_path, account_type, business_context, priority, is_active) VALUES
-- MyBrick business context
('exact', 'supplies', 'Expenses:Business:Supplies', 'expense', 'MyBrick', 80, true),
('exact', 'software', 'Expenses:Business:Software', 'expense', 'MyBrick', 75, true),
('exact', 'consulting', 'Expenses:Business:Services', 'expense', 'MyBrick', 75, true),
('exact', 'client-lunch', 'Expenses:Business:Meals', 'expense', 'MyBrick', 65, true),

-- Channel60 business context
('exact', 'marketing', 'Expenses:Business:Marketing', 'expense', 'Channel60', 55, true),
('exact', 'advertising', 'Expenses:Business:Marketing', 'expense', 'Channel60', 55, true),
('exact', 'content', 'Expenses:Business:Content', 'expense', 'Channel60', 60, true),
('exact', 'equipment', 'Expenses:Business:Equipment', 'expense', 'Channel60', 65, true);

COMMIT;
