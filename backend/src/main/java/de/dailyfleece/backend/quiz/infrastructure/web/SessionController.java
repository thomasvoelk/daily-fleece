package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.SessionsApi;
import de.dailyfleece.api.model.HostActionRequest;
import de.dailyfleece.api.model.JoinSessionRequest;
import de.dailyfleece.api.model.SessionResponse;
import de.dailyfleece.backend.quiz.application.CreateSessionUseCase;
import de.dailyfleece.backend.quiz.application.DeleteSessionUseCase;
import de.dailyfleece.backend.quiz.application.JoinSessionUseCase;
import de.dailyfleece.backend.quiz.application.LoadSessionPhotoUseCase;
import de.dailyfleece.backend.quiz.application.LoadSessionUseCase;
import de.dailyfleece.backend.quiz.application.NoSessionForDate;
import de.dailyfleece.backend.quiz.application.StartSessionUseCase;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import de.dailyfleece.backend.quiz.domain.ProjectId;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import de.dailyfleece.backend.shared.PlayerName;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value = "/api/{version}", version = "1.0+")
class SessionController implements SessionsApi {

    private final CreateSessionUseCase createSessionUseCase;
    private final DeleteSessionUseCase deleteSessionUseCase;
    private final LoadSessionUseCase loadSessionUseCase;
    private final LoadSessionPhotoUseCase loadSessionPhotoUseCase;
    private final JoinSessionUseCase joinSessionUseCase;
    private final StartSessionUseCase startSessionUseCase;
    private final SessionResponseMapper mapper;

    SessionController(
            CreateSessionUseCase createSessionUseCase,
            DeleteSessionUseCase deleteSessionUseCase,
            LoadSessionUseCase loadSessionUseCase,
            LoadSessionPhotoUseCase loadSessionPhotoUseCase,
            JoinSessionUseCase joinSessionUseCase,
            StartSessionUseCase startSessionUseCase,
            SessionResponseMapper mapper) {
        this.createSessionUseCase = createSessionUseCase;
        this.deleteSessionUseCase = deleteSessionUseCase;
        this.loadSessionUseCase = loadSessionUseCase;
        this.loadSessionPhotoUseCase = loadSessionPhotoUseCase;
        this.joinSessionUseCase = joinSessionUseCase;
        this.startSessionUseCase = startSessionUseCase;
        this.mapper = mapper;
    }

    @Override
    public ResponseEntity<SessionResponse> createSession(
            String hostId, String hostDisplayName, MultipartFile q1, MultipartFile q2) {
        try {
            SessionKey key = new SessionKey(new ProjectId("default"), LocalDate.now(ZoneId.systemDefault()));
            UUID hostUuid = UUID.fromString(hostId);
            PlayerName name = new PlayerName(hostDisplayName);
            PhotoType q1Type = PhotoTypeRegistry.toEnum(q1.getContentType());
            PhotoType q2Type = PhotoTypeRegistry.toEnum(q2.getContentType());
            Session session = createSessionUseCase.create(
                    key, hostUuid, name, q1.getInputStream(), q1Type, q2.getInputStream(), q2Type);
            return ResponseEntity.status(201).body(mapper.toResponse(session));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read uploaded photo", e);
        }
    }

    @Override
    public ResponseEntity<Resource> getSessionPhoto(String sessionId, String question) {
        Photo photo = loadSessionPhotoUseCase.load(UUID.fromString(sessionId), question);
        MediaType contentType = PhotoTypeRegistry.toMediaType(photo.photoType());
        return ResponseEntity.ok().contentType(contentType).body(new InputStreamResource(photo.data()));
    }

    @Override
    public ResponseEntity<Void> deleteTodaySession() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        deleteSessionUseCase.delete(today);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<SessionResponse> getTodaySession() {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        return loadSessionUseCase
                .load(today)
                .map(mapper::toResponse)
                .map(ResponseEntity::ok)
                .orElseThrow(NoSessionForDate::today);
    }

    @Override
    public ResponseEntity<SessionResponse> getSessionByKey(String projectId, LocalDate date) {
        return loadSessionUseCase
                .load(date)
                .map(mapper::toResponse)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new NoSessionForDate(date));
    }

    @Override
    public ResponseEntity<SessionResponse> joinSession(String sessionId, JoinSessionRequest request) {
        UUID sessionUuid = UUID.fromString(sessionId);
        UUID playerId = UUID.fromString(request.getPlayerId());
        PlayerName displayName = new PlayerName(request.getDisplayName());
        Session session = joinSessionUseCase.join(sessionUuid, playerId, displayName);
        return ResponseEntity.ok(mapper.toResponse(session));
    }

    @Override
    public ResponseEntity<SessionResponse> startSession(String sessionId, HostActionRequest request) {
        UUID sessionUuid = UUID.fromString(sessionId);
        UUID hostId = UUID.fromString(request.getHostId());
        Session session = startSessionUseCase.start(sessionUuid, hostId);
        return ResponseEntity.ok(mapper.toResponse(session));
    }
}
