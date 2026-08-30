package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.domain.LeaderboardRepository;
import de.dailyfleece.backend.quiz.api.SessionEndedDomainEvent;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/** Consumes SessionEndedDomainEvent and upserts leaderboard entries for every player. */
@Service
public class UpdateLeaderboardUseCase {

    private final LeaderboardRepository leaderboardRepository;

    public UpdateLeaderboardUseCase(LeaderboardRepository leaderboardRepository) {
        this.leaderboardRepository = leaderboardRepository;
    }

    /** Handles the event by upserting one leaderboard entry per player score. */
    @EventListener
    @Observed
    public void on(
            @ObservationKeyValue(key = "session.id", expression = "sessionId", cardinality = Cardinality.HIGH)
                    SessionEndedDomainEvent event) {
        for (SessionEndedDomainEvent.PlayerScore score : event.scores()) {
            leaderboardRepository.upsertScore(score.playerId(), score.displayName(), score.pointsEarned());
        }
    }
}
