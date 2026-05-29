package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;

public class RegisterPlayerUseCase {

    private final PlayerRepository playerRepository;

    public RegisterPlayerUseCase(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public Player register(String displayName) {
        Player player = Player.register(displayName);
        playerRepository.save(player);
        return player;
    }
}
