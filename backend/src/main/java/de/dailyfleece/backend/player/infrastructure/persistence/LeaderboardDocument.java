package de.dailyfleece.backend.player.infrastructure.persistence;

import de.dailyfleece.backend.player.domain.LeaderboardEntry;
import de.dailyfleece.backend.shared.PlayerName;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "leaderboard")
record LeaderboardDocument(@Id String playerId, String displayName, int totalPoints, int sessionsParticipated) {

    LeaderboardEntry toDomain() {
        return new LeaderboardEntry(
                UUID.fromString(playerId), new PlayerName(displayName), totalPoints, sessionsParticipated);
    }
}
