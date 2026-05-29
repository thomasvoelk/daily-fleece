package de.dailyfleece.backend.quiz.domain;

import java.util.Optional;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findById(String sessionId);

    Optional<Session> findByDate(String date);
}
