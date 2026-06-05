package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.PlayerResult;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class GetSessionResultsUseCaseTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final UUID PLAYER_1 = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    private GetSessionResultsUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void cleanup() {
        mongoTemplate.dropCollection("sessions");
    }

    @Test
    void get_returns_ended_session_for_results_computation() {
        Session saved = Session.create(LocalDate.parse("2098-01-01"), HOST_ID, new PlayerName("Host"));
        saved.join(PLAYER_1, new PlayerName("Anna"));
        saved.start();
        saved.submitAnswer(QuestionKey.Q1, HOST_ID, "B");
        saved.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "B");
        saved.submitAnswer(QuestionKey.Q2, HOST_ID, "DE");
        saved.setCorrectAnswer(QuestionKey.Q2, HOST_ID, "DE");
        sessionRepository.save(saved);

        Session session = useCase.get(saved.sessionId());

        assertThat(session.phase()).isEqualTo(SessionPhase.ENDED);
        List<PlayerResult> results = session.results();
        assertThat(results).hasSize(2);
        PlayerResult host = results.stream()
                .filter(r -> r.playerId().equals(HOST_ID))
                .findFirst()
                .orElseThrow();
        assertThat(host.q1Correct()).isTrue();
        assertThat(host.q2Correct()).isTrue();
        assertThat(host.totalPoints()).isEqualTo(2);
    }

    @Test
    void get_throws_when_session_not_ended() {
        Session session = Session.create(LocalDate.parse("2098-01-02"), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.get(session.sessionId())).isInstanceOf(SessionNotEnded.class);
    }

    @Test
    void get_throws_when_session_not_found() {
        assertThatThrownBy(() -> useCase.get(UUID.randomUUID())).isInstanceOf(SessionNotFound.class);
    }
}
