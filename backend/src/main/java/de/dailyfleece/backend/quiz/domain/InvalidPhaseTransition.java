package de.dailyfleece.backend.quiz.domain;

import java.util.UUID;

/** Thrown when a session action is applied in an incompatible phase. */
public final class InvalidPhaseTransition extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public InvalidPhaseTransition(SessionAction action, SessionPhase current, UUID sessionId) {
        super("Session " + sessionId + " cannot apply " + action + " from phase " + current);
    }
}
