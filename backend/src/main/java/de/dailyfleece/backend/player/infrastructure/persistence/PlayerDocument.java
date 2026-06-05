package de.dailyfleece.backend.player.infrastructure.persistence;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.shared.PlayerName;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "players")
record PlayerDocument(@Id String playerId, String companyId, String displayName) {

    static PlayerDocument fromDomain(Player player) {
        return new PlayerDocument(
                player.playerId().toString(),
                player.companyId().value(),
                player.displayName().value());
    }

    Player toDomain() {
        return Player.reconstitute(UUID.fromString(playerId), new CompanyId(companyId), new PlayerName(displayName));
    }
}
