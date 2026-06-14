#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend (local-dev profile)..."
cd "$ROOT/backend"
DOCKER_HOST=unix:///var/run/docker.sock ./mvnw -q spring-boot:run -Dspring-boot.run.profiles=local-dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$ROOT/frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop both."

wait
