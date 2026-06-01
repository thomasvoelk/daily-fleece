package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.InvalidPhaseTransition;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class StartSessionUseCaseTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final UUID OTHER_PLAYER = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    private StartSessionUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void cleanup() {
        mongoTemplate.dropCollection("sessions");
    }

    @Test
    void start_transitions_session_to_active_phase() {
        Session session = Session.create(LocalDate.parse("2098-01-01"), HOST_ID, new PlayerName("Host"));
        sessionRepository.save(session);

        Session result = useCase.start(session.sessionId(), HOST_ID);

        assertThat(result.phase()).isEqualTo(SessionPhase.ACTIVE);
        Session persisted = sessionRepository.findById(session.sessionId()).orElseThrow();
        assertThat(persisted.phase()).isEqualTo(SessionPhase.ACTIVE);
    }

    @Test
    void start_throws_when_session_not_found() {
        assertThatThrownBy(() -> useCase.start(UUID.randomUUID(), HOST_ID)).isInstanceOf(SessionNotFound.class);
    }

    @Test
    void start_throws_when_caller_is_not_the_host() {
        Session session = Session.create(LocalDate.parse("2098-01-02"), HOST_ID, new PlayerName("Host"));
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.start(session.sessionId(), OTHER_PLAYER))
                .isInstanceOf(NotTheHost.class);
    }

    @Test
    void start_propagates_domain_exception_when_session_already_started() {
        Session session = Session.create(LocalDate.parse("2098-01-03"), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.start(session.sessionId(), HOST_ID))
                .isInstanceOf(InvalidPhaseTransition.class);
    }
}
