# ORIGO — Master TODO List v1.1
**Repo:** https://github.com/NeaBouli/origo  
**Stand:** Genesis Commit gepusht + Lenia Phase 1 integriert.  
**Sprache:** Kommunikation Deutsch · Code/Commits Englisch

---

## 🔴 KRITISCHE BUGS — SOFORT (Server startet nicht)

### BUG-001 — 6 fehlende Server-Module
- [ ] **BUG-001-A** `server/src/api/auth.js`
  - Express Router
  - `POST /api/auth/register` → User in DB + JWT
  - `POST /api/auth/login` → JWT
  - `GET  /api/auth/me` → User-Daten
  - Export: `authenticateJWT` Middleware
  - Passwort: bcrypt, min 8 Zeichen · JWT: 30 Tage, payload `{ userId, factionId }`

- [ ] **BUG-001-B** `server/src/api/faction.js`
  - `POST /api/faction/create` — Input: `{ name, color, patternId }` + Auth
    - Validierung: name 2–24, color Hex, patternId in Bibliothek
    - Startzelle im Grid setzen, GHIFR-Ledger 0 anlegen
    - Response: `{ token, faction: { id, name, color, layer } }`
  - `GET  /api/faction/me` — Eigene Fraktion + Stats
  - `GET  /api/faction/leaderboard` — Top 50 nach Zellanzahl
  - `GET  /api/faction/all` — Alle aktiven Fraktionen

- [ ] **BUG-001-C** `server/src/api/ghifr.js`
  - `GET /api/ghifr/balance` — Summe Ledger
  - `GET /api/ghifr/history` — Letzte 100 Einträge
  - `GET /api/ghifr/pool` — Pool-Stand, Rate, aktive Spieler
  - Hilfsfunktion: `getBalance(factionId)`

- [ ] **BUG-001-D** `server/src/api/voucher.js`
  - `POST /api/voucher/issue` — min 100 GHIFR, EIP-712 ECDSA, Nonce, 24h Expiry
  - `GET  /api/voucher/list` — Eigene Voucher
  - `GET  /api/voucher/status/:nonce` — Voucher-Status

- [ ] **BUG-001-E** `server/src/jobs/fossil.js`
  - Cron täglich 02:00 UTC
  - `decay_day += 1` für alle aktiven Fossilien
  - `decay_day >= 30` → `status = 'expired'`
  - Dichte-Check → Extinktionsereignis bei > 35%
  - Export: `startFossilJob(broker)`

- [ ] **BUG-001-F** `server/src/jobs/pool.js`
  - `distributeGHIFR(cellCounts, generation)` — proportionale Verteilung
  - Batch-Insert ghifr_ledger pro Tick
  - Alle 100 Ticks: Balance per WS senden
  - Export: `startPoolJob(broker)`

---

### BUG-002 — `packages/renderer/` fehlt komplett
- [ ] **BUG-002-A** `packages/renderer/package.json` — Name: `@origo/renderer`
- [ ] **BUG-002-B** `packages/renderer/src/index.js` — Re-exportiert alle Renderer-Klassen inkl. `LeniaRenderPass`
- [ ] **BUG-002-C** `packages/renderer/src/UniverseRenderer.js` — Kopie aus web, plattform-agnostisch
- [ ] **BUG-002-D** `packages/renderer/src/ProcGen.js` — Perlin Noise Planetentexturen, 5 Biom-Typen
- [ ] **BUG-002-E** `packages/renderer/src/FossilRenderer.js` — Alpha-Decay InstancedMesh, separat von Lebend-Zellen
- [ ] **BUG-002-F** `packages/renderer/src/LeniaRenderPass.js` — Kopie aus web (bereits erstellt, hier nur verlinken)

---

### BUG-003 — NASA Earth Textur fehlt
- [ ] **BUG-003-A** `packages/web/public/textures/` Ordner anlegen
- [ ] **BUG-003-B** NASA Blue Marble herunterladen → `earth_day.jpg` (2048×1024, < 2MB)
  - URL: `https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg`
- [ ] **BUG-003-C** Optional: `earth_night.jpg` für Nachtseite

---

