# ORIGO — Master TODO List
**Repo:** https://github.com/NeaBouli/origo  
**Stand:** Genesis Commit gepusht. Server startet nicht. 3 kritische Bugs offen.  
**Sprache:** Kommunikation Deutsch · Code/Commits Englisch  
**Ziel:** Von 0 auf lauffähige Web-App, dann Mobile, dann Token-Integration.

---

## 🔴 KRITISCHE BUGS — SOFORT FIXEN (Server startet nicht)

### BUG-001 — 6 fehlende Server-Module
`server/src/index.js` importiert 6 Module die nicht existieren. Server crasht beim Start.

- [ ] **BUG-001-A** — `server/src/api/auth.js` erstellen
  - Express Router
  - `POST /api/auth/register` — Email + Passwort → User in DB anlegen → JWT zurückgeben
  - `POST /api/auth/login` — Credentials prüfen → JWT zurückgeben
  - `GET  /api/auth/me` — JWT verifizieren → User-Daten zurückgeben
  - Middleware: `authenticateJWT(req, res, next)` exportieren für andere Router
  - Passwort: bcrypt hash, min 8 Zeichen
  - JWT: 30 Tage Gültigkeit, payload: `{ userId, factionId }`

- [ ] **BUG-001-B** — `server/src/api/faction.js` erstellen
  - Express Router
  - `POST /api/faction/create` — Neue Fraktion anlegen
    - Input: `{ name, color, patternId }` + Auth-Middleware
    - Validierung: name 2–24 Zeichen, color gültiges Hex, patternId in Bibliothek
    - Startzelle im Grid setzen (Seed-Pattern ab Pos `[10, 10]` + random offset)
    - DB: factions-Tabelle, ghifr_ledger Starteintrag 0
    - JWT neu ausstellen mit `factionId`
    - Response: `{ token, faction: { id, name, color, layer } }`
  - `GET  /api/faction/me` — Eigene Fraktion + Stats abrufen
  - `GET  /api/faction/leaderboard` — Top 50 nach Zellanzahl (aus Redis)
  - `GET  /api/faction/all` — Alle aktiven Fraktionen (Name, Farbe, Layer)

- [ ] **BUG-001-C** — `server/src/api/ghifr.js` erstellen
  - Express Router
  - `GET  /api/ghifr/balance` — Aktuelles GHIFR-Guthaben aus DB (Summe Ledger)
  - `GET  /api/ghifr/history` — Letzte 100 Ledger-Einträge
  - `GET  /api/ghifr/pool` — Aktueller Pool-Stand + Rate + aktive Spieler
  - Hilfsfunktion: `getBalance(factionId)` — Summe aller Ledger-Einträge

- [ ] **BUG-001-D** — `server/src/api/voucher.js` erstellen
  - Express Router
  - `POST /api/voucher/issue` — Voucher ausstellen
    - Input: `{ ghifrAmount }` (min 100 GHIFR)
    - Prüfen: Guthaben >= ghifrAmount
    - EIP-712 ECDSA signieren (ethers.js)
    - Nonce generieren (32 random bytes)
    - Expiry: jetzt + 24h
    - DB: vouchers-Tabelle INSERT
    - GHIFR-Ledger: negativer Eintrag (Deduktion)
    - Response: `{ voucher, signature }`
  - `GET  /api/voucher/list` — Eigene Voucher (issued, claimed, expired)
  - `GET  /api/voucher/status/:nonce` — Status eines Vouchers prüfen

- [ ] **BUG-001-E** — `server/src/jobs/fossil.js` erstellen
  - Cron-Job: täglich 02:00 UTC (`node-cron`)
  - Für alle Fossilien mit `status = 'active'`: `decay_day += 1`
  - Fossilien mit `decay_day >= 30`: `status = 'expired'`
  - Extinktions-Check: Fossilien-Dichte berechnen
    - `active_fossils / (GRID_COLS * GRID_ROWS)`
    - Wenn Dichte > 0.35: `triggerExtinctionEvent('density')` aufrufen
  - Extinktionsereignis-Funktion:
    - Älteste 20% der Fossilien auf `expired` setzen
    - WebSocket Event `{ type: 'event', event: 'extinction', data: { cleared, trigger } }` broadcasten
  - Exportieren: `startFossilJob(broker)` — broker für WS-Broadcast nötig

