package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;

public class RegisterPlayerUseCase {

    private final PlayerRepository playerRepository;

    public RegisterPlayerUseCase(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public Player register(CompanyId companyId, DisplayName displayName) {
        return playerRepository.getOrCreate(companyId, displayName);
    }
}
