# ORIGO

> *A persistent multiplayer universe governed by Conway's Game of Life.*

**The Earth is the beginning. The universe has no end.**

---

## Overview

ORIGO is a persistent multiplayer app where thousands of users simultaneously inhabit a shared navigable universe. Every faction's evolution is determined entirely by Conway's mathematical rules — no randomness, no pay-to-win. The better strategist wins.

Players earn in-game GHIFR particles through cell survival. External exchange to $IFR tokens happens via the Inferno Protocol (ifrunit.tech).

## Architecture

```
origo/
├── packages/
│   ├── core/       # Shared game logic, WebSocket client, GHIFR state
│   ├── renderer/   # Three.js universe scene (web + mobile shared)
│   ├── web/        # React web application (Phase 1)
│   └── mobile/     # React Native app (Phase 2)
├── server/         # Node.js WebSocket server + Conway tick
├── engine/         # Rust Conway simulation core
├── db/             # PostgreSQL migrations
└── infra/          # Docker, Hetzner deployment
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Simulation | Rust (Conway engine) |
| Server | Node.js + WebSocket |
| Cache | Redis |
| Database | PostgreSQL |
| Web Client | React + Three.js |
| Mobile | React Native (Phase 2) |
| Infrastructure | Hetzner VPS |

## Getting Started

```bash
# Clone
git clone https://github.com/NeaBouli/origo
cd origo

# Install dependencies
npm install

# Copy env
cp server/.env.example server/.env
# Edit server/.env with your values

# Start infrastructure
npm run docker:up

# Run migrations
npm run migrate

# Start dev (server + web client)
npm run dev
```

## Documentation

- `docs/ORIGO_Konzept_v2.pdf` — Full game design concept (German)
- `docs/GameClaimPool_DevSpec.pdf` — IFR integration spec
- `docs/ARCHITECTURE.md` — Developer architecture reference

## License

Private — Vendetta Labs 2026
