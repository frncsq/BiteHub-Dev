-- BiteHub Database Schema (PostgreSQL)
-- Created for full-stack food delivery application

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE order_status_enum AS ENUM ('pending', 'accepted', 'confirmed', 'preparing', 'prepared', 'ready', 'out_for_delivery', 'on_the_way', 'delivered', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE delivery_status_enum AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered');
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');

-- ============================================
-- USERS TABLE (Customers)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    course VARCHAR(100),
    year INT,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url VARCHAR(500),
    address VARCHAR(500),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_full_name ON users(full_name);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    business_address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    permit_number VARCHAR(100) UNIQUE NOT NULL,
    permit_document_url VARCHAR(500),
    owner_name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    business_email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    restaurant_logo_url VARCHAR(500),
    description TEXT,
    cuisine_type VARCHAR(100),
    is_open BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurants_business_email ON restaurants(business_email);
CREATE INDEX idx_restaurants_username ON restaurants(username);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_is_open ON restaurants(is_open);

-- ============================================
-- MENU ITEMS / PRODUCTS TABLE
-- ============================================
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    half_price NUMERIC(10, 2) DEFAULT NULL,    -- Small size price for Drinks
    large_price NUMERIC(10, 2) DEFAULT NULL,   -- Large size price for Drinks
    cost_to_produce NUMERIC(10, 2) DEFAULT 0,
    category VARCHAR(100),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    out_of_stock_auto BOOLEAN DEFAULT FALSE,
    inventory_count INT DEFAULT -1,            -- Legacy: use daily_stock instead
    daily_stock INT DEFAULT NULL,              -- The fixed daily quota (NULL = unlimited)
    current_stock INT DEFAULT NULL,            -- Remaining stock today (auto-reset at midnight)
    preparation_time INT,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);

COMMENT ON COLUMN menu_items.preparation_time IS 'in minutes';
COMMENT ON COLUMN menu_items.daily_stock IS 'Fresh daily quota set by owner. Never decremented by orders.';
COMMENT ON COLUMN menu_items.current_stock IS 'Remaining stock for today. Decremented on order. Auto-reset to daily_stock at midnight.';

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_status order_status_enum DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL,
    delivery_address VARCHAR(500) NOT NULL,
    delivery_city VARCHAR(100),
    special_instructions TEXT,
    estimated_delivery_time INT,
    delivery_time TIMESTAMP NULL,
    payment_method VARCHAR(50),
    payment_status payment_status_enum DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

COMMENT ON COLUMN orders.estimated_delivery_time IS 'in minutes';
COMMENT ON COLUMN orders.payment_method IS 'e.g., card, cash, paypal';

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id),
    quantity INT NOT NULL DEFAULT 1,
    price_at_order NUMERIC(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- ============================================
-- CART TABLE
-- ============================================
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    size VARCHAR(20) DEFAULT NULL,             -- Size for drinks: Small, Medium, Large
    special_instructions TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id, size)        -- Allow same item in different sizes
);

CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_restaurant_id ON cart(restaurant_id);

-- ============================================
-- REVIEWS / RATINGS TABLE
-- ============================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id),
    order_id INT REFERENCES orders(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_reviews_menu_item_id ON reviews(menu_item_id);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- ============================================
-- RESTAURANT FAVORITES TABLE
-- ============================================
CREATE TABLE restaurant_favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, restaurant_id)
);

CREATE INDEX idx_restaurant_favorites_user_id ON restaurant_favorites(user_id);

-- ============================================
-- DELIVERIES TABLE
-- ============================================
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_person_id INT,
    current_location VARCHAR(500),
    delivery_status delivery_status_enum DEFAULT 'assigned',
    estimated_arrival TIMESTAMP NULL,
    actual_delivery_time TIMESTAMP NULL,
    tracking_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_delivery_status ON deliveries(delivery_status);

-- ============================================
-- PROMO CODES / COUPONS TABLE
-- ============================================
CREATE TABLE promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type_enum DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) NOT NULL,
    max_uses INT,
    times_used INT DEFAULT 0,
    min_order_amount NUMERIC(10, 2),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);

-- ============================================
-- ORDER PROMO USAGE TABLE
-- ============================================
CREATE TABLE order_promo_usage (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    promo_code_id INT NOT NULL REFERENCES promo_codes(id),
    discount_amount NUMERIC(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_promo_usage_order_id ON order_promo_usage(order_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER cart_updated_at BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
