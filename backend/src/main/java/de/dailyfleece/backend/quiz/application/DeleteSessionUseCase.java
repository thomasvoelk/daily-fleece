package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

/** Deletes today's session and its photos. Idempotent: no-op if no session exists. */
@Service
public class DeleteSessionUseCase {

    private final SessionRepository sessionRepository;
    private final PhotoRepository photoRepository;

    public DeleteSessionUseCase(SessionRepository sessionRepository, PhotoRepository photoRepository) {
        this.sessionRepository = sessionRepository;
        this.photoRepository = photoRepository;
    }

    /** Deletes the session for the given date and its photos; no-op if none exists. */
    public void delete(LocalDate date) {
        sessionRepository.findByDate(date).ifPresent(session -> {
            photoRepository.deleteBySessionId(session.sessionId());
            sessionRepository.deleteByDate(date);
        });
    }
}