## 🟡 PHASE 1 — LENIA (BEREITS GESTARTET)

### LENIA-P1 — Client-seitiger Render Pass (kein Server, kein DB)
*Status: LeniaRenderPass.js und updated UniverseRenderer.js bereits erstellt.*

- [x] **LENIA-P1-A** `packages/web/src/renderer/LeniaRenderPass.js` erstellt
  - WebGL ShaderMaterial: Gaussian Convolution über Conway-Grid
  - ORIGO Gold/Teal Farbramp
  - Tunable: kernel radius R, sigma
  - `tick(dt)` für Animation-Clock
  - `updateGrid(grid, colors, myId)` bei jedem Delta

- [x] **LENIA-P1-B** `UniverseRenderer.js` updated
  - `LeniaRenderPass` integriert — overlay sphere bei radius 1.003
  - `setLeniaMode(bool)` — Toggle binary ↔ Lenia
  - `getLeniaMode()` — aktuellen Status abfragen
  - Lenia-Pass läuft immer mit (updateGrid auch wenn disabled), kein Performance-Problem

- [x] **LENIA-P1-C** `FactionHUD.jsx` updated
  - "RENDER MODE" Toggle-Button: Binary ↔ Lenia
  - `lenia-toggle` Window-Event für State-Sync

- [x] **LENIA-P1-D** `packages/web/.env.example` erstellt
  - `VITE_LENIA_RENDER=true` Feature Flag

- [x] **LENIA-P1-E** Lenia-Konstanten in `@origo/core/src/constants.js`
  - `LENIA_KERNEL_RADIUS`, `LENIA_SIGMA`, `LENIA_GRID_W/H`, `LENIA_TICK_MS`
  - `LENIA_DELTA_EPSILON`, Similarity-Thresholds, `WS_LENIA`, `LENIA_EARN`

- [ ] **LENIA-P1-F** `packages/web/.env` aus `.env.example` anlegen (lokal, nicht in Git)
- [ ] **LENIA-P1-G** Lenia-Pass im Browser testen
  - Toggle an/aus, kein Absturz
  - Organische Übergänge sichtbar beim Conway-Tick
  - Performance: < 5ms GPU pro Frame auf Mid-Range Hardware
- [ ] **LENIA-P1-H** Lenia Sigma + Radius als Settings-Slider im HUD (optional)

---

## 🟡 PHASE 1 — SERVER VOLLSTÄNDIG MACHEN

### 1.1 — Infrastruktur Middleware
- [ ] **SERVER-001** `server/src/middleware/auth.js` — `authenticateJWT(req,res,next)`
- [ ] **SERVER-002** `server/src/middleware/validate.js` — Input-Sanitierung, XSS-Schutz
- [ ] **SERVER-003** `server/src/middleware/rateLimit.js` — 100 req/min pro IP, 5 Voucher/h pro Fraktion
- [ ] **SERVER-004** `server/src/middleware/errorHandler.js` — Zentraler Error-Handler

### 1.2 — Datenbank
- [ ] **DB-001** `npm run migrate` — alle Tabellen anlegen, Seed verifizieren
- [ ] **DB-002** `db/migrations/002_lenia.sql` bereits erstellt — wird in Phase 3 ausgeführt (nicht jetzt)
- [ ] **DB-003** GHIFR Balance View: `CREATE VIEW ghifr_balances AS SELECT faction_id, SUM(amount) AS balance FROM ghifr_ledger GROUP BY faction_id`
- [ ] **DB-004** Faction Stats View: Name, Farbe, Layer, Balance, Rang

### 1.3 — Pattern System
- [ ] **SERVER-005** `server/src/api/patterns.js`
  - `GET  /api/patterns/library` — Alle bekannten Patterns
  - `GET  /api/patterns/unnamed` — Patterns zur Community-Abstimmung
  - `POST /api/patterns/vote` — Quadratisches Voting (GHIFR-Kosten = votes²)
  - `GET  /api/patterns/votes/:patternId` — Abstimmungsstand

