-- ORIGO Database Migrations
-- Run: node db/migrate.js

-- ─── 001 Users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) UNIQUE,
    password_hash  VARCHAR(128),
    wallet_address VARCHAR(42),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 002 Factions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS factions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(64) NOT NULL,
    color          VARCHAR(7)  NOT NULL DEFAULT '#00ff88',
    layer          INTEGER     NOT NULL DEFAULT 0,
    home_planet    VARCHAR(32) NOT NULL DEFAULT 'earth',
    seed_pattern   VARCHAR(64),
    seed_row       INTEGER,
    seed_col       INTEGER,
    active         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_factions_user ON factions(user_id);

-- ─── 003 GHIFR Ledger ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghifr_ledger (
    id             BIGSERIAL PRIMARY KEY,
    faction_id     UUID        REFERENCES factions(id) ON DELETE CASCADE,
    amount         NUMERIC(18,6) NOT NULL,   -- positive=earn, negative=spend
    type           VARCHAR(32) NOT NULL,      -- earn | voucher_issued | bonus | penalty
    tick           BIGINT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ghifr_faction ON ghifr_ledger(faction_id);
CREATE INDEX IF NOT EXISTS idx_ghifr_type    ON ghifr_ledger(type);

-- ─── 004 Vouchers ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id     UUID        REFERENCES factions(id) ON DELETE CASCADE,
    nonce          VARCHAR(66) NOT NULL UNIQUE,  -- 0x + 64 hex
    ghifr_amount   NUMERIC(18,6) NOT NULL,
    ifr_amount     NUMERIC(28,0) NOT NULL,       -- wei units
    expiry         TIMESTAMPTZ NOT NULL,
    signature      TEXT        NOT NULL,
    status         VARCHAR(16) NOT NULL DEFAULT 'issued', -- issued|claimed|expired
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vouchers_faction ON vouchers(faction_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_nonce   ON vouchers(nonce);

-- ─── 005 Fossils ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fossils (
    id                 BIGSERIAL   PRIMARY KEY,
    faction_id         UUID        REFERENCES factions(id) ON DELETE SET NULL,
    planet             VARCHAR(32) NOT NULL DEFAULT 'earth',
    col                INTEGER     NOT NULL,
    row                INTEGER     NOT NULL,
    death_generation   BIGINT      NOT NULL,
    decay_day          INTEGER     NOT NULL DEFAULT 0,
    status             VARCHAR(16) NOT NULL DEFAULT 'active',  -- active|expired
    created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fossils_status  ON fossils(status);
CREATE INDEX IF NOT EXISTS idx_fossils_faction ON fossils(faction_id);

-- ─── 006 Patterns ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patterns (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64),
    bitmask         TEXT        NOT NULL,
    discovered_by   UUID        REFERENCES factions(id) ON DELETE SET NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'library', -- library|unnamed|named
    vote_deadline   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pattern_votes (
    id              BIGSERIAL   PRIMARY KEY,
    pattern_id      UUID        REFERENCES patterns(id) ON DELETE CASCADE,
    faction_id      UUID        REFERENCES factions(id) ON DELETE CASCADE,
    proposed_name   VARCHAR(64) NOT NULL,
    vote_weight     NUMERIC(10,2) NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (pattern_id, faction_id)   -- one entry per faction per pattern
);

-- ─── Seed: Built-in pattern library ──────────────────────────────────────────
INSERT INTO patterns (name, bitmask, status) VALUES
  ('Glider',     '010,001,111', 'library'),
  ('Blinker',    '111',         'library'),
  ('Block',      '11,11',       'library'),
  ('Beehive',    '011,100,100,011', 'library'),
  ('R-Pentomino','011,110,010', 'library'),
  ('Acorn',      '010000,000100,110111', 'library'),
  ('Pulsar',     'complex',     'library'),
  ('Spaceship',  'complex',     'library')
ON CONFLICT DO NOTHING;
