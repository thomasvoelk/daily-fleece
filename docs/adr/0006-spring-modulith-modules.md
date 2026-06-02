# Two Spring Modulith modules: quiz and player

The backend is structured as two Spring Modulith modules: `quiz` and `player`. The `quiz` module owns the session lifecycle, lobby, voting, questions, and photo storage. The `player` module owns player identity, scores, and the leaderboard.

The boundary is event-driven: when the Host sets the Q2 Correct Answer (ending the session), `quiz` publishes a `SessionEndedDomainEvent` carrying precomputed per-player session points `[{ playerId, displayName, pointsEarned }]`; `player` consumes it to update the Leaderboard document atomically. The leaderboard is updated once per session — not after each question. Individual answer data stays embedded in the Session document inside `quiz` — `player` never reads it directly. `quiz` never imports `player` internals — it references players by ID only.

This split was chosen because the Leaderboard has a different lifecycle from Sessions (it persists and accumulates across many sessions) and has no reason to know how sessions run. The module boundary aligns with the collection boundary: `quiz` owns the `sessions` collection; `player` owns the `players` and `leaderboard` collections.
