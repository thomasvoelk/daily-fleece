package de.dailyfleece.backend.quiz.application;

import java.time.LocalDate;
import java.time.ZoneId;

/** Thrown when no Session exists for the requested date. */
public final class NoSessionForDate extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public NoSessionForDate(LocalDate date) {
        super("No session found for date " + date);
    }

    /** Factory for throwing when no session exists for today's date. */
    public static NoSessionForDate today() {
        return new NoSessionForDate(LocalDate.now(ZoneId.systemDefault()));
    }
}
