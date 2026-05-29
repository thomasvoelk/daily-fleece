package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionPlayer;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sessions")
record SessionDocument(
        @Id String sessionId, @Indexed(unique = true) String date, String phase, List<SessionPlayerDocument> players) {

    static SessionDocument fromDomain(Session session) {
        List<SessionPlayerDocument> players = session.players().stream()
                .map(p -> new SessionPlayerDocument(
                        p.playerId().toString(), p.displayName().value()))
                .toList();
        return new SessionDocument(
                session.sessionId().toString(),
                session.date().toString(),
                session.phase().name(),
                players);
    }

    Session toDomain() {
        List<SessionPlayer> domainPlayers = players.stream()
                .map(p -> new SessionPlayer(UUID.fromString(p.playerId()), new DisplayName(p.displayName())))
                .toList();
        return Session.reconstitute(
                UUID.fromString(sessionId), LocalDate.parse(date), SessionPhase.valueOf(phase), domainPlayers);
    }
}
