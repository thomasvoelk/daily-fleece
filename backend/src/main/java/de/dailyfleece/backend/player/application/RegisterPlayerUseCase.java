package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
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
    public Player register(CompanyId companyId, DisplayName displayName) {
        return playerRepository.getOrCreate(companyId, displayName);
    }
}
