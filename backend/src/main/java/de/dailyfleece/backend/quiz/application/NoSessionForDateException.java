package de.dailyfleece.backend.quiz.application;

import java.time.LocalDate;

public final class NoSessionForDateException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public NoSessionForDateException(LocalDate date) {
        super("No session found for date " + date);
    }
}
