package de.dailyfleece.backend.player.domain;

import de.dailyfleece.backend.shared.PlayerName;
import java.util.List;
import java.util.UUID;

/** Port for persisting and querying the leaderboard. */
public interface LeaderboardRepository {

    void upsertScore(UUID playerId, PlayerName displayName, int pointsEarned);

    List<LeaderboardEntry> findAllOrderedByTotalPointsDesc();
}
