package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.ResultsApi;
import de.dailyfleece.api.model.PlayerResult;
import de.dailyfleece.api.model.SessionResultsResponse;
import de.dailyfleece.backend.quiz.application.GetSessionResultsUseCase;
import de.dailyfleece.backend.quiz.domain.Session;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/{version}", version = "1.0+")
class ResultsController implements ResultsApi {

    private final GetSessionResultsUseCase getSessionResultsUseCase;

    ResultsController(GetSessionResultsUseCase getSessionResultsUseCase) {
        this.getSessionResultsUseCase = getSessionResultsUseCase;
    }

    @Override
    public ResponseEntity<SessionResultsResponse> getSessionResults(String sessionId) {
        Session session = getSessionResultsUseCase.get(UUID.fromString(sessionId));
        List<PlayerResult> dtoResults = session.results().stream()
                .map(r -> new PlayerResult(
                        r.playerId().toString(),
                        r.displayName().value(),
                        r.q1Correct(),
                        r.q2Correct(),
                        r.totalPoints()))
                .toList();
        return ResponseEntity.ok(new SessionResultsResponse(sessionId, session.date(), dtoResults));
    }
}
