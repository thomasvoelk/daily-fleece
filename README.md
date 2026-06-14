# Daily Fleece 🦙

A mobile-first quiz app for daily standups. Two questions per session — knowledge and geography — played on players' own devices, with a running leaderboard.

## How it works

1. **Host uploads two photos** — a knowledge calendar page (Q1) and a geography location (Q2)
2. **Players join the lobby** via the app on their phones
3. **Host starts the quiz** — players answer Q1 (A/B/C) then Q2 (country on a map)
4. **Host reveals correct answers** after closing each voting round
5. **Leaderboard updates** automatically — 1 point per correct answer, max 2 per session

## Running locally

```bash
./start-app.sh
```

Starts the backend (Spring Boot + MongoDB via Docker Compose) and the Angular dev server. Both stop on Ctrl+C.

| Service  | Default URL               |
|----------|---------------------------|
| Frontend | http://localhost:4200     |
| Backend  | http://localhost:8080     |
| MongoDB  | localhost:27017           |

MongoDB runs with `start-only` lifecycle — it stays up between app restarts so you don't lose local data. Stop it manually with `docker compose -f backend/compose.local-dev.yml down`.

## Working on multiple branches

Install [worktrunk](https://github.com/worktrunk/worktrunk) (`wt`) to work on multiple branches simultaneously without port conflicts.

```bash
wt switch --create my-feature
```

The `post-start` hook writes `.wt.env` in the worktree with deterministic per-branch ports:

```
BACKEND_PORT=...
FRONTEND_PORT=...
LOCAL_DEV_MONGODB_PORT=...
```

`start-app.sh` picks these up automatically — each worktree gets its own isolated backend, frontend, and MongoDB. Run `cat .wt.env` to see the resolved ports.

When you remove a worktree (`wt remove`), the `post-remove` hook tears down its MongoDB container and volume.

## Dev setup

Code formatting (palantir-java-format for Java, Prettier for TypeScript/HTML/YAML) is enforced in CI. Unformatted code will fail the pipeline.

To auto-format on every commit, install [lefthook](https://github.com/evilmartians/lefthook) once after cloning:

```bash
brew install lefthook
lefthook install
```

lefthook is optional — the build and tests work without it. It is not required to run the app locally.

## Docs

- [`REQUIREMENTS.md`](REQUIREMENTS.md) — use cases and rules
- [`CONTEXT.md`](CONTEXT.md) — domain glossary
- [`docs/domain-model.md`](docs/domain-model.md) — entity model
- [`docs/adr/`](docs/adr/) — architecture decisions
