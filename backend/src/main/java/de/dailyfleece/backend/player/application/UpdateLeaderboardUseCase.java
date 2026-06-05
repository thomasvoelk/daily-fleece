package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.domain.LeaderboardRepository;
import de.dailyfleece.backend.quiz.api.SessionEndedDomainEvent;
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
    public void on(SessionEndedDomainEvent event) {
        for (SessionEndedDomainEvent.PlayerScore score : event.scores()) {
            leaderboardRepository.upsertScore(score.playerId(), score.displayName(), score.pointsEarned());
        }
    }
}
