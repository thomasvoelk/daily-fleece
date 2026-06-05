package de.dailyfleece.backend.player.infrastructure.persistence;

import de.dailyfleece.backend.player.domain.LeaderboardEntry;
import de.dailyfleece.backend.player.domain.LeaderboardRepository;
import de.dailyfleece.backend.shared.PlayerName;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
class MongoLeaderboardRepository implements LeaderboardRepository {

    private final MongoTemplate mongoTemplate;

    MongoLeaderboardRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void upsertScore(UUID playerId, PlayerName displayName, int pointsEarned) {
        Query query = Query.query(Criteria.where("_id").is(playerId.toString()));
        Update update = new Update()
                .inc("totalPoints", pointsEarned)
                .inc("sessionsParticipated", 1)
                .set("displayName", displayName.value());
        mongoTemplate.upsert(query, update, LeaderboardDocument.class);
    }

    @Override
    public List<LeaderboardEntry> findAllOrderedByTotalPointsDesc() {
        Query query = new Query().with(Sort.by(Sort.Direction.DESC, "totalPoints"));
        return mongoTemplate.find(query, LeaderboardDocument.class).stream()
                .map(LeaderboardDocument::toDomain)
                .toList();
    }
}
