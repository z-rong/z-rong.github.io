#!/usr/bin/env bash
set -euo pipefail

echo "Deploying readme-viewer..."
TARGET="/var/www/readme-viewer"
mkdir -p "$TARGET"
cp -r ./* "$TARGET"/
echo "Deploy finished at $(date)"
