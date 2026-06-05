package de.dailyfleece.backend.shared;

/**
 * The name shown to other Players in the Lobby, Session Results, and Leaderboard. Not an identity
 * — not unique, and not used for authentication. Shared across quiz and player modules.
 */
public record PlayerName(String value) {
    public PlayerName {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("PlayerName must not be blank");
        }
    }
}
