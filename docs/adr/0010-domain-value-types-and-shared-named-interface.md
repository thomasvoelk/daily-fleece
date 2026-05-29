# Domain value types and shared named interface for cross-module types

Primitive strings were used throughout the domain for IDs, dates, and user-entered values. We replace them with proper types so validation rules have exactly one home: `UUID` for IDs, `LocalDate` for session dates, and value objects (`CompanyId`, `DisplayName`) for strings that carry rules. Controllers are responsible for parsing raw strings into domain types and rejecting malformed input before it reaches the domain.

`DisplayName` must not be duplicated across modules — both `player` and `quiz` accept it from HTTP requests and must apply the same rules. We expose it from `de.dailyfleece.backend.player.api`, a package annotated with Spring Modulith's `@NamedInterface("api")`. The `quiz` module declares `allowedDependencies = "player :: api"`, giving it explicit, auditable access to that package only — not to `player.domain` or `player.application`.

## Considered options

- **Keep strings at the module boundary** — rejected: validation logic scatters into every controller that touches the value.
- **Each module defines its own `DisplayName`** — rejected: duplicated rules diverge silently.
- **Store BSON binary UUID in MongoDB** — rejected: `BinData(4, "...")` is hard to query manually. MongoDB documents keep `@Id String` and convert via `uuid.toString()` / `UUID.fromString()` in `fromDomain()` / `toDomain()`.
