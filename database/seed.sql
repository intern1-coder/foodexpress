-- FoodExpress Seed Data
-- PostgreSQL

-- ============================================
-- USERS
-- ============================================
INSERT INTO users (user_id, first_name, last_name, email, password_hash, phone, address, city, state, zip_code, role) VALUES
-- Customers (password: Customer123!)
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John', 'Doe', 'john.doe@email.com', '$2b$12$kyIYbdFYU9at8gOREX6ROOdatOdNxfxhTABtNYaG5GbjRB7l.dY3K', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', 'customer'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Jane', 'Smith', 'jane.smith@email.com', '$2b$12$YD6lSluPm4Ustx43lZXmmOLN.w3n1Mp7XYpAa0vXEmLhpZAA/Xcza', '+1-555-0102', '456 Oak Ave', 'New York', 'NY', '10002', 'customer'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Bob', 'Johnson', 'bob.j@email.com', '$2b$12$4n2HSKFwY1/OVUxoD/fSOOPG3.0VrxVxJIkq9mypwvpp1nd7TiZWm', '+1-555-0103', '789 Pine Rd', 'Brooklyn', 'NY', '11201', 'customer'),

-- Admin (password: Admin123!)
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Admin', 'User', 'admin@foodexpress.com', '$2b$12$bajKL19byiXAmCRcOkcKRuc.D2zNGjWU1ld4GgdgcikybZa0Babyi', '+1-555-0104', '100 Admin Blvd', 'New York', 'NY', '10000', 'admin'),

-- Delivery Partners (password: Delivery123!)
('e5f6a7b8-c9d0-1234-efab-345678901234', 'Mike', 'Wilson', 'mike.w@email.com', '$2b$12$SYXdhIftqfd34wAmV7eFyOyEJSdyZqnmzRfSPnF0YyG.J/bPQX9vu', '+1-555-0105', '202 Delivery Ln', 'Queens', 'NY', '11101', 'delivery_partner'),
('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Sarah', 'Brown', 'sarah.b@email.com', '$2b$12$LYsCaVizkC8Y2fTVXsu/o.AELoFIrbB4RI0f5Z0ROuwNj6IKlRJ5y', '+1-555-0106', '303 Rider Dr', 'Bronx', 'NY', '10451', 'delivery_partner');

-- ============================================
-- DELIVERY PARTNERS
-- ============================================
INSERT INTO delivery_partners (id, user_id, vehicle_type, is_available) VALUES
-- For Mike Wilson (user_id: e5f6a7b8-c9d0-1234-efab-345678901234)
('d4e5f6a7-b8c9-0123-defa-234567890124', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'Motorcycle', true),
-- For Sarah Brown (user_id: f6a7b8c9-d0e1-2345-fabc-456789012345)
('d4e5f6a7-b8c9-0123-defa-234567890125', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'Car', true);

-- ============================================
-- RESTAURANTS
-- ============================================
INSERT INTO restaurants (restaurant_id, name, description, cuisine_type, address, city, state, zip_code, phone, email, opening_time, closing_time, rating, delivery_fee, minimum_order, estimated_delivery_time) VALUES
-- Italian
('11111111-1111-1111-1111-111111111111', 'Bella Italia', 'Authentic Italian cuisine with family recipes passed down through generations', 'Italian', '100 Pasta Lane', 'New York', 'NY', '10001', '+1-555-1001', 'info@bellaitalia.com', '11:00:00', '22:00:00', 4.5, 3.99, 15.00, 35),

-- Chinese
('22222222-2222-2222-2222-222222222222', 'Dragon Wok', 'Traditional Chinese flavors with modern presentation', 'Chinese', '200 Dragon St', 'New York', 'NY', '10002', '+1-555-1002', 'info@dragonwok.com', '10:00:00', '23:00:00', 4.2, 2.99, 12.00, 30),

-- Indian
('33333333-3333-3333-3333-333333333333', 'Spice Garden', 'Aromatic Indian dishes with fresh spices imported daily', 'Indian', '300 Curry Blvd', 'Brooklyn', 'NY', '11201', '+1-555-1003', 'info@spicegarden.com', '11:30:00', '22:30:00', 4.7, 3.49, 18.00, 40),

