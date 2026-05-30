package de.dailyfleece.backend.quiz.domain;

import java.util.UUID;

/** Thrown when a Player attempts to join a Session that is no longer in the LOBBY phase. */
public final class CannotJoinSessionException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public CannotJoinSessionException(UUID sessionId, SessionPhase phase) {
        super("Cannot join session " + sessionId + ": session is in phase " + phase);
    }
}
