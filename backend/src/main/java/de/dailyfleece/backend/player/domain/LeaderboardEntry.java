package de.dailyfleece.backend.player.domain;

import de.dailyfleece.backend.shared.PlayerName;
import java.util.UUID;

/** Cumulative leaderboard standing for a single player across all sessions. */
public record LeaderboardEntry(UUID playerId, PlayerName displayName, int totalPoints, int sessionsParticipated) {}
