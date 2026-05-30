package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.stereotype.Service;

/** Returns the Session for a given date, if one exists. */
@Service
public class LoadSessionUseCase {

    private final SessionRepository sessionRepository;

    public LoadSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Returns the Session for the given calendar date, or empty if no session has been created for
     * that date.
     */
    public Optional<Session> load(LocalDate date) {
        return sessionRepository.findByDate(date);
    }
}
