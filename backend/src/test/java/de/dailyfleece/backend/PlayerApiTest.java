package de.dailyfleece.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Objects;
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
class PlayerApiTest {

    @LocalServerPort
    int port;

    @Autowired
    MongoTemplate mongoTemplate;

    RestClient http;

    @BeforeEach
    void setup() {
        mongoTemplate.dropCollection("players");
        http = RestClient.builder()
                .baseUrl("http://localhost:" + port + "/api/v1")
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    @Test
    void registerPlayer_returns_201_with_playerId() {
        var request = Map.of("companyId", "thomas.voelk", "displayName", "Thomas");

        ResponseEntity<Map<String, Object>> response =
                http.post().uri("/players").body(request).retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsKey("playerId");
        assertThat(response.getBody()).containsEntry("displayName", "Thomas");
    }

    @Test
    void registerPlayer_same_companyId_returns_same_playerId() {
        var request = Map.of("companyId", "thomas.voelk", "displayName", "Thomas");

        ResponseEntity<Map<String, Object>> first =
                http.post().uri("/players").body(request).retrieve().toEntity(responseType());
        ResponseEntity<Map<String, Object>> second =
                http.post().uri("/players").body(request).retrieve().toEntity(responseType());

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(Objects.requireNonNull(first.getBody()).get("playerId"))
                .isEqualTo(Objects.requireNonNull(second.getBody()).get("playerId"));
    }

    @Test
    void registerPlayer_blank_companyId_returns_400() {
        var request = Map.of("companyId", "   ", "displayName", "Thomas");

        ResponseEntity<Map<String, Object>> response =
                http.post().uri("/players").body(request).retrieve().toEntity(responseType());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @SuppressWarnings("unchecked")
    private static Class<Map<String, Object>> responseType() {
        return (Class<Map<String, Object>>) (Class<?>) Map.class;
    }
}
