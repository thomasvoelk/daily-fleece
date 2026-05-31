package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
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
class SessionPhotoApiTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final byte[] Q1_BYTES = "q1-image-data".getBytes(StandardCharsets.UTF_8);
    private static final byte[] Q2_BYTES = "q2-image-data".getBytes(StandardCharsets.UTF_8);

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
    void getSessionPhoto_q1_returns_image_bytes() {
        String sessionId = createSession();

        ResponseEntity<byte[]> response = http.get()
                .uri("/sessions/" + sessionId + "/photos/q1")
                .retrieve()
                .toEntity(byte[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Q1_BYTES);
        assertThat(Objects.requireNonNull(response.getHeaders().getContentType())
                        .toString())
                .startsWith("image/");
    }

    @Test
    void getSessionPhoto_q2_returns_image_bytes() {
        String sessionId = createSession();

        ResponseEntity<byte[]> response = http.get()
                .uri("/sessions/" + sessionId + "/photos/q2")
                .retrieve()
                .toEntity(byte[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Q2_BYTES);
    }

    @Test
    void getSessionPhoto_unknown_session_returns_404() {
        ResponseEntity<byte[]> response = http.get()
                .uri("/sessions/" + UUID.randomUUID() + "/photos/q1")
                .retrieve()
                .toEntity(byte[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private String createSession() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("hostId", HOST_ID.toString());
        body.add("hostDisplayName", "Thomas");
        body.add("q1", new ByteArrayResource(Q1_BYTES) {
            @Override
            public String getFilename() {
                return "q1.jpg";
            }

            @Override
            public String toString() {
                return "q1.jpg";
            }
        });
        body.add("q2", new ByteArrayResource(Q2_BYTES) {
            @Override
            public String getFilename() {
                return "q2.jpg";
            }

            @Override
            public String toString() {
                return "q2.jpg";
            }
        });
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = Objects.requireNonNull(http.post()
                .uri("/sessions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .toEntity((Class<Map<String, Object>>) (Class<?>) Map.class)
                .getBody());
        return Objects.requireNonNull((String) responseBody.get("sessionId"));
    }
}
