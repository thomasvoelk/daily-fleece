const SESSION_SCHEMA = {
    $jsonSchema: {
        bsonType: "object",
        required: ["_id", "projectId", "date", "phase", "players", "hostId"],
        additionalProperties: false,
        properties: {
            _id: {
                bsonType: "string",
                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
            },
            projectId: {
                bsonType: "string",
                minLength: 1
            },
            date: {
                bsonType: "date"
            },
            phase: {
                bsonType: "string",
                enum: ["LOBBY", "ACTIVE", "ENDED"]
            },
            hostId: {
                bsonType: "string",
                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
            },
            players: {
                bsonType: "array",
                items: {
                    bsonType: "object",
                    required: ["playerId", "displayName"],
                    additionalProperties: false,
                    properties: {
                        playerId: {
                            bsonType: "string",
                            pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                        },
                        displayName: {
                            bsonType: "string",
                            minLength: 1
                        }
                    }
                }
            },
            q1Voting: {
                bsonType: "object",
                required: ["status", "answers"],
                additionalProperties: false,
                properties: {
                    status: { bsonType: "string", enum: ["OPEN", "CLOSED"] },
                    answers: { bsonType: "object" },
                    correctAnswer: { bsonType: "string" }
                }
            },
            q2Voting: {
                bsonType: "object",
                required: ["status", "answers"],
                additionalProperties: false,
                properties: {
                    status: { bsonType: "string", enum: ["OPEN", "CLOSED"] },
                    answers: { bsonType: "object" },
                    correctAnswer: { bsonType: "string" }
                }
            }
        }
    }
};

// Backfill projectId on any documents written before this migration
db.sessions.updateMany(
    { projectId: { $exists: false } },
    { $set: { projectId: "default" } }
);

if (!db.getCollectionNames().includes("sessions")) {
    db.createCollection("sessions", {
        validator: SESSION_SCHEMA,
        validationAction: "error",
        validationLevel: "strict"
    });
} else {
    db.runCommand({
        collMod: "sessions",
        validator: SESSION_SCHEMA,
        validationAction: "error",
        validationLevel: "strict"
    });
}

// Replace the old date-only unique index with the compound (projectId, date) index
const indexes = db.sessions.getIndexes();
if (indexes.some(i => i.name === "date_1")) {
    db.sessions.dropIndex("date_1");
}
db.sessions.createIndex({ projectId: 1, date: 1 }, { unique: true });
