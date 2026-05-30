package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.backend.quiz.application.NoSessionForDate;
import de.dailyfleece.backend.quiz.application.SessionNotFound;
import de.dailyfleece.backend.quiz.domain.LobbyClosed;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "de.dailyfleece.backend.quiz.infrastructure.web")
class QuizExceptionHandler {

    @ExceptionHandler({NoSessionForDate.class, SessionNotFound.class})
    ProblemDetail handleSessionNotFound(RuntimeException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("/problems/session-not-found"));
        problem.setTitle("Session Not Found");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(LobbyClosed.class)
    ProblemDetail handleLobbyClosed(LobbyClosed ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("/problems/session-already-active"));
        problem.setTitle("Session Already Active");
        problem.setDetail(ex.getMessage());
        return problem;
    }
}
