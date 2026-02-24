-- ============================================================
-- Legacy Odyssey — Domain Orders Table
-- Tracks the async domain purchase lifecycle via Spaceship API
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE domain_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id         UUID REFERENCES families(id) ON DELETE SET NULL,
  domain            TEXT NOT NULL,
  tld               TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','registering','registered','dns_setup','active','failed')),
  spaceship_op_id   TEXT,
  stripe_session_id TEXT,
  railway_domain_id TEXT,
  error_message     TEXT,
  price_yearly      NUMERIC(10,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_orders_family ON domain_orders(family_id);
CREATE INDEX idx_domain_orders_status ON domain_orders(status);
CREATE INDEX idx_domain_orders_domain ON domain_orders(domain);

CREATE TRIGGER trg_domain_orders_updated
  BEFORE UPDATE ON domain_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
