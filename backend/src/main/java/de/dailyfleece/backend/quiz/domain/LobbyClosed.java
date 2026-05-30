package de.dailyfleece.backend.quiz.domain;

import java.util.UUID;

/** Thrown when a Player attempts to join a Session that is no longer in the LOBBY phase. */
public final class LobbyClosed extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public LobbyClosed(UUID sessionId, SessionPhase phase) {
        super("Session " + sessionId + " lobby is closed (phase: " + phase + ")");
    }
}
