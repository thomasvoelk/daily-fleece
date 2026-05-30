package de.dailyfleece.backend.quiz.application;

import java.util.UUID;

/** Thrown when no Session exists for the requested session ID. */
public final class SessionNotFound extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public SessionNotFound(UUID sessionId) {
        super("No session found with ID " + sessionId);
    }
}
