package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

@Component
class MongoSessionRepository implements SessionRepository {

    private final MongoTemplate mongoTemplate;

    MongoSessionRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void save(Session session) {
        mongoTemplate.save(SessionDocument.fromDomain(session));
    }

    @Override
    public Optional<Session> findById(UUID sessionId) {
        @Nullable SessionDocument doc = mongoTemplate.findById(sessionId.toString(), SessionDocument.class);
        return Optional.ofNullable(doc).map(SessionDocument::toDomain);
    }

    @Override
    public Optional<Session> findByDate(LocalDate date) {
        Query query = Query.query(Criteria.where("date").is(date));
        @Nullable SessionDocument doc = mongoTemplate.findOne(query, SessionDocument.class);
        return Optional.ofNullable(doc).map(SessionDocument::toDomain);
    }

    @Override
    public void deleteByDate(LocalDate date) {
        Query query = Query.query(Criteria.where("date").is(date));
        mongoTemplate.remove(query, SessionDocument.class);
    }
}
