-- ORIGO Migration 002 — Lenia Phase 3 tables
-- Applied when: Phase 3 starts (Rust engine production-ready)
-- These tables have no effect until lenia_tick.js is active.

-- Lenia creature catalog (seeded from Chan's canonical catalog at lenia.world)
CREATE TABLE IF NOT EXISTS lenia_creatures (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64),
    feature_vector  FLOAT[]       NOT NULL,   -- compact embedding for cosine similarity
    kernel_params   JSONB         NOT NULL,   -- { mu, sigma, R, dt, K } Lenia params
    velocity_class  VARCHAR(16),              -- still | oscillator | spaceship
    source          VARCHAR(32)   DEFAULT 'chan_catalog', -- chan_catalog | community
    discovered_by   UUID          REFERENCES factions(id) ON DELETE SET NULL,
    discovered_at   TIMESTAMPTZ   DEFAULT NOW(),
    vote_deadline   TIMESTAMPTZ,
    status          VARCHAR(16)   NOT NULL DEFAULT 'library', -- library|unnamed|named
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenia_creatures_status ON lenia_creatures(status);

-- Player stamp interactions on Lenia layers
CREATE TABLE IF NOT EXISTS lenia_stamps (
    id          BIGSERIAL   PRIMARY KEY,
    faction_id  UUID        REFERENCES factions(id) ON DELETE CASCADE,
    layer       INTEGER     NOT NULL DEFAULT 3,
    x           INTEGER     NOT NULL,
    y           INTEGER     NOT NULL,
    kernel_id   VARCHAR(64) NOT NULL,  -- predefined stamp kernel identifier
    tick        BIGINT      NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenia_stamps_faction ON lenia_stamps(faction_id);
CREATE INDEX IF NOT EXISTS idx_lenia_stamps_tick    ON lenia_stamps(tick);

-- Creature sightings (for attribution + GHIFR earning)
CREATE TABLE IF NOT EXISTS lenia_sightings (
    id              BIGSERIAL   PRIMARY KEY,
    creature_id     UUID        REFERENCES lenia_creatures(id) ON DELETE CASCADE,
    faction_id      UUID        REFERENCES factions(id) ON DELETE SET NULL, -- last stamp attribution
    centroid_x      FLOAT       NOT NULL,
    centroid_y      FLOAT       NOT NULL,
    velocity        FLOAT       NOT NULL DEFAULT 0,
    stable_ticks    INTEGER     NOT NULL DEFAULT 0,
    ghifr_earned    NUMERIC(18,6) NOT NULL DEFAULT 0,
    tick            BIGINT      NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenia_sightings_creature ON lenia_sightings(creature_id);
CREATE INDEX IF NOT EXISTS idx_lenia_sightings_faction  ON lenia_sightings(faction_id);
