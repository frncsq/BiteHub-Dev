-- BiteHub Advertisement System (PostgreSQL — production schema)
-- Run via setup script or ensureAdsTables() on server startup.

CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(512),
  link VARCHAR(512),
  position VARCHAR(64) NOT NULL,
  ad_type VARCHAR(32) DEFAULT 'banner',
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id SERIAL PRIMARY KEY,
  ad_id INT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
