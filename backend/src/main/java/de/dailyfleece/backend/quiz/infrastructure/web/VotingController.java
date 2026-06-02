package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.VotingApi;
import de.dailyfleece.api.model.SessionResponse;
import de.dailyfleece.api.model.SetCorrectAnswerRequest;
import de.dailyfleece.api.model.SubmitAnswerRequest;
import de.dailyfleece.backend.quiz.application.SetCorrectAnswerUseCase;
import de.dailyfleece.backend.quiz.application.SubmitAnswerUseCase;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/{version}", version = "1.0+")
class VotingController implements VotingApi {

    private final SubmitAnswerUseCase submitAnswerUseCase;
    private final SetCorrectAnswerUseCase setCorrectAnswerUseCase;
    private final SessionResponseMapper mapper;

    VotingController(
            SubmitAnswerUseCase submitAnswerUseCase,
            SetCorrectAnswerUseCase setCorrectAnswerUseCase,
            SessionResponseMapper mapper) {
        this.submitAnswerUseCase = submitAnswerUseCase;
        this.setCorrectAnswerUseCase = setCorrectAnswerUseCase;
        this.mapper = mapper;
    }

    @Override
    public ResponseEntity<Void> submitAnswer(String sessionId, String question, SubmitAnswerRequest request) {
        QuestionKey questionKey = parseQuestionKey(question);
        UUID sessionUuid = UUID.fromString(sessionId);
        UUID playerId = UUID.fromString(request.getPlayerId());
        submitAnswerUseCase.submit(sessionUuid, questionKey, playerId, request.getAnswer());
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<SessionResponse> setCorrectAnswer(
            String sessionId, String question, SetCorrectAnswerRequest request) {
        QuestionKey questionKey = parseQuestionKey(question);
        UUID sessionUuid = UUID.fromString(sessionId);
        UUID hostId = UUID.fromString(request.getHostId());
        Session session = setCorrectAnswerUseCase.set(sessionUuid, questionKey, hostId, request.getCorrectAnswer());
        return ResponseEntity.ok(mapper.toResponse(session));
    }

    private static QuestionKey parseQuestionKey(String question) {
        return switch (question.toLowerCase(Locale.ROOT)) {
            case "q1" -> QuestionKey.Q1;
            case "q2" -> QuestionKey.Q2;
            default -> throw new InvalidQuestionKey(question);
        };
    }
}
