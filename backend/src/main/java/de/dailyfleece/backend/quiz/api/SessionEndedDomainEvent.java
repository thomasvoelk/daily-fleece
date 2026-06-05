package de.dailyfleece.backend.quiz.api;

import de.dailyfleece.backend.player.api.PlayerName;
import java.util.List;
import java.util.UUID;

/** Published when a quiz session ends (Q2 correct answer is set). */
public record SessionEndedDomainEvent(UUID sessionId, List<PlayerScore> scores) {

    /** Per-player score carried in the event. */
    public record PlayerScore(UUID playerId, PlayerName displayName, int pointsEarned) {}
}
