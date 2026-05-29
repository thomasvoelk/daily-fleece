package de.dailyfleece.backend.quiz.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public final class Session {

    private final String sessionId;
    private final String date;
    private SessionPhase phase;
    private final List<SessionPlayer> players;

    private Session(String sessionId, String date) {
        this.sessionId = sessionId;
        this.date = date;
        this.phase = SessionPhase.LOBBY;
        this.players = new ArrayList<>();
    }

    public static Session create(String date) {
        return new Session(UUID.randomUUID().toString(), date);
    }

    public static Session reconstitute(String sessionId, String date, SessionPhase phase, List<SessionPlayer> players) {
        Session session = new Session(sessionId, date);
        session.phase = phase;
        session.players.addAll(players);
        return session;
    }

    public void join(String playerId, String displayName) {
        if (phase != SessionPhase.LOBBY) {
            throw new CannotJoinSessionException(sessionId, phase);
        }
        players.add(new SessionPlayer(playerId, displayName));
    }

    public void start() {
        phase = SessionPhase.ACTIVE;
    }

    public void end() {
        phase = SessionPhase.ENDED;
    }

    public String sessionId() {
        return sessionId;
    }

    public String date() {
        return date;
    }

    public SessionPhase phase() {
        return phase;
    }

    public List<SessionPlayer> players() {
        return Collections.unmodifiableList(players);
    }
}
