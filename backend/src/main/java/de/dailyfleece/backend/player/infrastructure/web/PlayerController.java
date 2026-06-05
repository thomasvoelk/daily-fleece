package de.dailyfleece.backend.player.infrastructure.web;

import de.dailyfleece.api.PlayersApi;
import de.dailyfleece.api.model.PlayerResponse;
import de.dailyfleece.api.model.RegisterPlayerRequest;
import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.application.RegisterPlayerUseCase;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.shared.PlayerName;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/{version}", version = "1.0+")
class PlayerController implements PlayersApi {

    private final RegisterPlayerUseCase registerPlayerUseCase;

    PlayerController(RegisterPlayerUseCase registerPlayerUseCase) {
        this.registerPlayerUseCase = registerPlayerUseCase;
    }

    @Override
    public ResponseEntity<PlayerResponse> registerPlayer(RegisterPlayerRequest request) {
        CompanyId companyId = new CompanyId(request.getCompanyId());
        PlayerName displayName = new PlayerName(request.getDisplayName());
        Player player = registerPlayerUseCase.register(companyId, displayName);
        PlayerResponse response = new PlayerResponse(
                player.playerId().toString(), player.displayName().value());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
