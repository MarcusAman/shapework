-- Migration: Add editorial quality and destination accuracy columns to news_items
-- Date: 2026-09-07

ALTER TABLE news_items
  ADD COLUMN IF NOT EXISTS destination_accuracy VARCHAR(20) DEFAULT 'exact',
  ADD COLUMN IF NOT EXISTS editorial_decision VARCHAR(30) DEFAULT 'publish',
  ADD COLUMN IF NOT EXISTS editorial_rejection_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS event_cluster_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_news_items_editorial_decision ON news_items (editorial_decision);
CREATE INDEX IF NOT EXISTS idx_news_items_destination_accuracy ON news_items (destination_accuracy);
CREATE INDEX IF NOT EXISTS idx_news_items_canonical_url ON news_items (canonical_url);