- [ ] **SERVER-006** Pattern Detection in `server/src/jobs/tick.js`
  - Nach jedem Tick: Bekannte Patterns suchen (Bitmask-Matching)
  - Neue stabile Patterns (50+ Gens) als `unnamed` flaggen
  - DB-INSERT für neue Kandidaten

- [ ] **SERVER-007** `server/src/engine/layerTransition.js`
  - Aufstiegsbedingung prüfen alle 50 Ticks
  - DB: `factions.layer += 1`
  - WS Event: `{ type: 'event', event: 'layer_up', data: { factionId, layer } }`

- [ ] **SERVER-008** `server/src/ws/snapshot.js` — Vollständiger Grid-State auf Reconnect

### 1.4 — Conway Engine erweitern
- [ ] **ENGINE-001** Custom Rules per Fraktion testen + DB-Integration beim Start laden
- [ ] **ENGINE-002** Zell-Platzierung validieren: max 10/Request, Sektor-Check, 1 GHIFR/Zelle
- [ ] **ENGINE-003** `server/src/engine/sector.js` — 100×100 Sektoren, Sleep/Wake, 2-Cell-Buffer
- [ ] **ENGINE-004** Fossil-Registrierung bei Zelltod — Batch-Insert alle 10 Ticks

### 1.5 — Web Client Screens
- [ ] **WEB-001** `packages/web/src/screens/Faction.jsx`
  - GHIFR-Balance, Verlauf (Chart), Voucher anfordern, Layer-Fortschritt

- [ ] **WEB-002** `packages/web/src/screens/Leaderboard.jsx`
  - Top 50, Live-Updates, Layer-Filter

- [ ] **WEB-003** `packages/web/src/screens/Patterns.jsx`
  - Pattern-Bibliothek, Community-Vote-UI, Quadratic-Voting-Kosten anzeigen

- [ ] **WEB-004** Navigation (Bottom Bar) — Universe | Faction | Leaderboard | Patterns

- [ ] **WEB-005** `Universe.jsx` erweitern — Faction-Tooltip, Zell-Platzierung im Micro-Zoom

### 1.6 — Renderer erweitern
- [ ] **WEB-006** Fossil Alpha-Decay in `UniverseRenderer.js` — separates InstancedMesh
- [ ] **WEB-007** Glow-Effekte: `sin(time)` Puls auf eigene Zellen, Spawn-Animation
- [ ] **WEB-008** Extinction Event Animation — Shockwave-Ring + UI-Overlay
- [ ] **WEB-009** LOD-System — Makro: Cluster · Meso: Zellen · Mikro: Full Glow
- [ ] **WEB-010** `packages/web/src/components/MiniMap.jsx`

### 1.7 — State & Stabilität
- [ ] **WEB-011** WebSocket-Reconnect-Test — nach Server-Neustart Snapshot korrekt
- [ ] **WEB-012** Offline-State — "Reconnecting..." Overlay, kein Absturz
- [ ] **WEB-013** `packages/web/src/store/uiStore.js` — UI-State, Toast-System
- [ ] **WEB-014** `packages/web/src/components/Toast.jsx`

### 1.8 — Testing
- [ ] **TEST-001** Conway Engine Determinismus-Test
- [ ] **TEST-002** API Integration Tests (auth, faction, ghifr, voucher)
- [ ] **TEST-003** WebSocket-Test (snapshot, delta, reconnect)
- [ ] **TEST-004** GHIFR Pool-Mathematik (Nullsumme, Proportionalität)
- [ ] **TEST-005** Lenia Render Pass — Toggle an/aus, kein Frame-Drop, korrekte GPU-Last

### 1.9 — Lokale Dev-Umgebung
- [ ] **INFRA-001** `npm run docker:up` — Postgres + Redis starten
- [ ] **INFRA-002** `npm run migrate` — Tabellen verifizieren
- [ ] **INFRA-003** `server/.env` aus `.env.example` befüllen
- [ ] **INFRA-004** `npm run dev` — Server + Web Client ohne Fehler
- [ ] **INFRA-005** `infra/scripts/dev-seed.js` — Test-User + 3 Fraktionen + 1000 GHIFR

---

## 🟢 PHASE 2 — RUST ENGINE (Pflicht vor Lenia Phase 3)

