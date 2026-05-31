package de.dailyfleece.backend.player.api;

/**
 * The name shown to other Players in the Lobby, Session Results, and Leaderboard. Not an identity
 * — not unique, and not used for authentication.
 */
public record PlayerName(String value) {
    public PlayerName {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("PlayerName must not be blank");
        }
    }
}
