package de.dailyfleece.backend.quiz.domain;

public final class CannotJoinSessionException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public CannotJoinSessionException(String sessionId, SessionPhase phase) {
        super("Cannot join session " + sessionId + ": session is in phase " + phase);
    }
}
