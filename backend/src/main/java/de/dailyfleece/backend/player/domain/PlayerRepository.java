package de.dailyfleece.backend.player.domain;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.PlayerName;
import java.util.Optional;
import java.util.UUID;

/** Port for persisting and retrieving Players. */
public interface PlayerRepository {

    Player getOrCreate(CompanyId companyId, PlayerName displayName);

    Optional<Player> findById(UUID playerId);
}