- [ ] **BUG-001-F** — `server/src/jobs/pool.js` erstellen
  - GHIFR Pool Distribution — läuft jeden Tick (aufgerufen von tick.js)
  - Funktion: `distributeGHIFR(cellCounts, generation)`
    - `cellCounts`: `{ factionId: anzahlZellen }` — kommt vom Conway Engine
    - Gesamtzellen berechnen
    - Pro Fraktion: `anteil = (eigeneZellen / gesamtZellen) * GHIFR_PER_CELL_PER_TICK`
    - Mindestbonus sicherstellen: `Math.max(anteil, MIN_PER_ACTIVE_TICK)`
    - Batch-Insert in `ghifr_ledger` (alle Fraktionen in einer Transaktion)
    - Alle 100 Ticks: GHIFR-Balance per WebSocket an jeweiligen Client senden
  - Funktion: `startPoolJob(broker)` — exportieren für server/index.js
  - Pool-Balance aus DB berechnen: Summe aller positiven Ledger-Einträge

---

### BUG-002 — `packages/renderer/` fehlt komplett
`packages/web/package.json` und `vite.config.js` referenzieren `@origo/renderer` — Package existiert nicht.

- [ ] **BUG-002-A** — `packages/renderer/package.json` erstellen
  - Name: `@origo/renderer`
  - Dependencies: `three`
  - Main: `src/index.js`

- [ ] **BUG-002-B** — `packages/renderer/src/index.js` erstellen
  - Re-exportiert alle Renderer-Klassen
  - `export { UniverseRenderer } from './UniverseRenderer.js'`
  - `export { ProcGen } from './ProcGen.js'`
  - `export { FossilRenderer } from './FossilRenderer.js'`

- [ ] **BUG-002-C** — `packages/renderer/src/UniverseRenderer.js` erstellen
  - Kopie/Refactor von `packages/web/src/renderer/UniverseRenderer.js`
  - Plattform-agnostisch (kein direkter DOM-Zugriff außer canvas)
  - Exports: `class UniverseRenderer`

- [ ] **BUG-002-D** — `packages/renderer/src/ProcGen.js` erstellen
  - Prozedurale Planetengenerierung via Perlin Noise
  - Funktion: `generatePlanetTexture(seed, width, height)` → Canvas / ImageData
  - Farbpaletten pro Planet-Typ: `earth | mars | alien | nebula | void`
  - Perlin Noise Implementierung (pure JS, keine externe Dep)
  - Exports: `class ProcGen`

- [ ] **BUG-002-E** — `packages/renderer/src/FossilRenderer.js` erstellen
  - Verwaltet Alpha-Decay der Fossil-Zellen im InstancedMesh
  - Funktion: `updateFossils(fossilData)` — `fossilData`: `[{ row, col, decayDay, color }]`
  - Alpha-Berechnung via `fossilAlpha(decayDay)` aus `@origo/core`
  - Separates InstancedMesh von lebenden Zellen
  - Exports: `class FossilRenderer`

---

### BUG-003 — Earth NASA Textur fehlt
`UniverseRenderer.js` lädt `/textures/earth_day.jpg` — Datei existiert nicht → Planet rendert grau.

- [ ] **BUG-003-A** — `packages/web/public/textures/` Ordner erstellen
- [ ] **BUG-003-B** — NASA Blue Marble Textur herunterladen
  - URL: `https://visibleearth.nasa.gov/images/73909` (public domain)
  - Dateiname: `earth_day.jpg`
  - Ablage: `packages/web/public/textures/earth_day.jpg`
  - Alternativ: `https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg` (direkt)
  - Auf 2048x1024 px reduzieren (Dateigröße < 2MB)
