#!/usr/bin/env bash
# Levanta Chrome sin interfaz, ejecuta la prueba y lo apaga al terminar.
set -euo pipefail

PROFILE="$(mktemp -d)"
CHROME="${CHROME_BIN:-$(command -v google-chrome || command -v chromium || true)}"

if [ -z "$CHROME" ]; then
  echo "No se encontro Chrome. Instalalo o define CHROME_BIN." >&2
  exit 1
fi

"$CHROME" --headless=new --disable-gpu --no-sandbox \
  --remote-debugging-port=9222 --user-data-dir="$PROFILE" about:blank \
  > "$PROFILE/chrome.log" 2>&1 &
CHROME_PID=$!
# Se espera a que Chrome cierre del todo antes de borrar su perfil: si no,
# sigue escribiendo en el directorio y el borrado falla.
cleanup() {
  kill "$CHROME_PID" 2>/dev/null || true
  wait "$CHROME_PID" 2>/dev/null || true
  rm -rf "$PROFILE"
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  curl -sf http://127.0.0.1:9222/json/version > /dev/null 2>&1 && break
  sleep 0.25
done

node "$(dirname "$0")/checkout.mjs"
