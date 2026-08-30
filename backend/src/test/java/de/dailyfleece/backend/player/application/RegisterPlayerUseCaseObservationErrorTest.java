package de.dailyfleece.backend.player.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import de.dailyfleece.backend.shared.PlayerName;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.modulith.test.ApplicationModuleTest;

/**
 * PlayerIdKeyValueResolver (used by the {@code @ObservationKeyValue} on RegisterPlayerUseCase#register's
 * result) must tolerate a {@code null} result: ObservedAspect evaluates result annotations even when
 * the observed method exits via an exception. Verified here with a hand-written failing
 * PlayerRepository (no Mockito, per this repo's test conventions) so the failure happens inside the
 * real, proxied, @Observed use case bean.
 */
@ApplicationModuleTest
@Import({TestcontainersConfiguration.class, RegisterPlayerUseCaseObservationErrorTest.FailingRepositoryConfig.class})
class RegisterPlayerUseCaseObservationErrorTest {

    @TestConfiguration
    static class FailingRepositoryConfig {

        @Bean
        @Primary
        PlayerRepository failingPlayerRepository() {
            return new PlayerRepository() {
                @Override
                public Player getOrCreate(CompanyId companyId, PlayerName displayName) {
                    throw new IllegalStateException("forced failure for test");
                }

                @Override
                public Optional<Player> findById(UUID playerId) {
                    return Optional.empty();
                }
            };
        }
    }

    @Autowired
    private RegisterPlayerUseCase useCase;

    @Test
    void register_propagates_repository_failure_without_annotation_handler_erroring() {
        assertThatThrownBy(() -> useCase.register(new CompanyId("comp-fail"), new PlayerName("Thomas")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("forced failure for test");
    }
}
