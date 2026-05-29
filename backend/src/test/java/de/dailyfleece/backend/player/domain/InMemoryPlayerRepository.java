package de.dailyfleece.backend.player.domain;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.jspecify.annotations.Nullable;

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
