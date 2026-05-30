package de.dailyfleece.backend.player.domain;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.DisplayName;
import java.util.Optional;
import java.util.UUID;

/** Port for persisting and retrieving Players. */
public interface PlayerRepository {

    Player getOrCreate(CompanyId companyId, DisplayName displayName);

    Optional<Player> findById(UUID playerId);
}
