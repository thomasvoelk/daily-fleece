package de.dailyfleece.backend;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

final class CreateSessionRequest {

    private final RestClient http;
    private final UUID hostId;
    private final String hostDisplayName;

    CreateSessionRequest(RestClient http, UUID hostId, String hostDisplayName) {
        this.http = http;
        this.hostId = hostId;
        this.hostDisplayName = hostDisplayName;
    }

    @SuppressWarnings("unchecked")
    ResponseEntity<Map<String, Object>> post() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("hostId", hostId.toString());
        body.add("hostDisplayName", hostDisplayName);
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
                .toEntity((Class<Map<String, Object>>) (Class<?>) Map.class);
    }
}
