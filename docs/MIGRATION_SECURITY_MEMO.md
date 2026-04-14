# MIGRATION SECURITY MEMO
## Projekt: ORIGO
## Datum: 14.04.2026

### Was wurde gefixt
- .gitignore: *.pem, *.key, credentials.json, serviceAccountKey.json hinzugefuegt
- .gitleaks.toml erstellt (JWT Secret, ETH Private Key, DB Password)
- .github/workflows/security-audit.yml erstellt

### Bei Migration beachten
- [ ] server/.env ist Kopie von .env.example — alle Werte MUESSEN geaendert werden
- [ ] JWT_SECRET MUSS ein langer Zufallsstring sein (nicht "change_this_to_a_long_random_secret")
- [ ] VOUCHER_SIGNER_PRIVATE_KEY MUSS ein echter Key sein (nicht 0x0...01)
- [ ] POSTGRES_PASSWORD MUSS stark sein (nicht "password" oder "origo_dev")
- [ ] docker-compose.yml hat Fallback-Password "origo_dev" — ENV-Var setzen!
- [ ] Server startet aktuell NICHT (3 kritische Bugs — siehe TODO.md BUG-001-A)

### Benoetigte ENV-Variablen
- POSTGRES_URL
- REDIS_URL
- JWT_SECRET
- VOUCHER_SIGNER_PRIVATE_KEY
- GAME_CLAIM_POOL_ADDRESS
- NODE_ENV

### Was NIE auf den Server darf
- .env mit Placeholder-Werten (sofort aendern!)
- Lokale Entwickler-Wallets

### Migrations-Reihenfolge
1. BUG-001-A fixen (server/src/api/auth.js) — Server startet nicht
2. Restliche 5 fehlende Module implementieren
3. PostgreSQL + Redis aufsetzen
4. Starke Credentials in .env setzen
5. Docker Compose Stack starten
6. Funktionstest (WebSocket + Conway Engine)
