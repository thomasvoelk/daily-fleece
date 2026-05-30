if (!db.getCollectionNames().includes("players")) {
    db.createCollection("players", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["_id", "companyId", "displayName"],
                additionalProperties: false,
                properties: {
                    _id: {
                        bsonType: "string",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                    },
                    companyId: {
                        bsonType: "string",
                        minLength: 1
                    },
                    displayName: {
                        bsonType: "string",
                        minLength: 1
                    }
                }
            }
        },
        validationAction: "error",
        validationLevel: "strict"
    });

    db.players.createIndex({ companyId: 1 }, { unique: true });
}
