#!/usr/bin/env bash
set -euo pipefail

# Deploy latest build from GHCR on the production server.
# Run on the server: ./deploy-production.sh

cd /home/ubuntu/mind-map

echo "Pulling latest code..."
git pull --ff-only

echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "Starting database..."
docker compose -f docker-compose.prod.yml up -d db

echo "Applying new database migrations..."
docker exec mind-map-db-1 psql -v ON_ERROR_STOP=1 -U emotion_map -d emotion_map -c \
  'CREATE TABLE IF NOT EXISTS "_mindmap_migrations" ("name" TEXT PRIMARY KEY, "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW());'

for migration_file in prisma/migrations/*/migration.sql; do
  migration_name="$(basename "$(dirname "$migration_file")")"
  applied="$(docker exec mind-map-db-1 psql -U emotion_map -d emotion_map -tAc \
    "SELECT 1 FROM \"_mindmap_migrations\" WHERE \"name\" = '$migration_name';")"
  if [[ "$applied" != "1" ]]; then
    docker exec -i mind-map-db-1 psql -v ON_ERROR_STOP=1 -U emotion_map -d emotion_map < "$migration_file"
    docker exec mind-map-db-1 psql -v ON_ERROR_STOP=1 -U emotion_map -d emotion_map -c \
      "INSERT INTO \"_mindmap_migrations\" (\"name\") VALUES ('$migration_name');"
  fi
done

echo "Restarting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Done. Check http://localhost:3000 or https://mindmap.junseo.me"
