package de.dailyfleece.backend;

import com.mongodb.client.MongoClients;
import com.mongodb.client.model.CreateCollectionOptions;
import com.mongodb.client.model.ValidationAction;
import com.mongodb.client.model.ValidationLevel;
import com.mongodb.client.model.ValidationOptions;
import java.time.Duration;
import org.bson.Document;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.mongodb.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    MongoDBContainer mongoDbContainer() {
        var container = new MongoDBContainer(DockerImageName.parse("mongo:8.2"))
                .waitingFor(Wait.forLogMessage("(?i).*waiting for connections.*", 1)
                        .withStartupTimeout(Duration.ofSeconds(60)));
        container.start();
        applyMigrations(container.getConnectionString());
        return container;
    }

    private static void applyMigrations(String connectionString) {
        try (var client = MongoClients.create(connectionString)) {
            var parsed = new com.mongodb.ConnectionString(connectionString);
            var dbName =
                    (parsed.getDatabase() != null && !parsed.getDatabase().isBlank()) ? parsed.getDatabase() : "test";
            var db = client.getDatabase(dbName);

            db.createCollection(
                    "players",
                    new CreateCollectionOptions()
                            .validationOptions(new ValidationOptions()
                                    .validator(Document.parse("""
                                    {$jsonSchema: {
                                      bsonType: "object",
                                      required: ["_id", "companyId", "displayName"],
                                      additionalProperties: false,
                                      properties: {
                                        _id:         {bsonType: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
                                        companyId:   {bsonType: "string", minLength: 1},
                                        displayName: {bsonType: "string", minLength: 1}
                                      }
                                    }}
                                    """))
                                    .validationAction(ValidationAction.ERROR)
                                    .validationLevel(ValidationLevel.STRICT)));
            db.getCollection("players")
                    .createIndex(
                            new Document("companyId", 1), new com.mongodb.client.model.IndexOptions().unique(true));

            db.createCollection(
                    "sessions",
                    new CreateCollectionOptions()
                            .validationOptions(new ValidationOptions()
                                    .validator(Document.parse("""
                                    {$jsonSchema: {
                                      bsonType: "object",
                                      required: ["_id", "date", "phase", "players"],
                                      additionalProperties: false,
                                      properties: {
                                        _id:     {bsonType: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
                                        date:    {bsonType: "date"},
                                        phase:   {bsonType: "string", enum: ["LOBBY", "ACTIVE", "ENDED"]},
                                        players: {
                                          bsonType: "array",
                                          items: {
                                            bsonType: "object",
                                            required: ["playerId", "displayName"],
                                            additionalProperties: false,
                                            properties: {
                                              playerId:    {bsonType: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
                                              displayName: {bsonType: "string", minLength: 1}
                                            }
                                          }
                                        }
                                      }
                                    }}
                                    """))
                                    .validationAction(ValidationAction.ERROR)
                                    .validationLevel(ValidationLevel.STRICT)));
            db.getCollection("sessions")
                    .createIndex(new Document("date", 1), new com.mongodb.client.model.IndexOptions().unique(true));
        }
    }
}
