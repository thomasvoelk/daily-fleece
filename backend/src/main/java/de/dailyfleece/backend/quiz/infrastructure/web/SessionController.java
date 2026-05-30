package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.SessionsApi;
import de.dailyfleece.api.model.JoinSessionRequest;
import de.dailyfleece.api.model.SessionResponse;
import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.application.JoinSessionUseCase;
import de.dailyfleece.backend.quiz.application.LoadSessionUseCase;
import de.dailyfleece.backend.quiz.application.NoSessionForDate;
import de.dailyfleece.backend.quiz.domain.Session;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/{version}", version = "1.0+")
class SessionController implements SessionsApi {

    private final LoadSessionUseCase loadSessionUseCase;
    private final JoinSessionUseCase joinSessionUseCase;
    private final SessionResponseMapper mapper;

    SessionController(
            LoadSessionUseCase loadSessionUseCase,
            JoinSessionUseCase joinSessionUseCase,
            SessionResponseMapper mapper) {
        this.loadSessionUseCase = loadSessionUseCase;
        this.joinSessionUseCase = joinSessionUseCase;
        this.mapper = mapper;
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
    public ResponseEntity<SessionResponse> joinSession(String sessionId, JoinSessionRequest request) {
        UUID sessionUuid = UUID.fromString(sessionId);
        UUID playerId = UUID.fromString(request.getPlayerId());
        DisplayName displayName = new DisplayName(request.getDisplayName());
        Session session = joinSessionUseCase.join(sessionUuid, playerId, displayName);
        return ResponseEntity.ok(mapper.toResponse(session));
    }
}
