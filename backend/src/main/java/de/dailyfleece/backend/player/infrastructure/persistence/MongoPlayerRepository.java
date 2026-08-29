package de.dailyfleece.backend.player.infrastructure.persistence;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.domain.Player;
import de.dailyfleece.backend.player.domain.PlayerRepository;
import de.dailyfleece.backend.shared.PlayerName;
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
    public Player getOrCreate(CompanyId companyId, PlayerName displayName) {
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
            return resolveAfterDuplicateKey(query, companyId, e);
        }
        return player;
    }

    @Override
    public Optional<Player> findById(UUID playerId) {
        @Nullable PlayerDocument doc = mongoTemplate.findById(playerId.toString(), PlayerDocument.class);
        return Optional.ofNullable(doc).map(PlayerDocument::toDomain);
    }

    // The null branch here is unreachable given current domain invariants: no Player-delete
    // operation exists anywhere in this domain (re-checked df-0b86.6), a unique index on companyId
    // with no TTL/expiry prevents Mongo from reaping the document itself, and no non-primary
    // ReadPreference is configured, so this re-query can't observe a stale absence either. Re-check
    // this whenever a player-delete feature or a non-primary read preference is introduced. Real
    // reachability isn't the point of testing this branch, though: NullAway/SpotBugs both require
    // handling this null regardless (see df-0b86.4), so
    // MongoPlayerRepositoryDuplicateKeyRaceFailureTest forces it via a hand-written MongoTemplate
    // subclass (see df-0b86.6) to prove the defense-in-depth actually works.
    private Player resolveAfterDuplicateKey(Query query, CompanyId companyId, DuplicateKeyException e) {
        @Nullable PlayerDocument raced = mongoTemplate.findOne(query, PlayerDocument.class);
        if (raced == null) {
            throw new IllegalStateException(
                    "Player not found after duplicate key on companyId=" + companyId.value(), e);
        }
        return raced.toDomain();
    }
}
