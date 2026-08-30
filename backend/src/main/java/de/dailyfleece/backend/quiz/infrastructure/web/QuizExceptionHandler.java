package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.backend.quiz.application.NoSessionForDate;
import de.dailyfleece.backend.quiz.application.NotTheHost;
import de.dailyfleece.backend.quiz.application.SessionAlreadyExists;
import de.dailyfleece.backend.quiz.application.SessionNotEnded;
import de.dailyfleece.backend.quiz.application.SessionNotFound;
import de.dailyfleece.backend.quiz.domain.InvalidPhaseTransition;
import de.dailyfleece.backend.quiz.domain.LobbyClosed;
import de.dailyfleece.backend.quiz.domain.VotingClosed;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.filter.ServerHttpObservationFilter;

@RestControllerAdvice(basePackages = "de.dailyfleece.backend.quiz.infrastructure.web")
class QuizExceptionHandler {

    @ExceptionHandler({NoSessionForDate.class, SessionNotFound.class})
    ProblemDetail handleSessionNotFound(RuntimeException ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("/problems/session-not-found"));
        problem.setTitle("Session Not Found");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(SessionAlreadyExists.class)
    ProblemDetail handleSessionAlreadyExists(SessionAlreadyExists ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("/problems/session-already-exists"));
        problem.setTitle("Session Already Exists");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(LobbyClosed.class)
    ProblemDetail handleLobbyClosed(LobbyClosed ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("/problems/session-already-active"));
        problem.setTitle("Session Already Active");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(NotTheHost.class)
    ProblemDetail handleNotTheHost(NotTheHost ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problem.setType(URI.create("/problems/not-the-host"));
        problem.setTitle("Forbidden");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(SessionNotEnded.class)
    ProblemDetail handleSessionNotEnded(SessionNotEnded ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("/problems/session-not-ended"));
        problem.setTitle("Session Not Ended");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(InvalidPhaseTransition.class)
    ProblemDetail handleInvalidPhaseTransition(InvalidPhaseTransition ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("/problems/invalid-phase-transition"));
        problem.setTitle("Invalid Phase Transition");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(VotingClosed.class)
    ProblemDetail handleVotingClosed(VotingClosed ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("/problems/voting-closed"));
        problem.setTitle("Voting Closed");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(InvalidQuestionKey.class)
    ProblemDetail handleInvalidQuestionKey(InvalidQuestionKey ex, HttpServletRequest request) {
        markErrored(ex, request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create("/problems/invalid-question-key"));
        problem.setTitle("Invalid Question Key");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    private static void markErrored(Exception ex, HttpServletRequest request) {
        ServerHttpObservationFilter.findObservationContext(request).ifPresent(context -> context.setError(ex));
    }
}
