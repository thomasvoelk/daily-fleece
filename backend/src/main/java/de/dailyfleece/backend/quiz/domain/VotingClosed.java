package de.dailyfleece.backend.quiz.domain;

import java.util.UUID;

/** Thrown when a player attempts to submit an answer after the host has closed voting. */
public final class VotingClosed extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public VotingClosed(QuestionKey question, UUID sessionId) {
        super("Voting for " + question + " is closed in session " + sessionId);
    }
}
