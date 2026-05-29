package de.dailyfleece.backend.player.api;

public record DisplayName(String value) {
    public DisplayName {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("DisplayName must not be blank");
        }
    }
}
