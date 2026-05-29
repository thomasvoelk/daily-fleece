package de.dailyfleece.backend.quiz.domain;

import org.jspecify.annotations.Nullable;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class InMemorySessionRepository implements SessionRepository {

    private final Map<String, Session> byId = new HashMap<>();
    private final Map<String, Session> byDate = new HashMap<>();

    @Override
    public void save(Session session) {
        byId.put(session.sessionId(), session);
        byDate.put(session.date(), session);
    }

    @Override
    public Optional<Session> findById(String sessionId) {
        @Nullable Session session = byId.get(sessionId);
        return Optional.ofNullable(session);
    }

    @Override
    public Optional<Session> findByDate(String date) {
        @Nullable Session session = byDate.get(date);
        return Optional.ofNullable(session);
    }
}
