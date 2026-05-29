package de.dailyfleece.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class MyMongoIntegrationTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void canQueryDatabase() {
        // This is the simplest possible interaction: 
        // verify we can reach the database and get its name.
        String dbName = mongoTemplate.getDb().getName();
        assertThat(dbName).isEqualTo("test"); // Default for MongoDB test containers
    }
}