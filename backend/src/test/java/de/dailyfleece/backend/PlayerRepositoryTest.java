package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PlayerRepositoryTest {

    @Autowired
    private PlayerRepository playerRepository;

    @Test
    void getOrCreate_creates_new_player_for_new_company_id() {
        Player player = playerRepository.getOrCreate(new CompanyId("comp-it-1"), new DisplayName("Thomas"));

        assertThat(player.playerId()).isNotNull();
        assertThat(player.companyId()).isEqualTo(new CompanyId("comp-it-1"));
        assertThat(player.displayName()).isEqualTo(new DisplayName("Thomas"));
    }

    @Test
    void getOrCreate_returns_same_player_id_for_same_company_id() {
        Player first = playerRepository.getOrCreate(new CompanyId("comp-it-2"), new DisplayName("Thomas"));
        Player second = playerRepository.getOrCreate(new CompanyId("comp-it-2"), new DisplayName("Thomas"));

        assertThat(second.playerId()).isEqualTo(first.playerId());
    }

    @Test
    void findById_returns_existing_player() {
        Player created = playerRepository.getOrCreate(new CompanyId("comp-it-3"), new DisplayName("Anna"));

        assertThat(playerRepository.findById(created.playerId())).contains(created);
    }

    @Test
    void findById_returns_empty_for_unknown_id() {
        assertThat(playerRepository.findById(java.util.UUID.randomUUID())).isEmpty();
    }
}