- [ ] **BUG-003-C** — Night-Textur optional: `earth_night.jpg` für dunkle Seite

---

## 🟡 PHASE 1 — SERVER VOLLSTÄNDIG MACHEN

### 1.1 — Datenbank

- [ ] **DB-001** — `db/migrate.js` testen
  - `npm run migrate` ausführen
  - Alle 6 Tabellen prüfen: `users, factions, ghifr_ledger, vouchers, fossils, patterns, pattern_votes`
  - Seed-Daten prüfen: 8 Patterns in `patterns`-Tabelle

- [ ] **DB-002** — GHIFR Balance View erstellen (Migration 002)
  - `CREATE VIEW ghifr_balances AS SELECT faction_id, SUM(amount) as balance FROM ghifr_ledger GROUP BY faction_id`
  - Schnellere Balance-Abfragen

- [ ] **DB-003** — Faction Stats View erstellen (Migration 003)
  - `CREATE VIEW faction_stats AS ...` — Name, Farbe, Layer, Balance, Rang

### 1.2 — Server Infrastruktur

- [ ] **SERVER-001** — `server/src/middleware/auth.js` erstellen
  - `authenticateJWT` Middleware — für alle geschützten Routen
  - JWT aus `Authorization: Bearer <token>` Header lesen
  - Bei ungültigem Token: `401 Unauthorized`
  - `req.user = { userId, factionId }` setzen

- [ ] **SERVER-002** — `server/src/middleware/validate.js` erstellen
  - Input-Validierung für alle API-Routen
  - Sanitierung von String-Inputs (XSS-Schutz)
  - Zahl-Validierungen für GHIFR-Beträge

- [ ] **SERVER-003** — `server/src/middleware/rateLimit.js` erstellen
  - Rate-Limiting pro IP: max 100 Requests / Minute
  - Voucher-Endpoint: max 5 / Stunde pro Fraktion
  - Zell-Platzierung: max 10 / Minute pro Fraktion

- [ ] **SERVER-004** — Error-Handler global (`server/src/middleware/errorHandler.js`)
  - Zentraler Express Error-Handler
  - Kein Stack-Trace in Production
  - Einheitliches Error-Response-Format: `{ error: string, code: string }`

- [ ] **SERVER-005** — `server/src/api/patterns.js` erstellen
  - `GET  /api/patterns/library` — Alle bekannten Patterns aus DB
  - `GET  /api/patterns/unnamed` — Patterns zur Benennung (Community Vote)
  - `POST /api/patterns/vote` — Vote für einen Namen einreichen
    - Quadratisches Voting: GHIFR-Kosten = `votesAlready^2`
    - GHIFR vom Guthaben abziehen
  - `GET  /api/patterns/votes/:patternId` — Abstimmungsstand

- [ ] **SERVER-006** — Pattern Detection in Conway Engine integrieren
  - Nach jedem Tick: `detectPatterns(grid, generation)` aufrufen
  - Bekannte Patterns (Bitmask-Matching) in aktiven Sektoren suchen
  - Neue stabile Patterns (50+ Generationen) flaggen
  - Neue Pattern-Kandidaten in DB schreiben (`status = 'unnamed'`)

- [ ] **SERVER-007** — Layer-Transition Logic (`server/src/engine/layerTransition.js`)
  - Prüfen ob eine Fraktion die Aufstiegsbedingung erfüllt
  - Bedingung: Stabile Struktur (aus Pattern-Bibliothek) 50+ Generationen
  - Bei Erfüllung: `factions.layer += 1` in DB
  - WebSocket Event: `{ type: 'event', event: 'layer_up', data: { factionId, layer } }`
  - Aufruf: alle 50 Ticks in `tick.js`

