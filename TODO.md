# ORIGO — TODO & Bug Tracker

> Maintained by Claude (Dev-Agent) + Core Dev. Updated each session.
> Last updated: 2026-04-02

---

## CRITICAL BUGS (Blockers — Server won't start)

- [ ] **BUG-001** `server/src/index.js` imports 6 missing modules:
  - `./jobs/fossil.js` — fossil decay scheduled job
  - `./jobs/pool.js` — GHIFR pool distribution job
  - `./api/auth.js` — auth REST router (register, login, JWT)
  - `./api/faction.js` — faction CRUD REST router
  - `./api/ghifr.js` — GHIFR balance/history REST router
  - `./api/voucher.js` — voucher signing REST router
- [ ] **BUG-002** `@origo/web` depends on `@origo/renderer` package — `packages/renderer/` directory missing entirely
- [ ] **BUG-003** `packages/web/src/renderer/UniverseRenderer.js` loads `/textures/earth_day.jpg` — no `public/textures/` directory or texture file exists

---

## Phase 1 — MVP (Web Client Playable)

### Server
- [ ] **TODO-001** Create `server/src/api/auth.js` — register (email/wallet), login, JWT token issuance
- [ ] **TODO-002** Create `server/src/api/faction.js` — create faction, get faction, list factions
- [ ] **TODO-003** Create `server/src/api/ghifr.js` — get balance, get history, earn endpoint
- [ ] **TODO-004** Create `server/src/api/voucher.js` — request voucher, sign with ethers, claim status
- [ ] **TODO-005** Create `server/src/jobs/fossil.js` — daily cron: increment decay_day, mark expired fossils
- [ ] **TODO-006** Create `server/src/jobs/pool.js` — per-tick GHIFR distribution to surviving factions
- [ ] **TODO-007** GHIFR earning integration in tick loop — credit factions based on living cell count
- [ ] **TODO-008** Pattern detection engine — detect stable/oscillating patterns after N generations
- [ ] **TODO-009** Layer transition logic — promote factions to next layer when pattern criteria met
- [ ] **TODO-010** Fossil creation — write dead cells to `fossils` table on faction extinction

### Packages
- [ ] **TODO-011** Create `packages/renderer/` — shared Three.js scene module (used by web + future mobile)
- [ ] **TODO-012** Add Earth texture to `packages/web/public/textures/earth_day.jpg`
- [ ] **TODO-013** Onboarding flow completion — wire `screens/Onboarding.jsx` to POST `/api/auth/register` + `/api/faction`

### Web Client
- [ ] **TODO-014** Cell placement UI — tap planet surface → send `place_cells` via WS
- [ ] **TODO-015** Faction color picker in onboarding
- [ ] **TODO-016** GHIFR balance display in HUD (real-time from WS)
- [ ] **TODO-017** Fossil rendering layer (semi-transparent decaying cells)
- [ ] **TODO-018** Pattern library browser UI
- [ ] **TODO-019** Voucher redemption UI — request → show QR/link for on-chain claim

### Infrastructure
- [ ] **TODO-020** `npm install` — run workspace install, verify all deps resolve
- [ ] **TODO-021** Docker Compose smoke test — `npm run docker:up` → Postgres + Redis healthy
- [ ] **TODO-022** DB migration test — `npm run migrate` runs 001_init.sql without errors
- [ ] **TODO-023** End-to-end dev startup — `npm run dev` boots server + web client

---

## Phase 2 — Scale & Mobile

- [ ] **TODO-030** Rust/WASM Conway engine — drop-in replacement for `server/src/engine/conway.js`
- [ ] **TODO-031** React Native mobile app (`packages/mobile/`)
- [ ] **TODO-032** Sector-based grid partitioning — only send deltas for visible sectors
- [ ] **TODO-033** Redis pub/sub for multi-server horizontal scaling
- [ ] **TODO-034** Hetzner VPS deployment scripts + CI/CD
- [ ] **TODO-035** Rate limiting on REST API + WS message throttling
- [ ] **TODO-036** Admin dashboard — live grid stats, connected users, GHIFR economy metrics

---

## Phase 3 — Economy & Governance

- [ ] **TODO-040** IFR token integration via Inferno GameClaimPool contract
- [ ] **TODO-041** Pattern naming vote system (community governance)
- [ ] **TODO-042** Extinction events — trigger when fossil density > 35%
- [ ] **TODO-043** Weekly GHIFR minimum distribution
- [ ] **TODO-044** Leaderboard — top factions by cells, GHIFR, patterns discovered

---

## Done

_(Move completed items here with date)_

- [x] **2026-04-02** Genesis commit — full monorepo scaffolding pushed to GitHub
