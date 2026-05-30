package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Admits a Player to the Lobby of an existing Session. */
@Service
public class JoinSessionUseCase {

    private final SessionRepository sessionRepository;

    public JoinSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Adds the Player to the Session Lobby for the given date. Throws {@link
     * NoSessionForDateException} if no Session exists for that date.
     */
    public Session join(LocalDate date, UUID playerId, DisplayName displayName) {
        Session session = sessionRepository.findByDate(date).orElseThrow(() -> new NoSessionForDateException(date));
        session.join(playerId, displayName);
        sessionRepository.save(session);
        return session;
    }
}