- [ ] **SERVER-008** — Snapshot-Endpoint (`server/src/ws/snapshot.js`)
  - Vollständigen Grid-State aus Redis lesen
  - Base64-kodiert an neu verbundene Clients senden
  - Bei fehlendem Redis-State: Aus Engine direkt lesen

### 1.3 — Conway Engine erweitern

- [ ] **ENGINE-001** — Custom Rules per Fraktion (`server/src/engine/conway.js`)
  - `setCustomRule(factionId, survive[], born[])` bereits vorhanden — testen
  - `getCustomRule(factionId)` hinzufügen
  - `clearCustomRule(factionId)` hinzufügen
  - DB-Integration: Custom Rules aus DB laden beim Server-Start

- [ ] **ENGINE-002** — Zell-Platzierung validieren
  - Prüfen ob Zelle frei ist (factionId === 0)
  - Max 10 Zellen pro Platzierungs-Request
  - Zellen dürfen nur in Layer-0-Bereich für Layer-0-Fraktionen
  - GHIFR-Kosten für Platzierung: 1 GHIFR pro Zelle

- [ ] **ENGINE-003** — Sektor-System (`server/src/engine/sector.js`)
  - Grid in 100×100 Sektoren unterteilen
  - Schlafende Sektoren: Nur 2-Zellen-Buffer aktiv
  - Wake-on-demand: Sektor aufwachen wenn Client ihn beobachtet
  - `getSectorState(sectorId)` — State für Snapshot

- [ ] **ENGINE-004** — Fossil-Registrierung bei Zelltod
  - Wenn Zelle stirbt (war alive, jetzt 0): Fossil-Eintrag in DB
  - Batch-Insert alle 10 Ticks (nicht jeden Tick wegen Performance)
  - Fossil-Daten: `{ faction_id, planet, col, row, death_generation }`

---

## 🟡 PHASE 1 — WEB CLIENT VOLLSTÄNDIG MACHEN

### 2.1 — UI Screens

- [ ] **WEB-001** — `packages/web/src/screens/Faction.jsx` erstellen
  - Eigene Fraktion Dashboard
  - Anzeige: Name, Farbe, Layer, Zellanzahl, Territorium %, Rang
  - GHIFR Balance + Verlauf (Linien-Chart)
  - Voucher anfordern: Eingabefeld + Button + Bestätigung
  - Aktive Voucher Liste (nonce, Betrag, Ablauf, Status)
  - Layer-Fortschrittsanzeige (wie viele Gens noch bis Aufstieg)

- [ ] **WEB-002** — `packages/web/src/screens/Leaderboard.jsx` erstellen
  - Top 50 Fraktionen nach Zellanzahl
  - Spalten: Rang, Name, Farbe, Layer, Territorium %, GHIFR verdient
  - Live-Updates via WebSocket
  - Eigene Fraktion hervorgehoben
  - Filter: Layer 0 / Layer 1 / Alle

- [ ] **WEB-003** — `packages/web/src/screens/Patterns.jsx` erstellen
  - Pattern-Bibliothek anzeigen (alle bekannten Patterns)
  - Unnamed Patterns: Community-Vote UI
    - Name vorschlagen (Input)
    - Abstimmen (kostet GHIFR, quadratisch)
    - Verbleibende Abstimmungszeit anzeigen
  - Eigene entdeckte Patterns hervorgehoben

- [ ] **WEB-004** — Navigation zwischen Screens
  - Bottom Navigation Bar: Universe | Faction | Leaderboard | Patterns
  - Aktiver Screen hervorgehoben
  - Transition-Animation zwischen Screens

- [ ] **WEB-005** — `packages/web/src/screens/Universe.jsx` erweitern
  - Planet-Navigation: Klick auf anderen Planeten im Makro-Zoom
  - Faction-Tooltip beim Hover über Zellen (Name, Farbe, Zellanzahl)
  - Zell-Platzierung im Mikro-Zoom: Klick = eigene Zelle platzieren
  - Platzierungskosten anzeigen (1 GHIFR / Zelle)
  - Bestätigungsdialog vor Platzierung

