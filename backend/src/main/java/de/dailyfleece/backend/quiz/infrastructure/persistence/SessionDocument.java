package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.PhotoId;
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
        SessionPhotosDoc photos) {

    record SessionPhotosDoc(String q1PhotoId, String q2PhotoId) {
        static SessionPhotosDoc fromDomain(SessionPhotos photos) {
            return new SessionPhotosDoc(
                    photos.q1PhotoId().value(), photos.q2PhotoId().value());
        }

        SessionPhotos toDomain() {
            return new SessionPhotos(new PhotoId(q1PhotoId), new PhotoId(q2PhotoId));
        }
    }

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
                SessionPhotosDoc.fromDomain(session.photos()));
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
                photos.toDomain());
    }
}
