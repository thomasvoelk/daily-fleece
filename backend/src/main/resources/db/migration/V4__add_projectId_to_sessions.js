// Backfill projectId on any documents written before this migration
db.sessions.updateMany(
    { projectId: { $exists: false } },
    { $set: { projectId: "default" } }
);

db.runCommand({
    collMod: "sessions",
    validator: {
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
    },
    validationAction: "error",
    validationLevel: "strict"
});

db.sessions.dropIndex({ date: 1 });
db.sessions.createIndex({ projectId: 1, date: 1 }, { unique: true });
