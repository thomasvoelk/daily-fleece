package de.dailyfleece.backend.player.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.shared.PlayerName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.modulith.test.ApplicationModuleTest;

/**
 * MongoPlayerRepository#resolveAfterDuplicateKey throws IllegalStateException when the retry query
 * after a DuplicateKeyException still finds nothing. No real player-delete or non-primary-read
 * scenario was found that reaches this (see df-0b86.6) -- this test forces it with a hand-written
 * MongoTemplate subclass that always misses on findOne and always raises DuplicateKeyException on
 * insert (no Mockito, per this repo's test conventions).
 */
@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class MongoPlayerRepositoryDuplicateKeyRaceFailureTest {

    @Autowired
    private MongoDatabaseFactory mongoDatabaseFactory;

    @Autowired
    private MongoConverter mongoConverter;

    private static final class AlwaysRacingMongoTemplate extends MongoTemplate {
        AlwaysRacingMongoTemplate(MongoDatabaseFactory dbFactory, MongoConverter converter) {
            super(dbFactory, converter);
        }

        @Override
        @SuppressWarnings("NullAway")
        public <T> T findOne(Query query, Class<T> entityClass) {
            return null;
        }

        @Override
        public <T> T insert(T objectToSave) {
            throw new DuplicateKeyException("forced duplicate key for test");
        }
    }

    @Test
    void getOrCreate_throws_when_retry_after_duplicate_key_finds_nothing() {
        var repository = new MongoPlayerRepository(new AlwaysRacingMongoTemplate(mongoDatabaseFactory, mongoConverter));

        assertThatThrownBy(() -> repository.getOrCreate(new CompanyId("comp-race"), new PlayerName("Thomas")))
                .isInstanceOf(IllegalStateException.class)
                .hasCauseInstanceOf(DuplicateKeyException.class);
    }
}
