package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.api.SessionEndedDomainEvent;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import de.dailyfleece.backend.shared.PlayerName;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class SetCorrectAnswerUseCaseTest {

    @TestConfiguration
    static class EventConfig {

        @Bean
        EventStore eventStore() {
            return new EventStore();
        }

        static class EventStore {

            final CopyOnWriteArrayList<SessionEndedDomainEvent> events = new CopyOnWriteArrayList<>();

            @EventListener
            void on(SessionEndedDomainEvent event) {
                events.add(event);
            }
        }
    }

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final UUID OTHER_PLAYER = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    private SetCorrectAnswerUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private EventConfig.EventStore eventStore;

    @BeforeEach
    void setup() {
        mongoTemplate.dropCollection("sessions");
        eventStore.events.clear();
    }

    @Test
    void set_q2_ends_the_session() {
        Session session = sessionReadyForQ2();

        Session result = useCase.set(session.sessionId(), QuestionKey.Q2, HOST_ID, "DE");

        assertThat(result.phase()).isEqualTo(SessionPhase.ENDED);
    }

    @Test
    void set_q2_publishes_SessionEndedDomainEvent_with_correct_sessionId() {
        Session session = sessionReadyForQ2();

        useCase.set(session.sessionId(), QuestionKey.Q2, HOST_ID, "DE");

        assertThat(eventStore.events).hasSize(1);
        assertThat(eventStore.events.get(0).sessionId()).isEqualTo(session.sessionId());
    }

    @Test
    void set_q1_does_not_publish_SessionEndedDomainEvent() {
        Session session = Session.create(LocalDate.parse("2098-01-01"), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        useCase.set(session.sessionId(), QuestionKey.Q1, HOST_ID, "A");

        assertThat(eventStore.events).isEmpty();
    }

    @Test
    void set_throws_when_session_not_found() {
        assertThatThrownBy(() -> useCase.set(UUID.randomUUID(), QuestionKey.Q1, HOST_ID, "A"))
                .isInstanceOf(SessionNotFound.class);
    }

    @Test
    void set_throws_when_caller_is_not_the_host() {
        Session session = Session.create(LocalDate.parse("2098-01-02"), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.set(session.sessionId(), QuestionKey.Q1, OTHER_PLAYER, "A"))
                .isInstanceOf(NotTheHost.class);
    }

    private Session sessionReadyForQ2() {
        Session session = Session.create(LocalDate.parse("2098-01-01"), HOST_ID, new PlayerName("Host"));
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, "A");
        sessionRepository.save(session);
        return session;
    }
}
