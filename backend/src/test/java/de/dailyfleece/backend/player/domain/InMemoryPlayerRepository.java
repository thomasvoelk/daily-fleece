package de.dailyfleece.backend.player.domain;

import org.jspecify.annotations.Nullable;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class InMemoryPlayerRepository implements PlayerRepository {

    private final Map<String, Player> store = new HashMap<>();

    @Override
    public void save(Player player) {
        store.put(player.playerId(), player);
    }

    @Override
    public Optional<Player> findById(String playerId) {
        @Nullable Player player = store.get(playerId);
        return Optional.ofNullable(player);
    }
}
