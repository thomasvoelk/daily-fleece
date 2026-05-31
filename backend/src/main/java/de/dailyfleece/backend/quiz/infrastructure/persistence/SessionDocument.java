package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionPhotos;
import de.dailyfleece.backend.quiz.domain.SessionPlayer;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sessions")
record SessionDocument(
        @Id String sessionId,
        LocalDate date,
        String phase,
        List<SessionPlayerDocument> players,
        String hostId,
        SessionPhotos photos) {

    static SessionDocument fromDomain(Session session) {
        List<SessionPlayerDocument> players = session.players().stream()
                .map(p -> new SessionPlayerDocument(
                        p.playerId().toString(), p.displayName().value()))
                .toList();
        return new SessionDocument(
                session.sessionId().toString(),
                session.date(),
                session.phase().name(),
                players,
                session.hostId().toString(),
                session.photos());
    }

    Session toDomain() {
        List<SessionPlayer> domainPlayers = players.stream()
                .map(p -> new SessionPlayer(UUID.fromString(p.playerId()), new PlayerName(p.displayName())))
                .toList();
        return Session.reconstitute(
                UUID.fromString(sessionId),
                date,
                SessionPhase.valueOf(phase),
                domainPlayers,
                UUID.fromString(hostId),
                photos);
    }
}
