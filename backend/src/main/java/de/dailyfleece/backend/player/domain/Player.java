package de.dailyfleece.backend.player.domain;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.shared.PlayerName;
import java.util.UUID;

/**
 * A registered participant. Identified internally by a UUID; authenticated via CompanyId; shown to
 * others via PlayerName. Persists across Sessions.
 */
public record Player(UUID playerId, CompanyId companyId, PlayerName displayName) {

    public static Player register(CompanyId companyId, PlayerName displayName) {
        return new Player(UUID.randomUUID(), companyId, displayName);
    }

    public static Player reconstitute(UUID playerId, CompanyId companyId, PlayerName displayName) {
        return new Player(playerId, companyId, displayName);
    }
}
