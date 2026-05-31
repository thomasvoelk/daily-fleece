package de.dailyfleece.backend.quiz.application;

import java.time.LocalDate;

public final class SessionAlreadyExists extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public SessionAlreadyExists(LocalDate date) {
        super("A session for " + date + " already exists");
    }
}
