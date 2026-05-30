package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
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
     * Adds the Player to the Session Lobby identified by session ID. Throws {@link SessionNotFound}
     * if no Session exists with that ID, or {@link
     * de.dailyfleece.backend.quiz.domain.LobbyClosed} if the session is no longer in Lobby phase.
     */
    public Session join(UUID sessionId, UUID playerId, DisplayName displayName) {
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        session.join(playerId, displayName);
        sessionRepository.save(session);
        return session;
    }
}
