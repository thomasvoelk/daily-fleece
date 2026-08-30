package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.domain.LeaderboardEntry;
import de.dailyfleece.backend.player.domain.LeaderboardRepository;
import io.micrometer.observation.annotation.Observed;
import java.util.List;
import org.springframework.stereotype.Service;

/** Returns the current leaderboard, ordered by totalPoints descending. */
@Service
public class GetLeaderboardUseCase {

    private final LeaderboardRepository leaderboardRepository;

    public GetLeaderboardUseCase(LeaderboardRepository leaderboardRepository) {
        this.leaderboardRepository = leaderboardRepository;
    }

    /** Returns all leaderboard entries ordered by totalPoints descending. */
    @Observed
    public List<LeaderboardEntry> get() {
        return leaderboardRepository.findAllOrderedByTotalPointsDesc();
    }
}