> ⚠️ Lenia Phase 3 ist HARD-GATED auf Rust Engine. Kein Lenia-Layer vor RUST-008.

- [ ] **RUST-001** `engine/Cargo.toml` — Workspace Setup
- [ ] **RUST-002** `engine/src/lib.rs` — Public API
- [ ] **RUST-003** `engine/src/grid.rs` — Flat Uint8Array Grid
- [ ] **RUST-004** `engine/src/conway.rs` — B3/S23 + Custom Rules per Fraktion
- [ ] **RUST-005** `engine/src/sector.rs` — Sektor-Sleep/Wake + Buffer
- [ ] **RUST-006** `engine/src/hashlife.rs` — Lazy Evaluation / Quad-Tree
- [ ] **RUST-007** `engine/src/pattern.rs` — Bitmask Pattern-Erkennung
- [ ] **RUST-008** `engine/src/lenia.rs` — **Lenia Prerequisite**
  - 2D FFT Convolution via `rustfft` Crate
  - Growth Function G als Gaussian Bell Curve (konfigurierbares mu, sigma)
  - Grid-State: `Vec<f32>` W×H, double-buffered
  - `tick()` via FFI (napi-rs)
  - `stamp_inject(x, y, kernel: &[f32], width: usize)` für Spieler-Interaktion
  - Delta-Encoder: nur Zellen wo `|new - old| > EPSILON (0.001)`
  - f32 (nicht f64) — halbe Memory-Bandwidth, ausreichende Präzision
- [ ] **RUST-009** WASM Build: `wasm-pack build --target web` (für Onboarding-Preview)
- [ ] **RUST-010** napi-rs Bridge: `server/src/engine/bridge.js`
- [ ] **RUST-011** JS Engine durch Rust Engine ersetzen (drop-in Interface)
- [ ] **RUST-012** Benchmark: 1000×1000 Conway + 512×512 Lenia gleichzeitig auf CX21

---

## 🟢 PHASE 2 — HETZNER DEPLOYMENT

- [ ] **DEPLOY-001** Hetzner CX22 (€4.35/Monat) — Phase 1 ausreichend
- [ ] **DEPLOY-002** SSH Key, Root-Login deaktivieren, Ubuntu 24.04
- [ ] **DEPLOY-003** Docker + Docker Compose + Node.js 20 installieren
- [ ] **DEPLOY-004** Nginx Reverse Proxy + WebSocket Proxy konfigurieren
- [ ] **DEPLOY-005** SSL via Let's Encrypt: `certbot --nginx -d origo.app`
- [ ] **DEPLOY-006** Domain `origo.app` → Hetzner IP
- [ ] **DEPLOY-007** Production `.env` sicher hinterlegen (nicht in Git)
- [ ] **DEPLOY-008** `infra/scripts/deploy.sh` testen
- [ ] **DEPLOY-009** `infra/scripts/backup.sh` als Cron täglich 03:00 UTC
- [ ] **DEPLOY-010** Monitoring: Uptime Kuma, Health-Check alle 60s
- [ ] **DEPLOY-011** GitHub Actions CI/CD: push main → test → deploy → health-check
- [ ] **DEPLOY-012** Phase 3 Upgrade: Hetzner CCX13 (€17/Monat, dedicated AMD vCPU)
  - Rust Engine + Lenia 512×512 FFT (~5ms/tick) — problemlos

---

## 🟢 PHASE 2 — REACT NATIVE MOBILE

- [ ] **MOBILE-001** `packages/mobile/` — Expo + React Native Setup
- [ ] **MOBILE-002** `@origo/core` + `@origo/renderer` als Dependencies
- [ ] **MOBILE-003** Three.js via `expo-three` + `expo-gl`
- [ ] **MOBILE-004** `LeniaRenderPass` für Mobile anpassen (expo-gl Kontext)
- [ ] **MOBILE-005** Touch-Gesten: Pinch-Zoom, Swipe (react-native-gesture-handler)
- [ ] **MOBILE-006** Push Notifications: Extinction Events, Layer-Aufstieg
- [ ] **MOBILE-007** Alle Screens portieren
- [ ] **MOBILE-008** iOS Build: `eas build --platform ios`
- [ ] **MOBILE-009** Android Build: `eas build --platform android`
- [ ] **MOBILE-010** App Store + Google Play Submission

