# origo — Backlog & Startflow

## 🚀 STARTFLOW (für neue Claude Code Session)

1. Lies `CLAUDE.md` — Projektkontext, Stack, Dateipfade, Do-NOT-touch
2. Lies `TODO.md` — Master Task List mit Prioritätsreihenfolge (Sektion 🚦)
3. Lies dieses `BACKLOG.md` — Aktueller Stand + was als nächstes dran ist
4. **Server startet NICHT** — 3 kritische Bugs offen (BUG-001, BUG-002, BUG-003)
5. Beginne mit BUG-001-A (`server/src/api/auth.js`) — Details in TODO.md

## 📌 Stand: 2026-04-13

- **HEAD:** `534252a` — `docs: replace TODO with full master task list`
- **Rollback-Tag:** `pre-session-20260413` → `534252a`
- **Remote:** https://github.com/NeaBouli/origo — synchron mit main
- **Clean Tree:** Ja (bis auf `.claude/`, `BACKLOG.md`, `CLAUDE.md` unversioniert)

## 🔴 Aktiv — Nächste Session MUSS hier starten

### Server startet nicht (3 kritische Blocker)

**BUG-001 — 6 fehlende Server-Module** (KEINES existiert)
- `server/src/api/` Ordner existiert NICHT
- `server/src/jobs/` hat nur `tick.js`, es fehlt `fossil.js` und `pool.js`
- Reihenfolge: auth.js → faction.js → ghifr.js → voucher.js → fossil.js → pool.js
- Alle Details + Specs in `TODO.md` Sektion BUG-001-A bis BUG-001-F

**BUG-002 — `packages/renderer/` fehlt komplett**
- `@origo/renderer` wird referenziert in `vite.config.js` und `packages/web/package.json`
- Package muss angelegt werden: `UniverseRenderer.js`, `ProcGen.js`, `FossilRenderer.js`
- Details in `TODO.md` Sektion BUG-002-A bis BUG-002-E

**BUG-003 — Earth NASA Textur fehlt**
- `packages/web/public/textures/earth_day.jpg` nicht vorhanden → Planet rendert grau
- NASA Blue Marble Textur herunterladen (public domain)
- Details in `TODO.md` Sektion BUG-003-A bis BUG-003-C

### Was existiert bereits (funktioniert)

- Monorepo-Struktur mit npm workspaces
- `server/src/index.js` — Express + WS Setup (importiert die fehlenden Module)
- `server/src/engine/conway.js` — Conway Engine (JS, funktional)
- `server/src/ws/broker.js` — WebSocket Broker
- `server/src/db/client.js` — PostgreSQL Client
- `server/src/cache/redis.js` — Redis Client
- `server/src/jobs/tick.js` — Tick Job (ruft Conway Engine)
- `packages/core/` — Shared Lib (grid.js, gameStore.js, wsClient.js, constants.js)
- `packages/web/` — React + Three.js Client Skeleton (Vite)
- `db/migrations/001_init.sql` — DB Schema (6 Tabellen + 8 Seed Patterns)
- `infra/docker-compose.yml` — Postgres + Redis + Server
- `docs/` — Konzept PDF + DevSpec PDF + Architecture.md

## 🟡 Nächste Session (nach BUGs gefixt)

1. SERVER-001 bis SERVER-004 — Middleware (auth, validate, rateLimit, errorHandler)
2. INFRA-001 bis INFRA-004 — Docker testen, Migrations laufen, erster `npm run dev`
3. TEST-001 — Conway Engine Determinismus-Tests
4. WEB-001 bis WEB-004 — UI Screens (Faction, Leaderboard, Patterns, Navigation)

## 🟢 Später (Phase 1 Rest + Phase 2)

- Siehe TODO.md Sektion 🚦 PRIORITÄTS-REIHENFOLGE (Punkte 5-17)

## ✅ Erledigt

- [x] Genesis Commit gepusht (dd31501)
- [x] TODO + Bug Tracker erstellt (d300d73)
- [x] Master Task List (100+ Tasks) finalisiert (534252a)
- [x] CLAUDE.md + BACKLOG.md als Kontext-Dateien angelegt
- [x] Remote auf GitHub synchronisiert

---
*Zuletzt aktualisiert: 2026-04-13*
