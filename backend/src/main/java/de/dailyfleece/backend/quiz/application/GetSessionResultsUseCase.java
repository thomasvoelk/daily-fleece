package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Returns an ended session for results rendering. Correctness is derived at read time from stored answers. */
@Service
public class GetSessionResultsUseCase {

    private final SessionRepository sessionRepository;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public GetSessionResultsUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Loads the session and verifies it has ended. Throws {@link SessionNotFound} if the session
     * does not exist, or {@link SessionNotEnded} if the session has not yet ended.
     */
    public Session get(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        if (session.phase() != SessionPhase.ENDED) {
            throw new SessionNotEnded(sessionId, session.phase());
        }
        return session;
    }
}