---

## 🔵 PHASE 3 — LENIA LAYER (nach Rust Engine)

> ⚠️ Alle LENIA-P3 Tasks ERST nach RUST-008 starten.

### LENIA-P3 — Server
- [ ] **LENIA-P3-A** `server/src/jobs/lenia_tick.js`
  - Ruft Rust `lenia.tick()` via napi-rs auf
  - Berechnet Delta (Epsilon 0.001), zlib-komprimiert
  - Broadcast `lenia_delta` WS Message an Layer-3+ Subscriber
  - Tick-Interval: 3000ms (konfig in `.env`)

- [ ] **LENIA-P3-B** `server/src/api/lenia.js`
  - `POST /api/lenia/stamp` — Spieler-Interaktion: Kernel-Stamp auf Grid
    - Input: `{ x, y, kernelId }` — kernelId aus vordefinierter Palette
    - Server appliziert Stamp auf kanonisches Grid vor nächstem Tick
    - DB: lenia_stamps INSERT
    - Attribution: letzte Stamp-Interaktion im 30-Tick-Fenster = GHIFR credit
  - `GET  /api/lenia/creatures` — Bekannte Lenia-Kreaturen aus Katalog
  - `GET  /api/lenia/sightings` — Aktuelle Kreaturen auf Layer 3+

- [ ] **LENIA-P3-C** WebSocket Broker erweitern
  - `lenia_delta` Message Type hinzufügen
  - `lenia_stamp` Message Type empfangen + an `lenia.js` API weiterleiten
  - Subscription-Filter: `lenia_delta` nur an Layer-3+ Clients

- [ ] **LENIA-P3-D** `server/src/jobs/lenia_detect.js` — Background Detection
  - Gradient-Magnitude-Scan alle 10 Ticks
  - Connected Components → Creature-Kandidaten
  - Feature-Vektor: Zentroid, Bounding Box, Mean, Variance, Velocity
  - Cosine-Similarity gegen Katalog (Threshold 0.92 = Match)
  - Novel-Kandidat bei < 0.85 nach 50 stabilen Ticks → Community-Vote

### LENIA-P3 — Datenbank
- [ ] **LENIA-P3-E** Migration 002 ausführen: `lenia_creatures`, `lenia_stamps`, `lenia_sightings`
- [ ] **LENIA-P3-F** `db/seeds/lenia_catalog.js` — Chan's canonical Lenia catalog importieren
  - Quelle: lenia.world / arXiv:2005.03742 Appendix
  - Empfehlung: 20 stabilste Solitons als Startbestand
  - Redis Cache: Creature-Kernels als Float32-Arrays für schnelle Matching

### LENIA-P3 — Client
- [ ] **LENIA-P3-G** `LeniaRenderPass.js` für Phase 3 erweitern
  - `applyLeniaDelta(deltaPatches)` — Float32-Patches aus WS-Stream anwenden
  - Render-Buffer: lokal (read-only für Game-Logic), kein lokales Simulieren
  - Creature-Detection visuell: leuchtender Outline um erkannte Kreaturen

- [ ] **LENIA-P3-H** Layer-3+ UI
  - Stamp-Picker: vordefinierte Kernel-Palette (8–12 Stamps)
  - Creature-Tooltip beim Hover: Name, Typ, Velocity, GHIFR-Rate
  - "ALIEN TIME" Tick-Indikator (3s statt 1s)

- [ ] **LENIA-P3-I** Community-Naming für Lenia-Kreaturen
  - Bestehender Quadratic-Voting-Flow wiederverwendet — keine Änderungen nötig
  - Nur: Pattern-Typ in Voting-Komponente auf `lenia_creature` setzen

### LENIA-P3 — GHIFR Economy
- [ ] **LENIA-P3-J** `pool.js` für Layer 3+ adaptieren
  - Earning via Creature-Sighting (nicht Zellanzahl)
  - Multiplier: still=1×, oscillator=1.5×, spaceship=2×, novel=5× (one-time)
  - Attribution: letzte Stamp-Interaktion im 30-Tick-Fenster
  - Kein Transfer zwischen Layer-3-Pool und Layer-0/1/2-Pools

