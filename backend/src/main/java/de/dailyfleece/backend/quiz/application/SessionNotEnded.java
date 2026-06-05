package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.SessionPhase;
import java.util.UUID;

/** Thrown when session results are requested before the session has ended. */
public class SessionNotEnded extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public SessionNotEnded(UUID sessionId, SessionPhase currentPhase) {
        super("Results are only available after the session has ended. Current phase: " + currentPhase.name());
    }
}
