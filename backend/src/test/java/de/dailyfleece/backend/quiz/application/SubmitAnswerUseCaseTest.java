package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.domain.ProjectId;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import de.dailyfleece.backend.shared.PlayerName;
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
class SubmitAnswerUseCaseTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");

    @Autowired
    private SubmitAnswerUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void cleanup() {
        mongoTemplate.dropCollection("sessions");
    }

    @Test
    void submit_records_answer_for_open_voting() {
        Session session = Session.create(
                new SessionKey(new ProjectId("default"), LocalDate.parse("2098-02-01")),
                HOST_ID,
                new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        useCase.submit(session.sessionId(), QuestionKey.Q1, HOST_ID, "A");

        Session persisted = sessionRepository.findById(session.sessionId()).orElseThrow();
        assertThat(persisted.q1Voting().orElseThrow().answers()).containsEntry(HOST_ID.toString(), "A");
    }

    @Test
    void submit_throws_when_session_not_found() {
        assertThatThrownBy(() -> useCase.submit(UUID.randomUUID(), QuestionKey.Q1, HOST_ID, "A"))
                .isInstanceOf(SessionNotFound.class);
    }
}
