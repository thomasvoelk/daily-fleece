package de.dailyfleece.backend.quiz.infrastructure.web;

/** Thrown when a path segment cannot be mapped to a known QuestionKey. */
final class InvalidQuestionKey extends RuntimeException {

    private static final long serialVersionUID = 1L;

    InvalidQuestionKey(String value) {
        super("Unknown question key: '" + value + "'. Expected q1 or q2.");
    }
}
