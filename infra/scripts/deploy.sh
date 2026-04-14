#!/bin/bash
set -e

REPO_DIR="/opt/origo"
WEB_DIST="/var/www/origo"

echo "=== ORIGO Deploy $(date) ==="

cd $REPO_DIR
git pull origin main

# Install + build
npm install --production
cd packages/web && npm run build
mkdir -p $WEB_DIST
cp -r dist/* $WEB_DIST/

# Restart server
cd $REPO_DIR
docker-compose -f infra/docker-compose.yml up -d postgres redis
node db/migrate.js
pm2 restart origo-server || pm2 start server/src/index.js --name origo-server

echo "=== Deploy complete ==="
curl -s http://localhost:3000/health
