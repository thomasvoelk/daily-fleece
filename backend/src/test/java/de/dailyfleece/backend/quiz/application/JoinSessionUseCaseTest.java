package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.domain.CannotJoinSessionException;
import de.dailyfleece.backend.quiz.domain.InMemorySessionRepository;
import de.dailyfleece.backend.quiz.domain.Session;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JoinSessionUseCaseTest {

    private static final LocalDate DATE = LocalDate.of(2026, 5, 29);
    private static final UUID PLAYER_1 = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final InMemorySessionRepository sessionRepository = new InMemorySessionRepository();
    private final JoinSessionUseCase useCase = new JoinSessionUseCase(sessionRepository);

    @Test
    void join_adds_player_to_lobby_session() {
        Session session = Session.create(DATE);
        sessionRepository.save(session);

        useCase.join(DATE, PLAYER_1, new DisplayName("Thomas"));

        assertThat(session.players()).hasSize(1);
        assertThat(session.players().get(0).displayName()).isEqualTo(new DisplayName("Thomas"));
    }

    @Test
    void join_throws_when_no_session_exists_for_date() {
        assertThatThrownBy(() -> useCase.join(DATE, PLAYER_1, new DisplayName("Thomas")))
                .isInstanceOf(NoSessionForDateException.class);
    }

    @Test
    void join_propagates_domain_exception_when_session_not_in_lobby() {
        Session session = Session.create(DATE);
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.join(DATE, PLAYER_1, new DisplayName("Thomas")))
                .isInstanceOf(CannotJoinSessionException.class);
    }
}
