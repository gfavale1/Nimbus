#!/usr/bin/env bash
set -e

echo "=== [Nimbus Backend] Avvio script ==="

# Directory del backend
BACKEND_DIR="${BACKEND_DIR:-/home/site/wwwroot/backend}"

echo "[Nimbus Backend] Directory backend: $BACKEND_DIR"

# Verifica directory
if [ ! -d "$BACKEND_DIR" ]; then
  echo "[ERRORE] Directory backend non trovata: $BACKEND_DIR"
  exit 1
fi

cd "$BACKEND_DIR"

# Verifica Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "[ERRORE] Node.js non è installato"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERRORE] npm non è installato"
  exit 1
fi

echo "[Nimbus Backend] Node version: $(node -v)"
echo "[Nimbus Backend] npm version: $(npm -v)"

echo "[Nimbus Backend] Installazione dipendenze di produzione"
npm install --production

echo "[Nimbus Backend] Avvio server Node.js"
exec npm start
