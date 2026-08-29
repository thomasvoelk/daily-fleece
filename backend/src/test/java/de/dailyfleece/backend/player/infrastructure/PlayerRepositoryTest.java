package de.dailyfleece.backend.player.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import de.dailyfleece.backend.shared.PlayerName;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class PlayerRepositoryTest {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void getOrCreate_creates_new_player_for_new_company_id() {
        Player player = playerRepository.getOrCreate(new CompanyId("comp-it-1"), new PlayerName("Thomas"));

        assertThat(player.playerId()).isNotNull();
        assertThat(player.companyId()).isEqualTo(new CompanyId("comp-it-1"));
        assertThat(player.displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void getOrCreate_returns_same_player_id_for_same_company_id() {
        Player first = playerRepository.getOrCreate(new CompanyId("comp-it-2"), new PlayerName("Thomas"));
        Player second = playerRepository.getOrCreate(new CompanyId("comp-it-2"), new PlayerName("Thomas"));

        assertThat(second.playerId()).isEqualTo(first.playerId());
    }

    @Test
    void findById_returns_existing_player() {
        Player created = playerRepository.getOrCreate(new CompanyId("comp-it-3"), new PlayerName("Anna"));

        assertThat(playerRepository.findById(created.playerId())).contains(created);
    }

    @Test
    void findById_returns_empty_for_unknown_id() {
        assertThat(playerRepository.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    void concurrent_getOrCreate_for_same_company_id_returns_the_same_player_and_persists_once() throws Exception {
        CompanyId companyId = new CompanyId("comp-it-race");
        int threadCount = 8;
        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        try {
            Callable<Player> task = () -> {
                ready.countDown();
                start.await();
                return playerRepository.getOrCreate(companyId, new PlayerName("Thomas"));
            };
            List<Future<Player>> futures = new ArrayList<>();
            for (int i = 0; i < threadCount; i++) {
                futures.add(executor.submit(task));
            }
            ready.await();
            start.countDown();

            List<Player> results = new ArrayList<>();
            for (Future<Player> future : futures) {
                results.add(future.get());
            }

            assertThat(results).allMatch(player -> player.equals(results.get(0)));
            long persistedCount =
                    mongoTemplate.getCollection("players").countDocuments(new Document("companyId", companyId.value()));
            assertThat(persistedCount).isEqualTo(1);
        } finally {
            executor.shutdown();
        }
    }
}
