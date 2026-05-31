package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.api.model.QuestionVoting;
import de.dailyfleece.api.model.SessionPlayer;
import de.dailyfleece.api.model.SessionResponse;
import de.dailyfleece.api.model.SessionResponse.PhaseEnum;
import de.dailyfleece.api.model.VotingState;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
class SessionResponseMapper {

    // Stub voting state for Lobby phase — no questions open yet.
    private static final VotingState STUB_VOTING = new VotingState(
            new QuestionVoting(QuestionVoting.StatusEnum.CLOSED), new QuestionVoting(QuestionVoting.StatusEnum.CLOSED));

    SessionResponse toResponse(Session session) {
        List<SessionPlayer> players = session.players().stream()
                .map(p -> new SessionPlayer(
                        p.playerId().toString(), p.displayName().value()))
                .toList();
        return new SessionResponse(
                session.sessionId().toString(),
                "default",
                session.date(),
                toPhaseEnum(session.phase()),
                session.hostId().toString(),
                players,
                STUB_VOTING);
    }

    private static PhaseEnum toPhaseEnum(SessionPhase phase) {
        return switch (phase) {
            case LOBBY -> PhaseEnum.LOBBY;
            case ACTIVE -> PhaseEnum.ACTIVE;
            case ENDED -> PhaseEnum.ENDED;
        };
    }
}
