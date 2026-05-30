package de.dailyfleece.backend.player.api;

/**
 * The company employee identifier a Player enters to prove their identity. Used to recover Player
 * identity and Leaderboard history across sessions and devices. Never shown to other Players.
 */
public record CompanyId(String value) {
    public CompanyId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("CompanyId must not be blank");
        }
    }
}
