package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.nio.charset.StandardCharsets;
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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class SessionApiTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");

    @LocalServerPort
    int port;

    @Autowired
    SessionRepository sessionRepository;

    @Autowired
    MongoTemplate mongoTemplate;

    RestClient http;

    @BeforeEach
    void setup() {
        mongoTemplate.dropCollection("players");
        mongoTemplate.dropCollection("sessions");
        mongoTemplate.getDb().getCollection("fs.files").drop();
        mongoTemplate.getDb().getCollection("fs.chunks").drop();
        http = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v1")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    @Test
    void deleteTodaySession_returns_204_when_no_session_exists() {
        ResponseEntity<Void> response =
                http.delete().uri("/sessions/today").retrieve().toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deleteTodaySession_returns_204_and_removes_session() {
        sessionRepository.save(Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host")));

        ResponseEntity<Void> response =
                http.delete().uri("/sessions/today").retrieve().toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(sessionRepository.findByDate(LocalDate.now(ZoneId.systemDefault())))
                .isEmpty();
    }

    @Test
    void deleteTodaySession_cascade_deletes_photos() {
        postSession();

        http.delete().uri("/sessions/today").retrieve().toBodilessEntity();

        assertThat(mongoTemplate.getDb().getCollection("fs.files").countDocuments())
                .isZero();
    }

    @Test
    void getTodaySession_returns_404_when_no_session_today() {
        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/sessions/today").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getTodaySession_returns_200_with_session() {
        sessionRepository.save(Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host")));

        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/sessions/today").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("sessionId");
        assertThat(response.getBody()).containsEntry("phase", "Lobby");
    }

    @Test
    void joinSession_returns_200_with_updated_player_list() {
        ResponseEntity<Map<String, Object>> registerResponse = http.post()
                .uri("/players")
                .body(Map.of("companyId", "anna.schmidt", "displayName", "Anna"))
                .retrieve()
                .toEntity(responseType());
        String playerId =
                (String) Objects.requireNonNull(registerResponse.getBody()).get("playerId");

        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/join")
                .body(Map.of("playerId", playerId, "displayName", "Anna"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("players");
    }

    @Test
    void joinSession_unknown_sessionId_returns_404() {
        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + UUID.randomUUID() + "/join")
                .body(Map.of("playerId", UUID.randomUUID().toString(), "displayName", "Anna"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getTodaySession_unknown_api_version_returns_400() {
        RestClient badVersion = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v2")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();

        ResponseEntity<Map<String, Object>> response =
                badVersion.get().uri("/sessions/today").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getTodaySession_missing_api_version_returns_404() {
        RestClient noVersion = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();

        ResponseEntity<Map<String, Object>> response =
                noVersion.get().uri("/sessions/today").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void joinSession_active_session_returns_409() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/join")
                .body(Map.of("playerId", UUID.randomUUID().toString(), "displayName", "Anna"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void createSession_returns_201_with_host_as_first_player() {
        ResponseEntity<Map<String, Object>> response = postSession();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> players = Objects.requireNonNull((List<Map<String, Object>>)
                Objects.requireNonNull(response.getBody()).get("players"));
        assertThat(players).hasSize(1);
        assertThat(players.get(0)).containsEntry("playerId", HOST_ID.toString()).containsEntry("displayName", "Host");
    }

    @Test
    void startSession_returns_200_with_active_phase() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/start")
                .body(Map.of("hostId", HOST_ID.toString()))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("phase", "Active");
    }

    @Test
    void startSession_returns_403_when_caller_is_not_the_host() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/start")
                .body(Map.of("hostId", UUID.randomUUID().toString()))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void startSession_returns_409_when_session_already_started() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/start")
                .body(Map.of("hostId", HOST_ID.toString()))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void startSession_returns_404_when_session_not_found() {
        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + UUID.randomUUID() + "/start")
                .body(Map.of("hostId", HOST_ID.toString()))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void createSession_duplicate_day_returns_409() {
        postSession();

        ResponseEntity<Map<String, Object>> response = postSession();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void setCorrectAnswer_returns_200_with_q1_closed_and_q2_open() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        session.submitAnswer(QuestionKey.Q1, HOST_ID, "A");
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/questions/q1/correct")
                .body(Map.of("hostId", HOST_ID.toString(), "correctAnswer", "B"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> voting = Objects.requireNonNull(
                (Map<String, Object>) Objects.requireNonNull(response.getBody()).get("voting"));
        @SuppressWarnings("unchecked")
        Map<String, Object> q1 = Objects.requireNonNull((Map<String, Object>) voting.get("q1"));
        @SuppressWarnings("unchecked")
        Map<String, Object> q2 = Objects.requireNonNull((Map<String, Object>) voting.get("q2"));
        assertThat(q1).containsEntry("status", "Closed").containsEntry("correctAnswer", "B");
        @SuppressWarnings("unchecked")
        Map<String, Object> answers = Objects.requireNonNull((Map<String, Object>) q1.get("answers"));
        @SuppressWarnings("unchecked")
        Map<String, Object> hostAnswer = Objects.requireNonNull((Map<String, Object>) answers.get(HOST_ID.toString()));
        assertThat(hostAnswer).containsEntry("displayName", "Host").containsEntry("answer", "A");
        assertThat(q2).containsEntry("status", "Open");
    }

    @Test
    void setCorrectAnswer_on_q2_returns_200_with_session_ended() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "A");
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/questions/q2/correct")
                .body(Map.of("hostId", HOST_ID.toString(), "correctAnswer", "DE"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("phase", "Ended");
    }

    @Test
    void setCorrectAnswer_returns_403_when_caller_is_not_host() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/questions/q1/correct")
                .body(Map.of("hostId", UUID.randomUUID().toString(), "correctAnswer", "A"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void submitAnswer_returns_200_for_open_voting() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        ResponseEntity<Void> response = http.put()
                .uri("/sessions/" + session.sessionId() + "/questions/q1/answers")
                .body(Map.of("playerId", HOST_ID.toString(), "answer", "A"))
                .retrieve()
                .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTodaySession_answerCount_reflects_submitted_answers() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        session.submitAnswer(QuestionKey.Q1, HOST_ID, "B");
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/sessions/today").retrieve().toEntity(responseType());

        @SuppressWarnings("unchecked")
        Map<String, Object> voting =
                (Map<String, Object>) Objects.requireNonNull(response.getBody()).get("voting");
        @SuppressWarnings("unchecked")
        Map<String, Object> q1 =
                (Map<String, Object>) Objects.requireNonNull(voting).get("q1");
        assertThat(q1).containsEntry("answerCount", 1);
    }

    @Test
    void submitAnswer_returns_409_when_voting_is_closed() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "A");
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.put()
                .uri("/sessions/" + session.sessionId() + "/questions/q1/answers")
                .body(Map.of("playerId", HOST_ID.toString(), "answer", "B"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void submitAnswer_returns_400_for_invalid_question_key() {
        Session session = Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"));
        session.start();
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.put()
                .uri("/sessions/" + session.sessionId() + "/questions/q9/answers")
                .body(Map.of("playerId", HOST_ID.toString(), "answer", "A"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private ResponseEntity<Map<String, Object>> postSession() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("hostId", HOST_ID.toString());
        body.add("hostDisplayName", "Host");
        body.add("q1", new ByteArrayResource("q1-bytes".getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "q1.jpg";
            }
        });
        body.add("q2", new ByteArrayResource("q2-bytes".getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "q2.jpg";
            }
        });
        return http.post()
                .uri("/sessions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .toEntity(responseType());
    }

    @SuppressWarnings("unchecked")
    private static Class<Map<String, Object>> responseType() {
        return (Class<Map<String, Object>>) (Class<?>) Map.class;
    }
}
