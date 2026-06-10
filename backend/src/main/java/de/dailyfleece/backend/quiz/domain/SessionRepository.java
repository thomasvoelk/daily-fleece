package de.dailyfleece.backend.quiz.domain;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/** Port for persisting and retrieving Sessions. */
public interface SessionRepository {

    void save(Session session);

    Optional<Session> findById(UUID sessionId);

    Optional<Session> findByKey(SessionKey key);

    Optional<Session> findByDate(LocalDate date);

    void deleteByDate(LocalDate date);
}