-- Mexican
('44444444-4444-4444-4444-444444444444', 'Casa Mexicana', 'Vibrant Mexican street food and traditional favorites', 'Mexican', '400 Taco Way', 'Queens', 'NY', '11101', '+1-555-1004', 'info@casamexicana.com', '10:30:00', '23:30:00', 4.3, 2.49, 10.00, 25),

-- Japanese
('55555555-5555-5555-5555-555555555555', 'Sakura Sushi', 'Premium sushi and Japanese cuisine crafted by master chefs', 'Japanese', '500 Sushi Ave', 'Manhattan', 'NY', '10003', '+1-555-1005', 'info@sakurasushi.com', '12:00:00', '22:00:00', 4.8, 4.99, 20.00, 45),

-- American
('66666666-6666-6666-6666-666666666666', 'Burger Barn', 'Classic American burgers, fries, and shakes', 'American', '600 Burger Blvd', 'Bronx', 'NY', '10451', '+1-555-1006', 'info@burgerbarn.com', '09:00:00', '23:00:00', 4.1, 2.99, 8.00, 20),

-- Thai
('77777777-7777-7777-7777-777777777777', 'Thai Orchid', 'Authentic Thai street food with bold flavors', 'Thai', '700 Pad Thai St', 'Manhattan', 'NY', '10004', '+1-555-1007', 'info@thaiorchid.com', '11:00:00', '22:00:00', 4.4, 3.49, 14.00, 35),

-- Mediterranean
('88888888-8888-8888-8888-888888888888', 'Olive Grove', 'Fresh Mediterranean bowls, wraps, and kebabs', 'Mediterranean', '800 Feta Ln', 'Brooklyn', 'NY', '11202', '+1-555-1008', 'info@olivegrove.com', '10:00:00', '21:00:00', 4.6, 3.99, 16.00, 30);

-- ============================================
-- FOOD ITEMS
-- ============================================

-- Bella Italia (Italian) - Restaurant 11111111...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('aaa11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomatoes, and basil', 14.99, 'Pizza', true, false, false, 20, 850),
('aaa11111-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Spaghetti Carbonara', 'Traditional carbonara with pancetta and parmesan', 16.99, 'Pasta', false, false, false, 18, 780),
('aaa11111-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Caesar Salad', 'Romaine lettuce with parmesan, croutons, and caesar dressing', 9.99, 'Salad', true, false, false, 8, 320),
('aaa11111-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Tiramisu', 'Classic Italian coffee-flavored dessert', 8.99, 'Dessert', true, false, false, 5, 450);

-- Dragon Wok (Chinese) - Restaurant 22222222...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('bbb22222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Kung Pao Chicken', 'Spicy chicken with peanuts and vegetables', 13.99, 'Main Course', false, false, false, 15, 620),
('bbb22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Vegetable Lo Mein', 'Stir-fried noodles with mixed vegetables', 11.99, 'Noodles', true, true, false, 12, 540),
('bbb22222-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Fried Rice', 'Classic fried rice with egg and vegetables', 10.99, 'Rice', false, false, false, 10, 480),
('bbb22222-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Spring Rolls (4 pcs)', 'Crispy spring rolls with vegetable filling', 6.99, 'Appetizer', true, true, false, 10, 280);

-- Spice Garden (Indian) - Restaurant 33333333...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('ccc33333-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Chicken Tikka Masala', 'Creamy tomato-based curry with tender chicken', 15.99, 'Curry', false, false, true, 25, 580),
('ccc33333-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Paneer Butter Masala', 'Rich and creamy paneer in tomato sauce', 13.99, 'Curry', true, false, true, 20, 520),
('ccc33333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Garlic Naan', 'Soft naan bread with garlic and butter', 3.99, 'Bread', true, false, false, 8, 320),
('ccc33333-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Biryani', 'Fragrant basmati rice with spiced chicken', 16.99, 'Rice', false, false, true, 30, 650);

