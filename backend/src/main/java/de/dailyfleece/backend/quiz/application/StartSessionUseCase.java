package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Transitions a Session from Lobby to Active phase on host request. */
@Service
public class StartSessionUseCase {

    private final SessionRepository sessionRepository;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public StartSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Starts the session identified by {@code sessionId}. Verifies that {@code requestingPlayerId}
     * is the host, then delegates the phase transition to the domain. Throws {@link SessionNotFound}
     * if the session does not exist, {@link NotTheHost} if the caller is not the host, or {@link
     * de.dailyfleece.backend.quiz.domain.InvalidPhaseTransition} if the session is not in Lobby phase.
     */
    @Observed
    @ObservationKeyValue(
            key = "session.phase",
            resolver = SessionPhaseKeyValueResolver.class,
            cardinality = Cardinality.LOW)
    public Session start(
            @ObservationKeyValue(key = "session.id", cardinality = Cardinality.HIGH) UUID sessionId,
            @ObservationKeyValue(key = "player.id", cardinality = Cardinality.HIGH) UUID requestingPlayerId) {
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        if (!session.hostId().equals(requestingPlayerId)) {
            throw new NotTheHost(sessionId, requestingPlayerId);
        }
        session.start();
        sessionRepository.save(session);
        return session;
    }
}
