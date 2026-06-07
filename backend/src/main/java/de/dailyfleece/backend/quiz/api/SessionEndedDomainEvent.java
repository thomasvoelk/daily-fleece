package de.dailyfleece.backend.quiz.api;

import de.dailyfleece.backend.shared.PlayerName;
import java.util.List;
import java.util.UUID;

/** Published when a quiz session ends (Q2 correct answer is set). */
public record SessionEndedDomainEvent(UUID sessionId, List<PlayerScore> scores) {

    public SessionEndedDomainEvent {
        scores = List.copyOf(scores);
    }

    /** Per-player score carried in the event. */
    public record PlayerScore(UUID playerId, PlayerName displayName, int pointsEarned) {}
}
