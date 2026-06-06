package de.dailyfleece.backend.player.infrastructure.web;

import de.dailyfleece.api.LeaderboardApi;
import de.dailyfleece.api.model.LeaderboardEntry;
import de.dailyfleece.api.model.LeaderboardResponse;
import de.dailyfleece.backend.player.application.GetLeaderboardUseCase;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/{version}", version = "1.0+")
class LeaderboardController implements LeaderboardApi {

    private final GetLeaderboardUseCase getLeaderboardUseCase;

    LeaderboardController(GetLeaderboardUseCase getLeaderboardUseCase) {
        this.getLeaderboardUseCase = getLeaderboardUseCase;
    }

    @Override
    public ResponseEntity<LeaderboardResponse> getLeaderboard() {
        List<LeaderboardEntry> entries = getLeaderboardUseCase.get().stream()
                .map(e -> new LeaderboardEntry(
                        e.playerId().toString(), e.displayName().value(), e.totalPoints(), e.sessionsParticipated()))
                .toList();
        return ResponseEntity.ok(new LeaderboardResponse("default", entries));
    }
}
