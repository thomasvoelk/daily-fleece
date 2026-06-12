# Frontend URL structure

All session-phase views are scoped under the session's natural key
`/session/:projectId/:date/` (e.g. `/session/default/2026-06-12/q1`). For the live
session, the frontend substitutes today's date (browser clock, same as ADR-0016).
For past sessions, any valid date can be used to navigate directly to historical views.

**Route table:**

| Route | View | Guard |
|---|---|---|
| `/` | Entry (identity) | none |
| `/session/:projectId/:date/lobby` | Lobby | player identity required |
| `/session/:projectId/:date/host` | Host Setup | player identity required |
| `/session/:projectId/:date/q1` | Q1 – Knowledge Question | live: identity required; ended: none |
| `/session/:projectId/:date/q2` | Q2 – Geography Question | live: identity required; ended: none |
| `/session/:projectId/:date/results` | Session Results | live: identity required; ended: none |
| `/leaderboard` | Leaderboard | none |

**Why Q1 and Q2 are separate routes:** During the Active Phase the current question is
determined by server state (which voting period is open), so the URL alone cannot
address Q1 vs Q2. Once a Session is Ended, both voting periods are closed and there is
no server signal to distinguish them — a separate URL is the only way to address each
question's Photo and post-reveal state independently.

**Past-session views are open (no identity guard):** Ended sessions show a read-only
post-reveal state — the Photo, answer options, and correct answer highlighted. No
personal data is exposed that warrants a gate. Personal highlights (your answer) are
shown when a player ID is found in localStorage; absent that, the view renders
without them. This degrades gracefully on new devices.

**Entry stays at `/`:** Identity establishment is a prerequisite for joining a Session
but is not itself a session phase. Scoping it under a session date would be misleading
(e.g. `/session/default/2026-06-10/entry` for a session from last week).

**Leaderboard stays at `/leaderboard`:** The Leaderboard is project-wide — it
aggregates all Sessions and belongs to the Project, not to any single Session date.

**Alternatives rejected:**

- **Flat routes (`/lobby`, `/quiz`, `/results`)** — the current shape. Cannot address
  past sessions at all; `ResultsStore` hardcodes `today`. No deep-linking into
  historical quiz views.
- **Flat routes + separate historical routes** — two routing shapes for the same
  conceptual views. More complex and inconsistent with ADR-0016.
- **Single `/quiz` route for both Q1 and Q2** — works during the Active Phase
  (server state determines the current question) but breaks for Ended sessions where
  both questions need to be individually addressable.
- **Guard past-session views behind identity** — adds friction with no benefit; the
  post-reveal state is the same view all players saw simultaneously.

**Constraints:**

- `projectId` is hardcoded to `"default"` in the frontend until multi-project support
  is implemented (same constraint as ADR-0016).
- The guard logic for Q1, Q2, and Results must inspect session phase: if Ended, allow
  unauthenticated access; if Active or Lobby, require a player ID.
