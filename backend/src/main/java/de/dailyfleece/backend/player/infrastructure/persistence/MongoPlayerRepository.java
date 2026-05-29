package de.dailyfleece.backend.player.infrastructure.persistence;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

@Component
class MongoPlayerRepository implements PlayerRepository {

    private final MongoTemplate mongoTemplate;

    MongoPlayerRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Player getOrCreate(CompanyId companyId, DisplayName displayName) {
        Query query = Query.query(Criteria.where("companyId").is(companyId.value()));
        @Nullable PlayerDocument existing = mongoTemplate.findOne(query, PlayerDocument.class);
        if (existing != null) {
            return existing.toDomain();
        }
        Player player = Player.register(companyId, displayName);
        try {
            mongoTemplate.insert(PlayerDocument.fromDomain(player));
        } catch (DuplicateKeyException e) {
            // Race condition: another request registered the same companyId concurrently.
            @Nullable PlayerDocument raced = mongoTemplate.findOne(query, PlayerDocument.class);
            if (raced == null) {
                throw new IllegalStateException(
                        "Player not found after duplicate key on companyId=" + companyId.value(), e);
            }
            return raced.toDomain();
        }
        return player;
    }

    @Override
    public Optional<Player> findById(UUID playerId) {
        @Nullable PlayerDocument doc = mongoTemplate.findById(playerId.toString(), PlayerDocument.class);
        return Optional.ofNullable(doc).map(PlayerDocument::toDomain);
    }
}
