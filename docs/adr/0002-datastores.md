# MongoDB as sole datastore

MongoDB is the sole datastore for all data: players, sessions, answers, scores, photo metadata, and live session state (current phase, voting status, answer counts). Photos are stored in MongoDB GridFS.

MongoDB was chosen over PostgreSQL — the other available CF service — partly as a deliberate learning exercise with document databases and schema validation, and partly because the session/answer data maps naturally to documents.

Valkey was considered for ephemeral live session state but dropped: the app's scale (one team, ~10–20 players) does not justify a second datastore. Session state is not truly ephemeral — phase, voting status, and answers all need to be persisted anyway. Removing Valkey also eliminates a CF service and its associated cost.

## Consequences

Photo files are stored in GridFS with a TTL index (see ADR-0005). Spring Data MongoDB provides the ORM-equivalent layer; schema validation is enforced at the MongoDB level via JSON Schema. Live session state lives on the Session document and is updated via atomic MongoDB operations.
