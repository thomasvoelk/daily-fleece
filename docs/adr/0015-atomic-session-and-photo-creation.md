# Session creation is atomic with photo upload

A host creates a session by submitting a single multipart `POST /sessions` request that contains both photos (Q1 and Q2) and the host's identity. The session enters the Lobby phase immediately and fully — there is no draft or partially-configured state.

**We reject the two-step alternative** (create session first, upload photos separately) for three reasons:

1. **No partial state to manage.** A session that exists but lacks photos would need a pre-Lobby phase, a guard on `POST /sessions/{id}/start`, and client logic to handle the incomplete case. That complexity has no payoff in this app.

2. **Matches the host's actual workflow.** The host photographs the calendar page and the geography location before opening the app, then submits both in one action. Splitting this into two network round-trips adds friction for no UX gain.

3. **Simpler API surface.** Session existence is a sufficient precondition for all subsequent operations. Clients do not need to check photo-upload status separately; if the session exists, both photos are present.

## Consequences

- `POST /sessions` is the only way to upload photos. There is no endpoint to replace a photo after session creation (deferred; not currently needed).
- Photo retrieval is via `GET /sessions/{id}/photos/{question}`, not via IDs in `SessionResponse`. GridFS ObjectIds are an infrastructure detail and never exposed to clients.
- The host is automatically added to the player list on creation; no separate join call is needed.
