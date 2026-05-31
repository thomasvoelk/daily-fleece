package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
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
class CreateSessionApiTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @LocalServerPort
    int port;

    @Autowired
    MongoTemplate mongoTemplate;

    RestClient http;

    @BeforeEach
    void setup() {
        mongoTemplate.dropCollection("sessions");
        mongoTemplate.getDb().getCollection("fs.files").drop();
        mongoTemplate.getDb().getCollection("fs.chunks").drop();
        http = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v1")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    @Test
    void createSession_returns_201_with_host_as_first_player() {
        ResponseEntity<Map<String, Object>> response = postSession();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Object> body = Objects.requireNonNull(response.getBody());
        assertThat(body).containsKey("sessionId");
        assertThat(body).containsEntry("hostId", HOST_ID.toString());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> players = Objects.requireNonNull((List<Map<String, Object>>) body.get("players"));
        assertThat(players).hasSize(1);
        assertThat(players.get(0)).containsEntry("displayName", "Thomas");
    }

    @Test
    void createSession_duplicate_returns_409() {
        postSession();

        ResponseEntity<Map<String, Object>> response = postSession();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    private ResponseEntity<Map<String, Object>> postSession() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("hostId", HOST_ID.toString());
        body.add("hostDisplayName", "Thomas");
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
