# Daily Fleece — Claude Code guidance

## Domain value types (ADR-0010)

Never use raw primitives (`String`, `int`, `long`, `boolean`, …) for domain identifiers or constrained values in domain or application code. A raw primitive carries no meaning: callers can swap arguments silently and the compiler cannot distinguish a player ID from a display name. Use the richest type that expresses the concept.

| Concept | Type | Rationale |
|---|---|---|
| Player ID, Session ID | `java.util.UUID` | identity; compiler rejects accidental String swap |
| Session date | `java.time.LocalDate` | temporal semantics; rejects free-form strings |
| Company identifier | `de.dailyfleece.backend.player.api.CompanyId` | carries non-blank rule |
| Player name | `de.dailyfleece.backend.player.api.PlayerName` | carries non-blank rule; shared across modules |

When a new domain concept appears, ask: does a raw primitive let callers pass the wrong value silently? If yes, introduce a value type.

**Parsing happens at the boundary.** Controllers (infrastructure.web) receive raw input from HTTP and parse it into domain types before calling use cases. Domain and application code never accept raw primitives for domain concepts.

**MongoDB documents stay as strings.** Persistence adapters convert via `uuid.toString()` / `UUID.fromString()` and `.value()` / `new CompanyId(...)` in `fromDomain()` / `toDomain()`. IDs are stored as plain UUID strings (not BSON binary), so they remain human-readable in the shell.

**`PlayerName` is shared via a named interface.** It lives in `de.dailyfleece.backend.player.api` (annotated `@NamedInterface`). The quiz module declares `@ApplicationModule(allowedDependencies = "player :: api")` to access it. Do not duplicate this type in the quiz module.