### LENIA-P3 — Infrastruktur
- [ ] **LENIA-P3-K** Hetzner CCX13 upgraden (€17/Monat) — dedicated CPU für FFT
- [ ] **LENIA-P3-L** Lenia-Tick-Rate über `.env` konfigurierbar: `LENIA_TICK_MS=3000`
- [ ] **LENIA-P3-M** Benchmark: 512×512 Lenia + 2048×2048 Conway parallel auf CCX13

---

## 🔵 PHASE 3 — IFR TOKEN INTEGRATION

- [ ] **IFR-001** GameClaimPool.sol — Inferno Dev Team Übergabe (DevSpec bereits erstellt)
- [ ] **IFR-002** Contract auf Sepolia Testnet deployen
- [ ] **IFR-003** End-to-End Voucher Flow testen (GHIFR → Voucher → ifrunit.tech → IFR)
- [ ] **IFR-004** 45% Revenue Buyback — `deposit()` auf GameClaimPool
- [ ] **IFR-005** Mainnet Deploy
- [ ] **IFR-006** Builder-Registrierung Inferno (GitHub Issue)
- [ ] **IFR-007** PartnerVault Integration (Creator Rewards)
- [ ] **IFR-008** Optional: IFRLock Premium Features (Layer-Boost für IFR-Locker)

---

## 🔵 PHASE 3 — WEITERE GAME FEATURES

- [ ] **GAME-001** Saisonale Regelverschiebung (1×/Monat, 48h, B36/S23)
- [ ] **GAME-002** Allianzen-Statistik (Nachbarschafts-Tracking)
- [ ] **GAME-003** Mehrere Planeten (Layer 2+ prozedurale Texturen via ProcGen.js)
- [ ] **GAME-004** Spectator Mode (Token ohne Fraktion, WS read-only)
- [ ] **GAME-005** Transparenz-Dashboard (Pool, Rate, Spieler, öffentlich)

---

## 📋 COMMIT-KONVENTIONEN
```
feat:     neues Feature
fix:      Bug behoben
chore:    Infrastruktur/Config
test:     Tests hinzugefügt
docs:     Dokumentation
refactor: Code umstrukturiert
perf:     Performance
lenia:    Lenia-spezifische Änderungen
```

---

## 🚦 PRIORITÄTS-REIHENFOLGE FÜR CLAUDE CODE

**Sofort — Server startet nicht:**
1. BUG-001-A bis BUG-001-F
2. BUG-002-A bis BUG-002-F
3. BUG-003-A bis BUG-003-C

**Phase 1 — Lauffähige Dev-Env:**
4. LENIA-P1-F, LENIA-P1-G (Lenia im Browser testen)
5. SERVER-001 bis SERVER-004 (Middleware)
6. INFRA-001 bis INFRA-004 (Docker, Migrations, npm run dev)
7. TEST-001, TEST-005 (Conway + Lenia Pass)
8. WEB-001 bis WEB-004 (Screens)
9. INFRA-005 (Dev Seed)
10. TEST-002 bis TEST-004
11. SERVER-005 bis SERVER-008
12. ENGINE-001 bis ENGINE-004
13. WEB-005 bis WEB-014

**Phase 2 (Rust Engine — Pflicht vor Lenia P3):**
14. RUST-001 bis RUST-008 (Lenia Engine in Rust)
15. RUST-009 bis RUST-012
16. DEPLOY-001 bis DEPLOY-011

**Phase 3 (Lenia Layer — nur nach RUST-008):**
17. LENIA-P3-A bis LENIA-P3-M (in dieser Reihenfolge)
18. IFR-001 bis IFR-008
19. GAME-001 bis GAME-005

---

*ORIGO TODO v1.1 — Lenia Integration · Vendetta Labs 2026*  
*Lenia Spec: ORIGO_Lenia_Integration_Spec.docx · Conway Spec: ORIGO_Konzept_v2.pdf*
