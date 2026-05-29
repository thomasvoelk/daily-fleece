package de.dailyfleece.backend.player.domain;

import java.util.UUID;

public record Player(String playerId, String displayName) {

    public static Player register(String displayName) {
        return new Player(UUID.randomUUID().toString(), displayName);
    }

    public static Player reconstitute(String playerId, String displayName) {
        return new Player(playerId, displayName);
    }
}
