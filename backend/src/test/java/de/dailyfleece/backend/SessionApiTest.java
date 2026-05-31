package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.PhotoId;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhotos;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
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
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class SessionApiTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final SessionPhotos PHOTOS =
            new SessionPhotos(new PhotoId("aaaaaaaaaaaaaaaaaaaaaaaa"), new PhotoId("bbbbbbbbbbbbbbbbbbbbbbbb"));

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
        http = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v1")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    @Test
    void getTodaySession_returns_404_when_no_session_today() {
        ResponseEntity<Map<String, Object>> response =
                http.get().uri("/sessions/today").retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getTodaySession_returns_200_with_session() {
        sessionRepository.save(
                Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"), PHOTOS));

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

        Session session =
                Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"), PHOTOS);
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
        Session session =
                Session.create(LocalDate.now(ZoneId.systemDefault()), HOST_ID, new PlayerName("Host"), PHOTOS);
        session.start();
        sessionRepository.save(session);

        ResponseEntity<Map<String, Object>> response = http.post()
                .uri("/sessions/" + session.sessionId() + "/join")
                .body(Map.of("playerId", UUID.randomUUID().toString(), "displayName", "Anna"))
                .retrieve()
                .toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @SuppressWarnings("unchecked")
    private static Class<Map<String, Object>> responseType() {
        return (Class<Map<String, Object>>) (Class<?>) Map.class;
    }
}
