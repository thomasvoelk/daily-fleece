package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import de.dailyfleece.backend.shared.PlayerName;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
import org.springframework.stereotype.Service;

/** Registers a new Player or recovers an existing one by Company ID. */
@Service
public class RegisterPlayerUseCase {

    private final PlayerRepository playerRepository;

    public RegisterPlayerUseCase(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    /**
     * Finds the Player with the given Company ID, or creates and persists a new one. Idempotent —
     * safe to call on every login.
     */
    @Observed
    @ObservationKeyValue(key = "player.id", resolver = PlayerIdKeyValueResolver.class, cardinality = Cardinality.HIGH)
    public Player register(CompanyId companyId, PlayerName displayName) {
        return playerRepository.getOrCreate(companyId, displayName);
    }
}
