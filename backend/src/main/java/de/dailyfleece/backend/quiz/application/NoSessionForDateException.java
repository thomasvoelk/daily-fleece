package de.dailyfleece.backend.quiz.application;

import java.time.LocalDate;

/** Thrown when no Session exists for the requested date. */
public final class NoSessionForDateException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public NoSessionForDateException(LocalDate date) {
        super("No session found for date " + date);
    }
}
