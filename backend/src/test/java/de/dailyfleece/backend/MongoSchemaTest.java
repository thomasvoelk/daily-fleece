package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mongodb.MongoWriteException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class MongoSchemaTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    // --- players ---

    @Test
    void players_rejects_blank_companyId() {
        assertThatThrownBy(() -> mongoTemplate
                        .getCollection("players")
                        .insertOne(validPlayer().append("companyId", "")))
                .isInstanceOf(MongoWriteException.class);
    }

    @Test
    void players_rejects_extra_field() {
        assertThatThrownBy(() -> mongoTemplate
                        .getCollection("players")
                        .insertOne(validPlayer().append("unexpected", "value")))
                .isInstanceOf(MongoWriteException.class);
    }

    @Test
    void players_rejects_missing_displayName() {
        Document doc = new Document("_id", uuid()).append("companyId", "acme");
        assertThatThrownBy(() -> mongoTemplate.getCollection("players").insertOne(doc))
                .isInstanceOf(MongoWriteException.class);
    }

    // --- sessions ---

    @Test
    void sessions_rejects_unknown_phase() {
        assertThatThrownBy(() -> mongoTemplate
                        .getCollection("sessions")
                        .insertOne(validSession().append("phase", "INVALID")))
                .isInstanceOf(MongoWriteException.class);
    }

    @Test
    void sessions_rejects_extra_field() {
        assertThatThrownBy(() -> mongoTemplate
                        .getCollection("sessions")
                        .insertOne(validSession().append("unexpected", "value")))
                .isInstanceOf(MongoWriteException.class);
    }

    @Test
    void sessions_rejects_missing_date() {
        Document doc = new Document("_id", uuid()).append("phase", "LOBBY").append("players", List.of());
        assertThatThrownBy(() -> mongoTemplate.getCollection("sessions").insertOne(doc))
                .isInstanceOf(MongoWriteException.class);
    }

    // --- fs.files ---

    @Test
    void fs_files_has_ttl_index_on_uploadDate_expiring_after_28_days() {
        assertThat(mongoTemplate.getDb().getCollection("fs.files").listIndexes())
                .filteredOn(idx -> {
                    Document key = idx.get("key", Document.class);
                    return key != null && key.containsKey("uploadDate");
                })
                .hasSize(1)
                .allSatisfy(
                        idx -> assertThat(idx.getInteger("expireAfterSeconds")).isEqualTo(2419200));
    }

    // --- helpers ---

    private static Document validPlayer() {
        return new Document("_id", uuid()).append("companyId", "acme").append("displayName", "Thomas");
    }

    private static Document validSession() {
        return new Document("_id", uuid())
                .append("date", Instant.now())
                .append("phase", "LOBBY")
                .append("players", List.of())
                .append("hostId", uuid());
    }

    private static String uuid() {
        return UUID.randomUUID().toString();
    }
}
