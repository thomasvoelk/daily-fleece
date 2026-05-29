package de.dailyfleece.backend.player.domain;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.DisplayName;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public class InMemoryPlayerRepository implements PlayerRepository {

    private final Map<UUID, Player> store = new HashMap<>();

    @Override
    public Player getOrCreate(CompanyId companyId, DisplayName displayName) {
        return store.values().stream()
                .filter(p -> p.companyId().equals(companyId))
                .findFirst()
                .orElseGet(() -> {
                    Player player = Player.register(companyId, displayName);
                    store.put(player.playerId(), player);
                    return player;
                });
    }

    @Override
    public Optional<Player> findById(UUID playerId) {
        @Nullable Player player = store.get(playerId);
        return Optional.ofNullable(player);
    }
}
