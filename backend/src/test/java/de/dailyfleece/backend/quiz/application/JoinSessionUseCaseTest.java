package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.CannotJoinSessionException;
import de.dailyfleece.backend.quiz.domain.InMemorySessionRepository;
import de.dailyfleece.backend.quiz.domain.Session;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JoinSessionUseCaseTest {

    private final InMemorySessionRepository sessionRepository = new InMemorySessionRepository();
    private final JoinSessionUseCase useCase = new JoinSessionUseCase(sessionRepository);

    @Test
    void join_adds_player_to_lobby_session() {
        Session session = Session.create("2026-05-29");
        sessionRepository.save(session);

        useCase.join("2026-05-29", "player-1", "Thomas");

        assertThat(session.players()).hasSize(1);
        assertThat(session.players().get(0).displayName()).isEqualTo("Thomas");
    }

    @Test
    void join_throws_when_no_session_exists_for_date() {
        assertThatThrownBy(() -> useCase.join("2026-05-29", "player-1", "Thomas"))
                .isInstanceOf(NoSessionForDateException.class);
    }

    @Test
    void join_propagates_domain_exception_when_session_not_in_lobby() {
        Session session = Session.create("2026-05-29");
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.join("2026-05-29", "player-1", "Thomas"))
                .isInstanceOf(CannotJoinSessionException.class);
    }
}
