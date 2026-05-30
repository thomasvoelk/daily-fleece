package de.dailyfleece.backend.quiz.domain;

import de.dailyfleece.backend.player.api.DisplayName;
import java.util.UUID;

/** A Player's participation record within a Session, linking their identity to the Display Name they used at join time. */
public record SessionPlayer(UUID playerId, DisplayName displayName) {}
