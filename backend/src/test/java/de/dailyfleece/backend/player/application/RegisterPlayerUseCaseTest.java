package de.dailyfleece.backend.player.application;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.player.domain.InMemoryPlayerRepository;
import de.dailyfleece.backend.player.domain.Player;
import org.junit.jupiter.api.Test;

class RegisterPlayerUseCaseTest {

    private final InMemoryPlayerRepository playerRepository = new InMemoryPlayerRepository();
    private final RegisterPlayerUseCase useCase = new RegisterPlayerUseCase(playerRepository);

    @Test
    void register_returns_player_with_given_display_name() {
        Player player = useCase.register("Thomas");

        assertThat(player.displayName()).isEqualTo("Thomas");
    }

    @Test
    void register_persists_the_player() {
        Player player = useCase.register("Thomas");

        assertThat(playerRepository.findById(player.playerId())).contains(player);
    }
}
