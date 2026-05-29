package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;

public class JoinSessionUseCase {

    private final SessionRepository sessionRepository;

    public JoinSessionUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Session join(String date, String playerId, String displayName) {
        Session session = sessionRepository.findByDate(date)
                .orElseThrow(() -> new NoSessionForDateException(date));
        session.join(playerId, displayName);
        sessionRepository.save(session);
        return session;
    }
}
