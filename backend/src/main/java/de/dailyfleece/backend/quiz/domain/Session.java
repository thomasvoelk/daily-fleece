package de.dailyfleece.backend.quiz.domain;

import de.dailyfleece.backend.player.api.PlayerName;
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

    /**
     * Identity reference to the Player who created this Session. Stored as a UUID to avoid
     * embedding a Player object inside this aggregate; cross-aggregate navigation goes via the
     * player module's repository.
     */
    private final UUID hostId;

    private SessionPhase phase;
    private final List<SessionPlayer> players;
    private final SessionPhotos photos;

    private Session(UUID sessionId, LocalDate date, UUID hostId, SessionPhotos photos) {
        this.sessionId = sessionId;
        this.date = date;
        this.hostId = hostId;
        this.phase = SessionPhase.LOBBY;
        this.players = new ArrayList<>();
        this.photos = photos;
    }

    public static Session create(LocalDate date, UUID hostId, PlayerName hostDisplayName, SessionPhotos photos) {
        Session session = new Session(UUID.randomUUID(), date, hostId, photos);
        session.players.add(new SessionPlayer(hostId, hostDisplayName));
        return session;
    }

    public static Session reconstitute(
            UUID sessionId,
            LocalDate date,
            SessionPhase phase,
            List<SessionPlayer> players,
            UUID hostId,
            SessionPhotos photos) {
        Session session = new Session(sessionId, date, hostId, photos);
        session.phase = phase;
        session.players.addAll(players);
        return session;
    }

    public void join(UUID playerId, PlayerName displayName) {
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

    /**
     * Returns the identity reference to the Player who created this Session.
     *
     * @see #hostId field for full explanation
     */
    public UUID hostId() {
        return hostId;
    }

    public SessionPhase phase() {
        return phase;
    }

    public List<SessionPlayer> players() {
        return Collections.unmodifiableList(players);
    }

    public SessionPhotos photos() {
        return photos;
    }
}
