package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.domain.LobbyClosed;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import de.dailyfleece.backend.shared.PlayerName;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class JoinSessionUseCaseTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final UUID PLAYER_1 = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    private JoinSessionUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void join_adds_player_to_lobby_session() {
        Session session = Session.create(LocalDate.parse("2098-01-01"), HOST_ID, new PlayerName("Host"));
        sessionRepository.save(session);

        useCase.join(session.sessionId(), PLAYER_1, new PlayerName("Thomas"));

        Session updated = sessionRepository.findById(session.sessionId()).orElseThrow();
        assertThat(updated.players()).hasSize(2);
        assertThat(updated.players().get(1).displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void join_throws_when_session_id_unknown() {
        assertThatThrownBy(() -> useCase.join(UUID.randomUUID(), PLAYER_1, new PlayerName("Thomas")))
                .isInstanceOf(SessionNotFound.class);
    }

    @Test
    void join_propagates_domain_exception_when_session_not_in_lobby() {
        Session session = Session.create(LocalDate.parse("2098-01-03"), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.join(session.sessionId(), PLAYER_1, new PlayerName("Thomas")))
                .isInstanceOf(LobbyClosed.class);
    }
}
