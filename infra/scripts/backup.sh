#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backup/origo"
mkdir -p $BACKUP_DIR

# PostgreSQL
docker exec origo_postgres_1 pg_dump -U origo origo \
  | gzip > "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"

# Redis
docker exec origo_redis_1 redis-cli BGSAVE
sleep 2
docker cp origo_redis_1:/data/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Keep only last 7 backups
ls -t $BACKUP_DIR/postgres_*.gz | tail -n +8 | xargs rm -f

echo "Backup: $BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"