### 2.2 — Renderer erweitern

- [ ] **WEB-006** — Fossil-Rendering in `UniverseRenderer.js`
  - Separates InstancedMesh für Fossilien
  - Alpha-Decay visual (transparent werdend über 30 Tage)
  - Fossil-Daten via WebSocket empfangen

- [ ] **WEB-007** — Glow-Effekte für eigene Zellen
  - Eigene Fraktion: helleres Leuchten, `multiplyScalar(1.5)` bereits vorhanden
  - Pulsierender Effekt: `sin(time) * 0.1` auf Helligkeit
  - Neue Zellen: kurze Spawn-Animation (scale 0 → 1)

- [ ] **WEB-008** — Extinction Event Animation
  - Bei `event: 'extinction'` WebSocket-Nachricht
  - Shockwave-Ring expandiert vom Planeten-Zentrum
  - Particles-Burst für sterbende Fossilien
  - UI-Overlay: "EXTINCTION EVENT" mit Anzahl gelöschter Fossilien

- [ ] **WEB-009** — LOD (Level of Detail) System
  - Makro-Zoom: Planet als Sphere, Fraktionen als farbige Cluster (keine Einzelzellen)
  - Meso-Zoom: Einzelne Zellen sichtbar, keine Glow-Effekte
  - Mikro-Zoom: Volle Glow-Effekte, Fossil-Detail, Zell-Platzierung möglich
  - Automatischer Wechsel basierend auf Kamera-Distanz

- [ ] **WEB-010** — `packages/web/src/components/MiniMap.jsx` erstellen
  - Kleines 2D Grid-Overlay (rechts oben)
  - Fraktionsfarben als Punkte
  - Aktueller Viewport als Rahmen
  - Klick auf MiniMap springt zu dieser Position

### 2.3 — State & WebSocket

- [ ] **WEB-011** — WebSocket-Reconnect-Logik testen
  - Server neu starten → Client reconnected automatisch
  - Nach Reconnect: Snapshot empfangen, Grid korrekt neu aufgebaut
  - GHIFR-Balance nach Reconnect korrekt

- [ ] **WEB-012** — Offline-State
  - Wenn WebSocket getrennt: Overlay "Reconnecting..."
  - Planet weiterdrehen (Client-seitig) auch ohne Server
  - Kein Absturz bei fehlendem Grid

- [ ] **WEB-013** — `packages/web/src/store/uiStore.js` erstellen
  - Separater Store für UI-State (nicht Game-State)
  - Aktiver Screen, Modal-State, Toast-Notifications
  - Toast-System: `showToast(message, type)` — type: success|error|info

- [ ] **WEB-014** — Toast-Notification-System
  - `packages/web/src/components/Toast.jsx`
  - Automatisch verschwinden nach 3 Sekunden
  - Für: Zell-Platzierung, Voucher ausgestellt, Layer-Aufstieg, Extinktion

---

## 🟡 PHASE 1 — INFRASTRUKTUR

### 3.1 — Lokale Entwicklungsumgebung

- [ ] **INFRA-001** — Docker Compose testen
  - `npm run docker:up` — Postgres + Redis starten
  - Postgres Verbindung prüfen: `psql postgresql://origo:origo_dev@localhost:5432/origo`
  - Redis Verbindung prüfen: `redis-cli ping`

- [ ] **INFRA-002** — Migrations ausführen und verifizieren
  - `npm run migrate`
  - Alle Tabellen vorhanden: `\dt` in psql
  - Pattern-Seed-Daten vorhanden: `SELECT count(*) FROM patterns`

