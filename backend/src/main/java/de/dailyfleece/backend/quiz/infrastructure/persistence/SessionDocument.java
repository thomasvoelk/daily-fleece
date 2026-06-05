package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.quiz.domain.QuestionVoting;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhase;
import de.dailyfleece.backend.quiz.domain.SessionPlayer;
import de.dailyfleece.backend.shared.PlayerName;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sessions")
record SessionDocument(
        @Id String sessionId,
        LocalDate date,
        String phase,
        List<SessionPlayerDocument> players,
        String hostId,
        @Nullable QuestionVotingDocument q1Voting,
        @Nullable QuestionVotingDocument q2Voting) {

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
                session.q1Voting().map(QuestionVotingDocument::fromDomain).orElse(null),
                session.q2Voting().map(QuestionVotingDocument::fromDomain).orElse(null));
    }

    Session toDomain() {
        List<SessionPlayer> domainPlayers = players.stream()
                .map(p -> new SessionPlayer(UUID.fromString(p.playerId()), new PlayerName(p.displayName())))
                .toList();
        QuestionVoting q1 = q1Voting != null ? q1Voting.toDomain() : null;
        QuestionVoting q2 = q2Voting != null ? q2Voting.toDomain() : null;
        return Session.reconstitute(
                UUID.fromString(sessionId),
                date,
                SessionPhase.valueOf(phase),
                domainPlayers,
                UUID.fromString(hostId),
                q1,
                q2);
    }
}