-- Casa Mexicana (Mexican) - Restaurant 44444444...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('ddd44444-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Chicken Tacos (3 pcs)', 'Soft corn tortillas with seasoned chicken', 11.99, 'Tacos', false, false, true, 12, 450),
('ddd44444-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Veggie Burrito', 'Large flour tortilla loaded with beans, rice, and veggies', 10.99, 'Burrito', true, true, false, 10, 580),
('ddd44444-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Nachos Supreme', 'Loaded nachos with cheese, jalapeños, and sour cream', 9.99, 'Appetizer', true, false, true, 8, 720),
('ddd44444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Churros', 'Cinnamon sugar churros with chocolate dipping sauce', 6.99, 'Dessert', true, false, false, 10, 380);

-- Sakura Sushi (Japanese) - Restaurant 55555555...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('eee55555-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Salmon Nigiri (6 pcs)', 'Fresh salmon over seasoned rice', 14.99, 'Sushi', false, false, true, 15, 320),
('eee55555-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Dragon Roll', 'Shrimp tempura roll topped with avocado', 16.99, 'Sushi', false, false, false, 20, 480),
('eee55555-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Miso Soup', 'Traditional Japanese soybean soup', 4.99, 'Soup', true, true, true, 5, 80),
('eee55555-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Edamame', 'Steamed and salted soybeans', 5.99, 'Appetizer', true, true, true, 5, 120);