- [ ] **INFRA-003** — `server/.env` aus `.env.example` befüllen
  - `JWT_SECRET` — 64 Zeichen random string generieren
  - `VOUCHER_SIGNER_PRIVATE_KEY` — Temporären Test-Key (Sepolia) generieren
  - `GAME_CLAIM_POOL_ADDRESS` — Testnet-Adresse eintragen
  - `POSTGRES_URL` — Lokale Docker Postgres URL
  - `REDIS_URL` — Lokale Docker Redis URL

- [ ] **INFRA-004** — Erster `npm run dev` erfolgreich
  - Server startet ohne Fehler
  - `GET http://localhost:3000/health` → `{ status: 'ok' }`
  - Web Client startet: `http://localhost:5173`
  - WebSocket Verbindung aufbauen (nach Login)

- [ ] **INFRA-005** — `infra/scripts/dev-seed.js` erstellen
  - Test-User anlegen: `test@origo.app` / `password123`
  - 3 Test-Fraktionen anlegen mit verschiedenen Patterns
  - GHIFR-Guthaben: 1000 pro Test-Fraktion
  - Aufruf: `node infra/scripts/dev-seed.js`

### 3.2 — Testing

- [ ] **TEST-001** — Conway Engine Unit Tests (`server/src/engine/conway.test.js`)
  - Determinismus-Test: Gleicher Seed → Gleicher Output nach 100 Ticks
  - Bekannte Patterns: Glider überlebt 4 Ticks, korrekte Position
  - Torus-Wraparound: Zellen am Rand erscheinen gegenüber
  - Custom Rules: Fraktion mit Regel 4 überlebt bei 4 Nachbarn
  - Performance: 100×100 Grid, 1000 Ticks in < 1 Sekunde

- [ ] **TEST-002** — API Integration Tests
  - `POST /api/auth/register` → 201, JWT zurück
  - `POST /api/auth/login` → 200, JWT zurück
  - `POST /api/faction/create` → Fraktion in DB, Grid-Zellen gesetzt
  - `GET  /api/ghifr/balance` → korrekte Summe aus Ledger
  - `POST /api/voucher/issue` → signierter Voucher, GHIFR deduktiert

- [ ] **TEST-003** — WebSocket Integration Test
  - Client verbindet → Snapshot empfangen
  - Tick läuft → Delta empfangen, Grid korrekt gepatcht
  - Client trennt → reconnect → neuer Snapshot korrekt

- [ ] **TEST-004** — GHIFR Pool Mathematik
  - 3 Fraktionen, unterschiedliche Zellanzahl
  - Pool-Verteilung korrekt proportional
  - Nullsumme: Ausgezahltes <= Pool-Balance

---

## 🟢 PHASE 2 — RUST ENGINE

- [ ] **RUST-001** — Rust Workspace Setup (`engine/Cargo.toml`)
- [ ] **RUST-002** — `engine/src/lib.rs` — Public API definieren
- [ ] **RUST-003** — `engine/src/grid.rs` — Flat Uint8Array Grid
- [ ] **RUST-004** — `engine/src/conway.rs` — B3/S23 + Custom Rules
- [ ] **RUST-005** — `engine/src/sector.rs` — Sektor-Sleep/Wake + Buffer
- [ ] **RUST-006** — `engine/src/hashlife.rs` — Lazy Evaluation
- [ ] **RUST-007** — `engine/src/pattern.rs` — Pattern-Erkennung (Bitmask)
- [ ] **RUST-008** — WASM Build: `wasm-pack build --target web`
- [ ] **RUST-009** — Node.js Bridge: `server/src/engine/bridge.js` (FFI via napi-rs)
- [ ] **RUST-010** — JS Engine durch Rust Engine ersetzen (drop-in)
- [ ] **RUST-011** — Benchmark: 1000×1000 Grid, 10 Ticks/sec auf Hetzner CX21
- [ ] **RUST-012** — WASM für Client-seitige Preview (Onboarding 5-Gen-Vorschau)

---

## 🟢 PHASE 2 — REACT NATIVE MOBILE APP

