package de.dailyfleece.backend.quiz.domain;

import java.util.UUID;

/** Encodes the valid session lifecycle transitions. Each action knows its required source phase and target phase. */
public enum SessionAction {
    START(SessionPhase.LOBBY, SessionPhase.ACTIVE),
    END(SessionPhase.ACTIVE, SessionPhase.ENDED);

    private final SessionPhase requiredPhase;
    private final SessionPhase targetPhase;

    SessionAction(SessionPhase requiredPhase, SessionPhase targetPhase) {
        this.requiredPhase = requiredPhase;
        this.targetPhase = targetPhase;
    }

    public SessionPhase apply(SessionPhase current, UUID sessionId) {
        if (current != requiredPhase) {
            throw new InvalidPhaseTransition(this, current, sessionId);
        }
        return targetPhase;
    }
}
