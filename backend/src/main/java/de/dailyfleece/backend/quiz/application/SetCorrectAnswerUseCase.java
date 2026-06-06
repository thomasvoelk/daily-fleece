package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.api.SessionEndedDomainEvent;
import de.dailyfleece.backend.quiz.api.SessionEndedDomainEvent.PlayerScore;
import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/** Closes voting for a question, records the correct answer, and advances the session phase. */
@Service
public class SetCorrectAnswerUseCase {

    private final SessionRepository sessionRepository;
    private final ApplicationEventPublisher eventPublisher;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public SetCorrectAnswerUseCase(SessionRepository sessionRepository, ApplicationEventPublisher eventPublisher) {
        this.sessionRepository = sessionRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Declares {@code correctAnswer} for {@code question}. Verifies the caller is the host, then
     * delegates to the domain. Throws {@link SessionNotFound} if the session does not exist or
     * {@link NotTheHost} if the caller is not the host.
     */
    public Session set(UUID sessionId, QuestionKey question, UUID requestingPlayerId, String correctAnswer) {
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        if (!session.hostId().equals(requestingPlayerId)) {
            throw new NotTheHost(sessionId, requestingPlayerId);
        }
        session.setCorrectAnswer(question, correctAnswer);
        sessionRepository.save(session);
        if (session.phase() == SessionPhase.ENDED) {
            List<PlayerScore> scores = session.results().stream()
                    .map(r -> new PlayerScore(r.playerId(), r.displayName(), r.totalPoints()))
                    .toList();
            eventPublisher.publishEvent(new SessionEndedDomainEvent(sessionId, scores));
        }
        return session;
    }
}
