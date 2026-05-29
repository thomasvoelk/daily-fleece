package de.dailyfleece.backend.quiz.domain;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public class InMemorySessionRepository implements SessionRepository {

    private final Map<UUID, Session> byId = new HashMap<>();
    private final Map<LocalDate, Session> byDate = new HashMap<>();

    @Override
    public void save(Session session) {
        byId.put(session.sessionId(), session);
        byDate.put(session.date(), session);
    }

    @Override
    public Optional<Session> findById(UUID sessionId) {
        @Nullable Session session = byId.get(sessionId);
        return Optional.ofNullable(session);
    }

    @Override
    public Optional<Session> findByDate(LocalDate date) {
        @Nullable Session session = byDate.get(date);
        return Optional.ofNullable(session);
    }
}
