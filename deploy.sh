#!/bin/bash
set -e
echo "=== Déploiement Eklesia ==="
cd ~/Development/nextjs_v/eklesia-recensement
echo "→ Récupération du code..."
git pull origin main
echo "→ Reconstruction de l'image..."
docker compose build app
echo "→ Redémarrage..."
docker compose up -d
echo "→ Nettoyage des anciennes images..."
docker image prune -f
echo "=== Déploiement terminé ==="
docker compose ps
