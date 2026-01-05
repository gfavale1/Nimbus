#!/usr/bin/env bash
set -e

echo "=== [Nimbus Frontend] Avvio script ==="

# Directory frontend (overrideabile)
FRONTEND_DIR="${FRONTEND_DIR:-/home/site/wwwroot/frontend}"

echo "[Nimbus Frontend] Directory frontend: $FRONTEND_DIR"

# Verifica directory
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "[ERRORE] Directory frontend non trovata: $FRONTEND_DIR"
  exit 1
fi

cd "$FRONTEND_DIR"

# Verifica Node / npm
if ! command -v node >/dev/null 2>&1; then
  echo "[ERRORE] Node.js non è installato"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERRORE] npm non è installato"
  exit 1
fi

echo "[Nimbus Frontend] Node version: $(node -v)"
echo "[Nimbus Frontend] npm version: $(npm -v)"

# Cartella build per Vite
BUILD_DIR="dist"

echo "[Nimbus Frontend] Verifica build ($BUILD_DIR)"

if [ ! -d "$BUILD_DIR" ]; then
  echo "[Nimbus Frontend] Build non trovata. Avvio build..."
  npm install
  npm run build
fi

# Verifica che la build esista davvero
if [ ! -d "$BUILD_DIR" ]; then
  echo "[ERRORE] Build fallita: cartella $BUILD_DIR non trovata"
  exit 1
fi

# Verifica/installa serve (una sola volta)
if ! command -v serve >/dev/null 2>&1; then
  echo "[Nimbus Frontend] Installazione 'serve'"
  npm install -g serve
fi

echo "[Nimbus Frontend] Avvio server statico su porta 8080"
exec serve -s "$BUILD_DIR" -l 8080
