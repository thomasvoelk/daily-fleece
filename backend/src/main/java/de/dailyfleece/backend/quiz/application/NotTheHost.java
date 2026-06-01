package de.dailyfleece.backend.quiz.application;

import java.util.UUID;

/** Thrown when a player attempts a host-only action but is not the session host. */
public final class NotTheHost extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public NotTheHost(UUID sessionId, UUID requestingPlayerId) {
        super("Player " + requestingPlayerId + " is not the host of session " + sessionId);
    }
}
