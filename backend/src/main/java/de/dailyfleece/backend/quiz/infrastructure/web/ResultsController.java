package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.ResultsApi;
import de.dailyfleece.api.model.PlayerResult;
import de.dailyfleece.api.model.SessionResultsResponse;
import de.dailyfleece.backend.quiz.application.GetSessionResultsUseCase;
import de.dailyfleece.backend.quiz.domain.ProjectId;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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

    @Override
    public ResponseEntity<SessionResultsResponse> getSessionResultsByKey(String projectId, LocalDate date) {
        Session session = getSessionResultsUseCase.get(new SessionKey(new ProjectId(projectId), date));
        Map<String, String> q1Answers = session.q1Voting().map(v -> v.answers()).orElse(Map.of());
        Map<String, String> q2Answers = session.q2Voting().map(v -> v.answers()).orElse(Map.of());
        List<PlayerResult> dtoResults = session.results().stream()
                .map(r -> {
                    String pid = r.playerId().toString();
                    PlayerResult dto = new PlayerResult(
                            pid, r.displayName().value(), r.q1Correct(), r.q2Correct(), r.totalPoints());
                    dto.setQ1Answer(q1Answers.get(pid));
                    dto.setQ2Answer(q2Answers.get(pid));
                    return dto;
                })
                .toList();
        SessionResultsResponse body =
                new SessionResultsResponse(session.sessionId().toString(), session.date(), dtoResults);
        body.setQ1CorrectAnswer(session.q1Voting().map(v -> v.correctAnswer()).orElse(null));
        body.setQ2CorrectAnswer(session.q2Voting().map(v -> v.correctAnswer()).orElse(null));
        return ResponseEntity.ok(body);
    }
}
