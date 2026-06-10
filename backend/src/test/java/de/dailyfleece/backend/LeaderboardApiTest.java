package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.quiz.domain.ProjectId;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import de.dailyfleece.backend.shared.PlayerName;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class LeaderboardApiTest {

    private static final UUID HOST_ID = UUID.fromString("11111111-0000-0000-0000-000000000001");
    private static final UUID PLAYER_ID = UUID.fromString("22222222-0000-0000-0000-000000000002");

    @LocalServerPort
    int port;

    @Autowired
    SessionRepository sessionRepository;

    @Autowired
    MongoTemplate mongoTemplate;

    RestClient http;
    int sessionDateOffset;

    @BeforeEach
    void setup() {
        mongoTemplate.dropCollection("sessions");
        mongoTemplate.dropCollection("leaderboard");
        sessionDateOffset = 0;
        http = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v1")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    // --- Behavior 0: correct content negotiation ---

    @Test
    void getLeaderboard_returns_200_when_accept_is_application_json() {
        ResponseEntity<Map<String, Object>> response = http.get()
                .uri("/leaderboard")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // --- Behavior 1: empty leaderboard ---

    @Test
    void getLeaderboard_returns_200_with_empty_entries_when_no_session_has_ended() {
        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/leaderboard").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("projectId", "default");
        assertThat((List<?>) Objects.requireNonNull(response.getBody()).get("entries"))
                .isEmpty();
    }

    // --- Behavior 2: session end populates leaderboard ---

    @Test
    void getLeaderboard_reflects_player_points_after_session_ends() {
        endSession(HOST_ID, new PlayerName("Host"), "B", "DE");

        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/leaderboard").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = Objects.requireNonNull((List<Map<String, Object>>)
                Objects.requireNonNull(response.getBody()).get("entries"));
        assertThat(entries).hasSize(1);
        assertThat(entries.get(0))
                .containsEntry("playerId", HOST_ID.toString())
                .containsEntry("displayName", "Host")
                .containsEntry("totalPoints", 2)
                .containsEntry("sessionsParticipated", 1);
    }

    // --- Behavior 3: points accumulate across sessions ---

    @Test
    void totalPoints_and_sessionsParticipated_accumulate_across_sessions() {
        endSession(HOST_ID, new PlayerName("Host"), "B", "DE");
        endSession(HOST_ID, new PlayerName("Host"), "B", "DE");

        List<Map<String, Object>> entries = getLeaderboardEntries();
        assertThat(entries).hasSize(1);
        assertThat(entries.get(0)).containsEntry("totalPoints", 4).containsEntry("sessionsParticipated", 2);
    }

    // --- Behavior 4: player with 0 points still appears ---

    @Test
    void player_with_zero_points_appears_on_leaderboard() {
        endSession(HOST_ID, new PlayerName("Host"), "A", "FR"); // wrong answers → 0 pts

        List<Map<String, Object>> entries = getLeaderboardEntries();
        assertThat(entries).hasSize(1);
        assertThat(entries.get(0)).containsEntry("totalPoints", 0).containsEntry("sessionsParticipated", 1);
    }

    // --- Behavior 5: ordered by totalPoints descending ---

    @Test
    void entries_are_ordered_by_totalPoints_descending() {
        // Host gets 2 points, PLAYER_ID gets 0 (no answers submitted)
        endSessionWithTwoPlayers();

        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/leaderboard").retrieve().toEntity(responseType());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = Objects.requireNonNull((List<Map<String, Object>>)
                Objects.requireNonNull(response.getBody()).get("entries"));
        assertThat(entries).hasSize(2);
        assertThat(entries.get(0)).containsEntry("playerId", HOST_ID.toString());
        assertThat(entries.get(1)).containsEntry("playerId", PLAYER_ID.toString());
    }

    // ---------------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getLeaderboardEntries() {
        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/leaderboard").retrieve().toEntity(responseType());
        return Objects.requireNonNull((List<Map<String, Object>>)
                Objects.requireNonNull(response.getBody()).get("entries"));
    }

    /**
     * Ends a session via HTTP so SetCorrectAnswerUseCase publishes SessionEndedDomainEvent.
     * Q1 and Q2 answers are optional (null → player earns 0 pts for that question).
     */
    private void endSession(UUID hostId, PlayerName hostName, String q1Answer, String q2Answer) {
        Session session = Session.create(
                new SessionKey(
                        new ProjectId("default"),
                        LocalDate.now(ZoneId.systemDefault()).plusDays(sessionDateOffset++)),
                hostId,
                hostName);
        session.start();
        if (q1Answer != null) session.submitAnswer(QuestionKey.Q1, hostId, q1Answer);
        session.setCorrectAnswer(QuestionKey.Q1, "B");
        if (q2Answer != null) session.submitAnswer(QuestionKey.Q2, hostId, q2Answer);
        sessionRepository.save(session);

        http.post()
                .uri("/sessions/" + session.sessionId() + "/questions/q2/correct")
                .body(Map.of("hostId", hostId.toString(), "correctAnswer", "DE"))
                .retrieve()
                .toBodilessEntity();
    }

    /** Ends a session with host (2 pts) and a second player (0 pts). */
    private void endSessionWithTwoPlayers() {
        Session session = Session.create(
                new SessionKey(new ProjectId("default"), LocalDate.now(ZoneId.systemDefault())),
                HOST_ID,
                new PlayerName("Host"));
        session.join(PLAYER_ID, new PlayerName("Anna"));
        session.start();
        session.submitAnswer(QuestionKey.Q1, HOST_ID, "B");
        session.setCorrectAnswer(QuestionKey.Q1, "B");
        session.submitAnswer(QuestionKey.Q2, HOST_ID, "DE");
        sessionRepository.save(session);

        http.post()
                .uri("/sessions/" + session.sessionId() + "/questions/q2/correct")
                .body(Map.of("hostId", HOST_ID.toString(), "correctAnswer", "DE"))
                .retrieve()
                .toBodilessEntity();
    }

    @SuppressWarnings("unchecked")
    private static Class<Map<String, Object>> responseType() {
        return (Class<Map<String, Object>>) (Class<?>) Map.class;
    }
}