- [ ] **MOBILE-001** — `packages/mobile/` Ordner anlegen
- [ ] **MOBILE-002** — `packages/mobile/package.json` — Expo + React Native
- [ ] **MOBILE-003** — Expo Setup: `npx create-expo-app`
- [ ] **MOBILE-004** — `@origo/core` als Dependency einbinden
- [ ] **MOBILE-005** — `@origo/renderer` für React Native anpassen (expo-gl)
- [ ] **MOBILE-006** — Three.js via `expo-three` und `expo-gl`
- [ ] **MOBILE-007** — Alle Screens aus Web nach Mobile portieren
- [ ] **MOBILE-008** — Touch-Gesten: Pinch-Zoom, Swipe-Rotation (react-native-gesture-handler)
- [ ] **MOBILE-009** — Push Notifications: Extinction Events, Layer-Aufstieg (Expo Notifications)
- [ ] **MOBILE-010** — iOS Build: `eas build --platform ios`
- [ ] **MOBILE-011** — Android Build: `eas build --platform android`
- [ ] **MOBILE-012** — App Store Submission (iOS)
- [ ] **MOBILE-013** — Google Play Submission (Android)

---

## 🟢 PHASE 2 — HETZNER DEPLOYMENT

- [ ] **DEPLOY-001** — Hetzner CX21 VPS bestellen (6 Euro/Monat, Standort: Nürnberg)
- [ ] **DEPLOY-002** — SSH Key hinterlegen, Root-Login deaktivieren
- [ ] **DEPLOY-003** — Ubuntu 24.04 LTS, Docker + Docker Compose installieren
- [ ] **DEPLOY-004** — Nginx installieren + konfigurieren (`infra/nginx.conf`)
  - Reverse Proxy: Port 80/443 → Server Port 3000
  - WebSocket Proxy: `proxy_http_version 1.1`, `Upgrade`, `Connection`
  - Static Files: Web Client Dist servieren
- [ ] **DEPLOY-005** — SSL via Let's Encrypt: `certbot --nginx -d origo.app`
- [ ] **DEPLOY-006** — Domain konfigurieren: `origo.app` → Hetzner IP
- [ ] **DEPLOY-007** — Production `.env` auf Server hinterlegen (sicher, nicht in Git)
- [ ] **DEPLOY-008** — `infra/scripts/deploy.sh` testen: `git pull && docker-compose up -d --build`
- [ ] **DEPLOY-009** — `infra/scripts/backup.sh` als Cron: täglich 03:00 UTC
  - Postgres Dump → `/mnt/backup/origo/`
  - Redis Dump → `/mnt/backup/origo/`
- [ ] **DEPLOY-010** — Monitoring: Uptime Kuma installieren
  - Health Check: `GET https://origo.app/health` alle 60s
  - Alert bei Ausfall: Telegram oder Email
- [ ] **DEPLOY-011** — GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
  - Trigger: Push auf `main`
  - Steps: npm test → SSH deploy → health check
- [ ] **DEPLOY-012** — Erster Production Deploy + Smoke Test

---

## 🔵 PHASE 3 — IFR TOKEN INTEGRATION

- [ ] **IFR-001** — `GameClaimPool.sol` von Inferno Dev Team anfordern (DevSpec übergeben)
- [ ] **IFR-002** — Contract auf Sepolia Testnet deployen + testen
- [ ] **IFR-003** — `GAME_CLAIM_POOL_ADDRESS` in `.env` eintragen (Testnet)
- [ ] **IFR-004** — End-to-End Voucher-Flow testen:
  - Spieler earned GHIFR → Voucher anfordern → auf ifrunit.tech einlösen → IFR erhalten
- [ ] **IFR-005** — 45% Revenue Buyback Mechanismus implementieren
  - Zahlungseingang erkennen (Stripe oder Crypto-Payment)
  - 45% automatisch in IFR-Kauf investieren
  - `deposit()` auf GameClaimPool aufrufen
