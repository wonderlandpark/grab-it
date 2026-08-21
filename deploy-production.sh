#!/usr/bin/env bash
set -euo pipefail

# Deploy latest build from GHCR on the production server.
# Run on the server: ./deploy-production.sh

cd /home/ubuntu/mind-map

echo "Pulling latest code..."
git pull --ff-only

echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "Restarting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Done. Check http://localhost:3000 or https://mindmap.junseo.me"
