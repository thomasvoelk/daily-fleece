package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
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
    @Observed
    public Session get(@ObservationKeyValue(key = "session.id", cardinality = Cardinality.HIGH) UUID sessionId) {
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        if (session.phase() != SessionPhase.ENDED) {
            throw new SessionNotEnded(sessionId, session.phase());
        }
        return session;
    }

    /**
     * Loads the session by natural key and verifies it has ended. Throws {@link NoSessionForDate} if
     * not found, or {@link SessionNotEnded} if the session has not yet ended.
     */
    @Observed
    @ObservationKeyValue(key = "session.id", resolver = SessionIdKeyValueResolver.class, cardinality = Cardinality.HIGH)
    public Session get(SessionKey key) {
        Session session = sessionRepository.findByKey(key).orElseThrow(() -> new NoSessionForDate(key.date()));
        if (session.phase() != SessionPhase.ENDED) {
            throw new SessionNotEnded(session.sessionId(), session.phase());
        }
        return session;
    }
}
