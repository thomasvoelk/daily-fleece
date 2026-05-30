if (!db.getCollectionNames().includes("sessions")) {
    db.createCollection("sessions", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["_id", "date", "phase", "players"],
                additionalProperties: false,
                properties: {
                    _id: {
                        bsonType: "string",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                    },
                    date: {
                        bsonType: "date"
                    },
                    phase: {
                        bsonType: "string",
                        enum: ["LOBBY", "ACTIVE", "ENDED"]
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
                    }
                }
            }
        },
        validationAction: "error",
        validationLevel: "strict"
    });

    db.sessions.createIndex({ date: 1 }, { unique: true });
}
