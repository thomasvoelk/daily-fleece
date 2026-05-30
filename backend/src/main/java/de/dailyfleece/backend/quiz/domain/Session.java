package de.dailyfleece.backend.quiz.domain;

import de.dailyfleece.backend.player.api.DisplayName;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * The Session aggregate. Owns the quiz lifecycle from Lobby through Active to Ended, and maintains
 * the list of Players who joined before the Session started.
 */
public final class Session {

    private final UUID sessionId;
    private final LocalDate date;
    private SessionPhase phase;
    private final List<SessionPlayer> players;

    private Session(UUID sessionId, LocalDate date) {
        this.sessionId = sessionId;
        this.date = date;
        this.phase = SessionPhase.LOBBY;
        this.players = new ArrayList<>();
    }

    public static Session create(LocalDate date) {
        return new Session(UUID.randomUUID(), date);
    }

    public static Session reconstitute(
            UUID sessionId, LocalDate date, SessionPhase phase, List<SessionPlayer> players) {
        Session session = new Session(sessionId, date);
        session.phase = phase;
        session.players.addAll(players);
        return session;
    }

    public void join(UUID playerId, DisplayName displayName) {
        if (phase != SessionPhase.LOBBY) {
            throw new LobbyClosed(sessionId, phase);
        }
        players.add(new SessionPlayer(playerId, displayName));
    }

    public void start() {
        phase = SessionPhase.ACTIVE;
    }

    public void end() {
        phase = SessionPhase.ENDED;
    }

    public UUID sessionId() {
        return sessionId;
    }

    public LocalDate date() {
        return date;
    }

    public SessionPhase phase() {
        return phase;
    }

    public List<SessionPlayer> players() {
        return Collections.unmodifiableList(players);
    }
}
