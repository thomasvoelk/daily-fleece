package de.dailyfleece.backend;

import static io.micrometer.observation.tck.TestObservationRegistryAssert.assertThat;

import de.dailyfleece.backend.quiz.domain.ProjectId;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import de.dailyfleece.backend.shared.PlayerName;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.tck.TestObservationRegistry;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.client.RestClient;

/**
 * Verifies the three-tier @Observed instrumentation (df-9aoe.7) actually attaches the attributes
 * the spec (docs/specs/observability-backend.md) promises, using a TestObservationRegistry instead
 * of asserting against exported Tempo traces.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({TestcontainersConfiguration.class, ObservabilityInstrumentationTest.ObservationConfig.class})
class ObservabilityInstrumentationTest {

    @TestConfiguration
    static class ObservationConfig {

        @Bean
        ObservationRegistry observationRegistry() {
            return TestObservationRegistry.create();
        }
    }

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");

    @LocalServerPort
    int port;

    @Autowired
    SessionRepository sessionRepository;

    @Autowired
    MongoTemplate mongoTemplate;

    @Autowired
    TestObservationRegistry observationRegistry;

    RestClient http;

    @BeforeEach
    void setup() {
        mongoTemplate.dropCollection("players");
        mongoTemplate.dropCollection("sessions");
        mongoTemplate.getDb().getCollection("fs.files").drop();
        mongoTemplate.getDb().getCollection("fs.chunks").drop();
        observationRegistry.clear();
        http = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v1")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    @Test
    void http_span_carries_session_project_id_and_date_from_the_natural_key_route() {
        String today = LocalDate.now(ZoneId.systemDefault()).toString();
        sessionRepository.save(Session.create(
                new SessionKey(new ProjectId("default"), LocalDate.now(ZoneId.systemDefault())),
                HOST_ID,
                new PlayerName("Host")));

        http.get().uri("/sessions/default/" + today).retrieve().toBodilessEntity();

        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasNameEqualTo("http.server.requests")
                        .hasLowCardinalityKeyValue("session.project_id", "default")
                        .hasHighCardinalityKeyValue("session.date", today));
    }

    @Test
    void http_span_has_no_session_attributes_for_a_route_without_a_natural_key() {
        http.post()
                .uri("/players")
                .body(Map.of("companyId", "comp-obs-1", "displayName", "Anna"))
                .retrieve()
                .toBodilessEntity();

        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasNameEqualTo("http.server.requests")
                        .doesNotHaveLowCardinalityKeyValueWithKey("session.project_id")
                        .doesNotHaveHighCardinalityKeyValueWithKey("session.date"));
    }

    @Test
    void submitAnswer_use_case_span_carries_session_id_player_id_and_question() {
        String today = LocalDate.now(ZoneId.systemDefault()).toString();
        Session session = Session.create(
                new SessionKey(new ProjectId("default"), LocalDate.now(ZoneId.systemDefault())),
                HOST_ID,
                new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        http.put()
                .uri("/sessions/default/" + today + "/questions/q1/answers")
                .body(Map.of("playerId", HOST_ID.toString(), "answer", "A"))
                .retrieve()
                .toBodilessEntity();

        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasContextualNameEqualTo("SubmitAnswerUseCase#submit")
                        .hasHighCardinalityKeyValue(
                                "session.id", session.sessionId().toString())
                        .hasHighCardinalityKeyValue("player.id", HOST_ID.toString())
                        .hasLowCardinalityKeyValue("voting.question", "Q1"));
    }

    @Test
    void setCorrectAnswer_on_q2_use_case_span_carries_ended_phase_outcome() {
        String today = LocalDate.now(ZoneId.systemDefault()).toString();
        Session session = Session.create(
                new SessionKey(new ProjectId("default"), LocalDate.now(ZoneId.systemDefault())),
                HOST_ID,
                new PlayerName("Host"));
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, "A");
        sessionRepository.save(session);

        http.post()
                .uri("/sessions/default/" + today + "/questions/q2/correct")
                .body(Map.of("hostId", HOST_ID.toString(), "correctAnswer", "DE"))
                .retrieve()
                .toBodilessEntity();

        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasContextualNameEqualTo("SetCorrectAnswerUseCase#set")
                        .hasLowCardinalityKeyValue("session.phase", "ENDED"));
        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasContextualNameEqualTo("UpdateLeaderboardUseCase#on")
                        .hasHighCardinalityKeyValue(
                                "session.id", session.sessionId().toString()));
    }

    @Test
    void startSession_by_non_host_marks_both_the_http_span_and_the_use_case_span_as_errored() {
        String today = LocalDate.now(ZoneId.systemDefault()).toString();
        sessionRepository.save(Session.create(
                new SessionKey(new ProjectId("default"), LocalDate.now(ZoneId.systemDefault())),
                HOST_ID,
                new PlayerName("Host")));

        http.post()
                .uri("/sessions/default/" + today + "/start")
                .body(Map.of("hostId", UUID.randomUUID().toString()))
                .retrieve()
                .toBodilessEntity();

        assertThat(observationRegistry)
                .hasAnObservation(context ->
                        context.hasNameEqualTo("http.server.requests").hasError());
        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasContextualNameEqualTo("StartSessionUseCase#start")
                        .hasError());
    }

    @Test
    void registerPlayer_use_case_span_carries_the_created_player_id_as_an_outcome() {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = http.post()
                .uri("/players")
                .body(Map.of("companyId", "comp-obs-2", "displayName", "Anna"))
                .retrieve()
                .body((Class<Map<String, Object>>) (Class<?>) Map.class);
        String playerId = String.valueOf(Objects.requireNonNull(response).get("playerId"));

        assertThat(observationRegistry)
                .hasAnObservation(context -> context.hasContextualNameEqualTo("RegisterPlayerUseCase#register")
                        .hasHighCardinalityKeyValue("player.id", playerId));
    }
}
