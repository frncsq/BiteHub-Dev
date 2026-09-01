-- BiteHub Advertisement System (MySQL reference — if migrating from MySQL docs)
-- BiteHub production server uses PostgreSQL; see ads-schema.postgresql.sql.

CREATE TABLE IF NOT EXISTS ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(512),
  link VARCHAR(512),
  position VARCHAR(64) NOT NULL,
  ad_type VARCHAR(32) DEFAULT 'banner',
  status VARCHAR(20) DEFAULT 'active',
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad_id INT NOT NULL,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45),
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

CREATE INDEX idx_ads_position ON ads(position);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ad_clicks_ad_id ON ad_clicks(ad_id);
