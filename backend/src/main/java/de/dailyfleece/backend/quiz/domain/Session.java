package de.dailyfleece.backend.quiz.domain;

import de.dailyfleece.backend.shared.PlayerName;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

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

    @Nullable
    private QuestionVoting q1Voting;

    @Nullable
    private QuestionVoting q2Voting;

    private Session(UUID sessionId, LocalDate date, UUID hostId) {
        this.sessionId = sessionId;
        this.date = date;
        this.hostId = hostId;
        this.phase = SessionPhase.LOBBY;
        this.players = new ArrayList<>();
    }

    public static Session create(LocalDate date, UUID hostId, PlayerName hostDisplayName) {
        Session session = new Session(UUID.randomUUID(), date, hostId);
        session.players.add(new SessionPlayer(hostId, hostDisplayName));
        return session;
    }

    public static Session reconstitute(
            UUID sessionId,
            LocalDate date,
            SessionPhase phase,
            List<SessionPlayer> players,
            UUID hostId,
            @Nullable QuestionVoting q1Voting,
            @Nullable QuestionVoting q2Voting) {
        Session session = new Session(sessionId, date, hostId);
        session.phase = phase;
        session.players.addAll(players);
        session.q1Voting = q1Voting;
        session.q2Voting = q2Voting;
        return session;
    }

    public void join(UUID playerId, PlayerName displayName) {
        if (phase != SessionPhase.LOBBY) {
            throw new LobbyClosed(sessionId, phase);
        }
        players.add(new SessionPlayer(playerId, displayName));
    }

    public void start() {
        phase = SessionAction.START.apply(phase, sessionId);
        q1Voting = QuestionVoting.open();
    }

    public void end() {
        phase = SessionAction.END.apply(phase, sessionId);
    }

    public void submitAnswer(QuestionKey question, UUID playerId, String answer) {
        QuestionVoting voting = votingFor(question);
        if (voting.status() == VotingStatus.CLOSED) {
            throw new VotingClosed(question, sessionId);
        }
        voting.submitAnswer(playerId.toString(), answer);
    }

    public void setCorrectAnswer(QuestionKey question, String correctAnswer) {
        votingFor(question).close(correctAnswer);
        if (question == QuestionKey.Q1) {
            q2Voting = QuestionVoting.open();
        } else {
            end();
        }
    }

    private QuestionVoting votingFor(QuestionKey question) {
        QuestionVoting voting = question == QuestionKey.Q1 ? q1Voting : q2Voting;
        if (voting == null) {
            throw new VotingClosed(question, sessionId);
        }
        return voting;
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

    public Optional<QuestionVoting> q1Voting() {
        return Optional.ofNullable(q1Voting);
    }

    public Optional<QuestionVoting> q2Voting() {
        return Optional.ofNullable(q2Voting);
    }

    public List<PlayerResult> results() {
        Map<String, String> q1Answers = q1Voting != null ? q1Voting.answers() : Map.of();
        String q1Correct = q1Voting != null ? q1Voting.correctAnswer() : null;
        Map<String, String> q2Answers = q2Voting != null ? q2Voting.answers() : Map.of();
        String q2Correct = q2Voting != null ? q2Voting.correctAnswer() : null;
        return players.stream()
                .map(p -> {
                    String pid = p.playerId().toString();
                    boolean q1 = q1Correct != null && q1Correct.equals(q1Answers.get(pid));
                    boolean q2 = q2Correct != null && q2Correct.equals(q2Answers.get(pid));
                    return new PlayerResult(p.playerId(), p.displayName(), q1, q2);
                })
                .toList();
    }
}
