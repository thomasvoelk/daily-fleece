package de.dailyfleece.backend.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.filter.ServerHttpObservationFilter;

/** Handles exceptions that can be thrown by any controller, regardless of module. */
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        ServerHttpObservationFilter.findObservationContext(request).ifPresent(context -> context.setError(ex));
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create("/problems/invalid-input"));
        problem.setTitle("Invalid Input");
        problem.setDetail(ex.getMessage());
        return problem;
    }
}
