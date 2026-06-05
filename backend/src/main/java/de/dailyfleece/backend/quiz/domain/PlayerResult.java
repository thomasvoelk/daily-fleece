package de.dailyfleece.backend.quiz.domain;

import de.dailyfleece.backend.player.api.PlayerName;
import java.util.UUID;

/** Per-player outcome for a Session, computed at read time from voting data. */
public record PlayerResult(UUID playerId, PlayerName displayName, boolean q1Correct, boolean q2Correct) {

    public int totalPoints() {
        return (q1Correct ? 1 : 0) + (q2Correct ? 1 : 0);
    }
}