- [ ] **IFR-006** — IFR-001 bis IFR-005 auf Mainnet wiederholen
- [ ] **IFR-007** — Als Builder bei Inferno registrieren (GitHub Issue)
- [ ] **IFR-008** — PartnerVault Integration (Creator Rewards)
- [ ] **IFR-009** — IFRLock Premium Features (optional Layer-Boost für IFR-Locker)

---

## 🔵 PHASE 3 — GAME FEATURES ERWEITERN

- [ ] **GAME-001** — Saisonale Regelverschiebung implementieren
  - Cron: 1x monatlich, 48h Dauer
  - B3/S23 → B36/S23 (oder ähnlich)
  - Alle Clients per WebSocket informieren
  - In `constants.js` konfigurierbar

- [ ] **GAME-002** — Allianzen-System
  - Keine direkte Kommunikation zwischen Spielern
  - Zell-Platzierung nahe anderer Fraktion: Allianz-Badge
  - Statistik: "Du hast X Generationen neben [Fraktion] überlebt"

- [ ] **GAME-003** — Mehrere Planeten (Layer 2+)
  - Planet-Definitionen in `constants.js`: Mars, Alien-Welt, etc.
  - Prozedurale Texturen via `ProcGen.js`
  - Navigation im Makro-Zoom: Klick auf anderen Planeten
  - Eigene Conway-Welt pro Planet (separates Grid)

- [ ] **GAME-004** — Spectator Mode
  - `GET /api/spectator/token` — Token ohne Fraktion (kein €1 nötig)
  - WebSocket-Verbindung: Nur SNAPSHOT + DELTA empfangen, kein Senden
  - Web Client: Spectator-Modus (kein Faction HUD, kein Zell-Platzieren)
  - Conversion: "Deine eigene Fraktion für €1 starten" CTA

- [ ] **GAME-005** — Transparenz-Dashboard
  - `GET /api/stats/pool` — Aktueller GHIFR-Pool
  - `GET /api/stats/rate` — Aktuelle Rate GHIFR/Tick
  - `GET /api/stats/players` — Aktive Spieler
  - Web: Öffentliche Stats-Seite (kein Login nötig)

---

## 📋 COMMIT-KONVENTIONEN

```
feat: neues Feature
fix: Bug behoben
chore: Infrastruktur/Config
test: Tests hinzugefügt
docs: Dokumentation
refactor: Code umstrukturiert
perf: Performance-Verbesserung
```

Beispiele:
```
fix: add missing server modules (BUG-001)
feat: implement GHIFR pool distribution
feat: add Three.js fossil alpha decay
chore: configure nginx reverse proxy
test: add Conway engine determinism tests
```

---

## 🚦 PRIORITÄTS-REIHENFOLGE FÜR CLAUDE CODE

**Sofort (Server startet nicht):**
1. BUG-001-A bis BUG-001-F (6 fehlende Module)
2. BUG-002-A bis BUG-002-E (renderer package)
3. BUG-003-A bis BUG-003-C (NASA Textur)

**Danach (Phase 1 abschließen):**
4. SERVER-001 bis SERVER-004 (Middleware)
5. INFRA-001 bis INFRA-004 (lokale Dev-Env läuft)
6. TEST-001 (Conway determinism sicherstellen)
7. WEB-001 bis WEB-004 (alle Screens)
8. INFRA-005 (Dev Seed)
9. TEST-002 bis TEST-004
10. SERVER-005 bis SERVER-008
11. ENGINE-001 bis ENGINE-004
12. WEB-005 bis WEB-014

**Phase 2:**
13. RUST-001 bis RUST-012
14. DEPLOY-001 bis DEPLOY-012
15. MOBILE-001 bis MOBILE-013

**Phase 3:**
16. IFR-001 bis IFR-009
17. GAME-001 bis GAME-005

---

*ORIGO TODO v1.0 — Vendetta Labs 2026*  
*Letzte Aktualisierung: Genesis Commit gepusht, 3 kritische Bugs offen*