-- Burger Barn (American) - Restaurant 66666666...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('fff66666-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'Classic Cheeseburger', 'Angus beef patty with cheese, lettuce, and tomato', 12.99, 'Burger', false, false, false, 12, 750),
('fff66666-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Veggie Burger', 'Plant-based patty with all the fixings', 13.99, 'Burger', true, true, false, 12, 520),
('fff66666-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'Loaded Fries', 'Crispy fries with cheese, bacon, and jalapeños', 8.99, 'Side', false, false, false, 10, 680),
('fff66666-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'Chocolate Milkshake', 'Rich and creamy chocolate milkshake', 6.99, 'Beverage', true, false, false, 5, 580);

-- Thai Orchid (Thai) - Restaurant 77777777...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('ffffffff-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Pad Thai', 'Stir-fried rice noodles with shrimp and peanuts', 13.99, 'Noodles', false, false, true, 15, 560),
('ggg77777-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'Green Curry', 'Coconut curry with bamboo shoots and Thai basil', 14.99, 'Curry', false, false, true, 18, 480),
('ggg77777-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Mango Sticky Rice', 'Sweet coconut sticky rice with fresh mango', 7.99, 'Dessert', true, true, true, 10, 380),
('ggg77777-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', 'Tom Yum Soup', 'Spicy and sour Thai soup with shrimp', 10.99, 'Soup', false, false, true, 12, 180);

-- Olive Grove (Mediterranean) - Restaurant 88888888...
INSERT INTO food_items (item_id, restaurant_id, name, description, price, category, is_vegetarian, is_vegan, is_gluten_free, preparation_time, calories) VALUES
('hhh88888-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'Chicken Shawarma Wrap', 'Marinated chicken with tahini and pickles', 12.99, 'Wrap', false, false, false, 12, 520),
('hhh88888-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'Falafel Bowl', 'Crispy falafel with hummus, tabbouleh, and rice', 11.99, 'Bowl', true, true, true, 15, 480),
('hhh88888-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', 'Hummus & Pita', 'Creamy hummus served with warm pita bread', 6.99, 'Appetizer', true, true, false, 5, 320),
('hhh88888-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'Baklava', 'Layered phyllo pastry with honey and nuts', 5.99, 'Dessert', true, false, false, 5, 340);

-- ============================================
-- ORDERS
-- ============================================
INSERT INTO orders (order_id, user_id, restaurant_id, order_number, status, subtotal, delivery_fee, tax, total, delivery_address, payment_method, payment_status) VALUES
-- John Doe orders
('order-0001-0001-0001-000100000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', 'FE-00001', 'delivered', 23.98, 3.99, 2.16, 30.13, '123 Main St, New York, NY 10001', 'credit_card', 'paid'),
('order-0001-0001-0001-000200000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '55555555-5555-5555-5555-555555555555', 'FE-00002', 'delivered', 19.98, 4.99, 1.80, 26.77, '123 Main St, New York, NY 10001', 'credit_card', 'paid'),

-- Jane Smith orders
('order-0002-0002-0002-000100000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '33333333-3333-3333-3333-333333333333', 'FE-00003', 'preparing', 29.98, 3.49, 2.70, 36.17, '456 Oak Ave, New York, NY 10002', 'cash_on_delivery', 'pending'),
('order-0002-0002-0002-000200000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '44444444-4444-4444-4444-444444444444', 'FE-00004', 'confirmed', 22.98, 2.49, 2.07, 27.54, '456 Oak Ave, New York, NY 10002', 'credit_card', 'paid'),

-- Bob Johnson orders
('order-0003-0003-0003-000100000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012', '22222222-2222-2222-2222-222222222222', 'FE-00005', 'out_for_delivery', 35.97, 2.99, 3.24, 42.20, '789 Pine Rd, Brooklyn, NY 11201', 'cash_on_delivery', 'pending');

-- ============================================
-- ORDER ITEMS
-- ============================================

-- Order 1: John - Bella Italia (Margherita Pizza + Caesar Salad)
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, total_price) VALUES
('oi-0001-0001', 'order-0001-0001-0001-000100000001', 'aaa11111-1111-1111-1111-111111111111', 1, 14.99, 14.99),
('oi-0001-0002', 'order-0001-0001-0001-000100000001', 'aaa11111-3333-3333-3333-333333333333', 1, 9.99, 9.99);

-- Order 2: John - Sakura Sushi (Salmon Nigiri + Dragon Roll)
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, total_price) VALUES
('oi-0002-0001', 'order-0001-0001-0001-000200000002', 'eee55555-1111-1111-1111-111111111111', 1, 14.99, 14.99),
('oi-0002-0002', 'order-0001-0001-0001-000200000002', 'eee55555-3333-3333-3333-333333333333', 1, 4.99, 4.99);

-- Order 3: Jane - Spice Garden (Chicken Tikka Masala + Garlic Naan x2)
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, total_price) VALUES
('oi-0003-0001', 'order-0002-0002-0002-000100000001', 'ccc33333-1111-1111-1111-111111111111', 1, 15.99, 15.99),
('oi-0003-0002', 'order-0002-0002-0002-000100000001', 'ccc33333-3333-3333-3333-333333333333', 2, 3.99, 7.98),
('oi-0003-0003', 'order-0002-0002-0002-000100000001', 'ccc33333-2222-2222-2222-222222222222', 1, 13.99, 13.99);

-- Order 4: Jane - Casa Mexicana (Chicken Tacos + Nachos + Veggie Burrito)
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, total_price) VALUES
('oi-0004-0001', 'order-0002-0002-0002-000200000002', 'ddd44444-1111-1111-1111-111111111111', 1, 11.99, 11.99),
('oi-0004-0002', 'order-0002-0002-0002-0002000200000002', 'ddd44444-3333-3333-3333-333333333333', 1, 9.99, 9.99),
('oi-0004-0003', 'order-0002-0002-0002-0002000200000002', 'ddd44444-4444-4444-4444-444444444444', 1, 6.99, 6.99);

-- Order 5: Bob - Dragon Wok (Kung Pao Chicken + Veggie Lo Mein + Spring Rolls x2)
INSERT INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, total_price) VALUES
('oi-0005-0001', 'order-0003-0003-0003-000100000001', 'bbb22222-1111-1111-1111-111111111111', 1, 13.99, 13.99),
('oi-0005-0002', 'order-0003-0003-0003-000100000001', 'bbb22222-2222-2222-2222-222222222222', 1, 11.99, 11.99),
('oi-0005-0003', 'order-0003-0003-0003-000100000001', 'bbb22222-4444-4444-4444-444444444444', 2, 6.99, 13.98);