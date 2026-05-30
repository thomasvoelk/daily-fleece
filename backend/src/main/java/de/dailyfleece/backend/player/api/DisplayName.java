package de.dailyfleece.backend.player.api;

/**
 * The name shown to other Players in the Lobby, Session Results, and Leaderboard. Not an identity
 * — not unique, and not used for authentication.
 */
public record DisplayName(String value) {
    public DisplayName {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("DisplayName must not be blank");
        }
    }
}
