#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Source per-worktree port assignments; set -a exports all sourced vars to child processes
if [ -f "$ROOT/.wt.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.wt.env"
  set +a
  echo "Loaded .wt.env from $ROOT"
fi

export BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"

cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend (local-dev profile)..."
cd "$ROOT/backend"
./mvnw -q spring-boot:run -Dspring-boot.run.profiles=local-dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$ROOT/frontend"
npm start -- --port "${FRONTEND_PORT}" &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:${BACKEND_PORT}"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo ""
echo "Press Ctrl+C to stop both."

wait
