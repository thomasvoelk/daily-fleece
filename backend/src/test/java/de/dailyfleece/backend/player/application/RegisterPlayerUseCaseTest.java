package de.dailyfleece.backend.player.application;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class RegisterPlayerUseCaseTest {

    @Autowired
    private RegisterPlayerUseCase useCase;

    @Autowired
    private PlayerRepository playerRepository;

    @Test
    void register_returns_player_with_given_display_name() {
        Player player = useCase.register(new CompanyId("comp-uc-1"), new PlayerName("Thomas"));

        assertThat(player.displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void register_persists_the_player() {
        Player player = useCase.register(new CompanyId("comp-uc-2"), new PlayerName("Thomas"));

        assertThat(playerRepository.findById(player.playerId())).contains(player);
    }

    @Test
    void register_same_company_id_returns_same_player_id() {
        Player first = useCase.register(new CompanyId("comp-uc-3"), new PlayerName("Thomas"));
        Player second = useCase.register(new CompanyId("comp-uc-3"), new PlayerName("Thomas"));

        assertThat(second.playerId()).isEqualTo(first.playerId());
    }
}
