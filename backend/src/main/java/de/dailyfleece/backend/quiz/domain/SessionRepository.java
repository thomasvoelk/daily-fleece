package de.dailyfleece.backend.quiz.domain;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findById(UUID sessionId);

    Optional<Session> findByDate(LocalDate date);
}
