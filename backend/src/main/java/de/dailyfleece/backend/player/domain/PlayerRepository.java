package de.dailyfleece.backend.player.domain;

import java.util.Optional;

public interface PlayerRepository {

    void save(Player player);

    Optional<Player> findById(String playerId);
}
