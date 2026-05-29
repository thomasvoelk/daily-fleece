package de.dailyfleece.backend.quiz.application;

public final class NoSessionForDateException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public NoSessionForDateException(String date) {
        super("No session found for date " + date);
    }
}
