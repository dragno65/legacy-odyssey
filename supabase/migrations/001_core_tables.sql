-- ============================================================
-- Legacy Odyssey — Core Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FAMILIES
-- ============================================================
CREATE TABLE families (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id            UUID UNIQUE,
  email                   TEXT NOT NULL UNIQUE,
  display_name            TEXT,
  book_password           TEXT NOT NULL DEFAULT 'legacy',
  subdomain               TEXT UNIQUE,
  custom_domain           TEXT UNIQUE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_status     TEXT NOT NULL DEFAULT 'trialing'
                          CHECK (subscription_status IN ('trialing','active','past_due','canceled','unpaid')),
  trial_ends_at           TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_subdomain ON families(subdomain);
CREATE INDEX idx_families_custom_domain ON families(custom_domain);
CREATE INDEX idx_families_stripe_customer ON families(stripe_customer_id);

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE books (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id               UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_first_name        TEXT NOT NULL DEFAULT '',
  child_middle_name       TEXT DEFAULT '',
  child_last_name         TEXT NOT NULL DEFAULT '',
  birth_date              DATE,
  birth_time              TIME,
  birth_weight_lbs        INTEGER,
  birth_weight_oz         INTEGER,
  birth_length_inches     NUMERIC(4,1),
  birth_city              TEXT,
  birth_state             TEXT,
  birth_hospital          TEXT,
  name_meaning            TEXT,
  hero_image_path         TEXT,
  parent_quote            TEXT DEFAULT 'From the moment we first saw your face, our world was never the same.',
  parent_quote_attribution TEXT DEFAULT 'Mom & Dad',
  vault_unlock_date       DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_books_family ON books(family_id);

-- ============================================================
-- BEFORE YOU ARRIVED (4 story cards)
-- ============================================================
CREATE TABLE before_arrived_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  photo_path      TEXT,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  body            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE before_arrived_checklist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  label           TEXT NOT NULL,
  is_checked      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BIRTH STORY
-- ============================================================
CREATE TABLE birth_stories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  first_held_by   TEXT DEFAULT 'Mom / Dad',
  mom_narrative   TEXT,
  mom_photo_1     TEXT,
  mom_photo_2     TEXT,
  dad_narrative   TEXT,
  dad_photo_1     TEXT,
  dad_photo_2     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMING HOME (4 story cards)
-- ============================================================
CREATE TABLE coming_home_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  photo_path      TEXT,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  body            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MONTHS (12 per book)
-- ============================================================
CREATE TABLE months (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  month_number    INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
  label           TEXT NOT NULL,
  highlight       TEXT,
  weight          TEXT,
  length          TEXT,
  photo_path      TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, month_number)
);

-- ============================================================
-- FAMILY MEMBERS (6 per book)
-- ============================================================
CREATE TABLE family_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  member_key      TEXT NOT NULL,
  name            TEXT NOT NULL,
  relation        TEXT NOT NULL,
  emoji           TEXT DEFAULT '👤',
  photo_path      TEXT,
  meta_1_label    TEXT, meta_1_value TEXT,
  meta_2_label    TEXT, meta_2_value TEXT,
  meta_3_label    TEXT, meta_3_value TEXT,
  meta_4_label    TEXT, meta_4_value TEXT,
  story           TEXT,
  story2          TEXT,
  quote_text      TEXT,
  quote_cite      TEXT,
  album_1_path    TEXT, album_1_caption TEXT,
  album_2_path    TEXT, album_2_caption TEXT,
  album_3_path    TEXT, album_3_caption TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, member_key)
);

-- ============================================================
-- FIRSTS (9 milestones)
-- ============================================================
CREATE TABLE firsts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  emoji           TEXT NOT NULL DEFAULT '⭐',
  title           TEXT NOT NULL,
  date_text       TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CELEBRATIONS (3 cards)
-- ============================================================
CREATE TABLE celebrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  photo_path      TEXT,
  eyebrow         TEXT,
  title           TEXT NOT NULL,
  body            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LETTERS (3 letters)
-- ============================================================
CREATE TABLE letters (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  from_label      TEXT NOT NULL,
  occasion        TEXT,
  salutation      TEXT,
  body            TEXT,
  signature       TEXT,
  letter_date     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECIPES (4 cards)
-- ============================================================
CREATE TABLE recipes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  photo_path      TEXT,
  origin_label    TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  ingredients     JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VAULT ITEMS
-- ============================================================
CREATE TABLE vault_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  item_type       TEXT NOT NULL CHECK (item_type IN ('letter','photo','memory')),
  title           TEXT,
  body            TEXT,
  photo_path      TEXT,
  sealed_by       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','editor')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_families_updated BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_before_arrived_updated BEFORE UPDATE ON before_arrived_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_birth_stories_updated BEFORE UPDATE ON birth_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_coming_home_updated BEFORE UPDATE ON coming_home_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_months_updated BEFORE UPDATE ON months FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_family_members_updated BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_firsts_updated BEFORE UPDATE ON firsts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_celebrations_updated BEFORE UPDATE ON celebrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_letters_updated BEFORE UPDATE ON letters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
