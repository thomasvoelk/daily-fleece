package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.model.PlayerAnswer;
import de.dailyfleece.api.model.QuestionVoting;
import de.dailyfleece.api.model.SessionPlayer;
import de.dailyfleece.api.model.SessionResponse;
import de.dailyfleece.api.model.SessionResponse.PhaseEnum;
import de.dailyfleece.api.model.VotingState;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.VotingStatus;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
class SessionResponseMapper {

    private static final QuestionVoting CLOSED_STUB = new QuestionVoting(QuestionVoting.StatusEnum.CLOSED);

    SessionResponse toResponse(Session session) {
        List<SessionPlayer> players = session.players().stream()
                .map(p -> new SessionPlayer(
                        p.playerId().toString(), p.displayName().value()))
                .toList();
        VotingState voting = new VotingState(
                session.q1Voting().map(this::toQuestionVoting).orElse(CLOSED_STUB),
                session.q2Voting().map(this::toQuestionVoting).orElse(CLOSED_STUB));
        return new SessionResponse(
                session.sessionId().toString(),
                "default",
                session.date(),
                toPhaseEnum(session.phase()),
                session.hostId().toString(),
                players,
                voting);
    }

    private QuestionVoting toQuestionVoting(de.dailyfleece.backend.quiz.domain.QuestionVoting domain) {
        QuestionVoting dto = new QuestionVoting(
                domain.status() == VotingStatus.OPEN
                        ? QuestionVoting.StatusEnum.OPEN
                        : QuestionVoting.StatusEnum.CLOSED);
        if (domain.status() == VotingStatus.CLOSED) {
            dto.setCorrectAnswer(domain.correctAnswer());
            Map<String, PlayerAnswer> answers = domain.answers().entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> new PlayerAnswer("", e.getValue())));
            dto.setAnswers(answers);
        }
        return dto;
    }

    private static PhaseEnum toPhaseEnum(SessionPhase phase) {
        return switch (phase) {
            case LOBBY -> PhaseEnum.LOBBY;
            case ACTIVE -> PhaseEnum.ACTIVE;
            case ENDED -> PhaseEnum.ENDED;
        };
    }
}
