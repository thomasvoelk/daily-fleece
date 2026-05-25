# Daily Fleece 🦙

A mobile-first quiz app for daily standups. Two questions per session — knowledge and geography — played on players' own devices, with a running leaderboard.

## How it works

1. **Host uploads two photos** — a knowledge calendar page (Q1) and a geography location (Q2)
2. **Players join the lobby** via the app on their phones
3. **Host starts the quiz** — players answer Q1 (A/B/C) then Q2 (country on a map)
4. **Host reveals correct answers** after closing each voting round
5. **Leaderboard updates** automatically — 1 point per correct answer, max 2 per session

## Running locally

**Backend**

```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**

```bash
cd frontend
npm install
npm start
```

## Docs

- [`REQUIREMENTS.md`](REQUIREMENTS.md) — use cases and rules
- [`CONTEXT.md`](CONTEXT.md) — domain glossary
- [`docs/domain-model.md`](docs/domain-model.md) — entity model
- [`docs/adr/`](docs/adr/) — architecture decisions
