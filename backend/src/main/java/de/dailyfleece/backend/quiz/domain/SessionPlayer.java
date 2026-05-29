package de.dailyfleece.backend.quiz.domain;

import de.dailyfleece.backend.player.api.DisplayName;
import java.util.UUID;

public record SessionPlayer(UUID playerId, DisplayName displayName) {}
