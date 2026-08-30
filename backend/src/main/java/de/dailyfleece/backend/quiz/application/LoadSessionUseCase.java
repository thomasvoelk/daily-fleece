package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.observation.annotation.Observed;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.stereotype.Service;

/** Returns the Session for a given date, if one exists. */
@Service
public class LoadSessionUseCase {

    private final SessionRepository sessionRepository;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public LoadSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Returns the Session for the given calendar date, or empty if no session has been created for
     * that date.
     */
    @Observed
    public Optional<Session> load(LocalDate date) {
        return sessionRepository.findByDate(date);
    }
}
