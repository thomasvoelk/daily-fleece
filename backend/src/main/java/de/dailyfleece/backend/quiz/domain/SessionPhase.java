package de.dailyfleece.backend.quiz.domain;

/** The three lifecycle phases of a Session: waiting (LOBBY), questions live (ACTIVE), scoring complete (ENDED). */
public enum SessionPhase {
    LOBBY,
    ACTIVE,
    ENDED
}
