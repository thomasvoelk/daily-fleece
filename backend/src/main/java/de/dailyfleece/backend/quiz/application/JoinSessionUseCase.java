package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.UUID;

public class JoinSessionUseCase {

    private final SessionRepository sessionRepository;

    public JoinSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Session join(LocalDate date, UUID playerId, DisplayName displayName) {
        Session session = sessionRepository.findByDate(date).orElseThrow(() -> new NoSessionForDateException(date));
        session.join(playerId, displayName);
        sessionRepository.save(session);
        return session;
    }
}
