package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionKey;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import de.dailyfleece.backend.shared.PlayerName;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
import java.io.InputStream;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Creates a new Session for today with two host-supplied photos. */
@Service
public class CreateSessionUseCase {

    private final PhotoRepository photoRepository;
    private final SessionRepository sessionRepository;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public CreateSessionUseCase(PhotoRepository photoRepository, SessionRepository sessionRepository) {
        this.photoRepository = photoRepository;
        this.sessionRepository = sessionRepository;
    }

    /** Creates and persists a new session with two host-supplied photos; throws if one already exists for the key. */
    @Observed
    @ObservationKeyValue(key = "session.id", resolver = SessionIdKeyValueResolver.class, cardinality = Cardinality.HIGH)
    public Session create(
            SessionKey key,
            @ObservationKeyValue(key = "player.id", cardinality = Cardinality.HIGH) UUID hostId,
            PlayerName hostDisplayName,
            InputStream q1Data,
            PhotoType q1PhotoType,
            InputStream q2Data,
            PhotoType q2PhotoType) {

        if (sessionRepository.findByKey(key).isPresent()) {
            throw new SessionAlreadyExists(key.date());
        }

        Session session = Session.create(key, hostId, hostDisplayName);
        photoRepository.store(new Photo(session.sessionId(), "q1", q1Data, q1PhotoType));
        photoRepository.store(new Photo(session.sessionId(), "q2", q2Data, q2PhotoType));
        sessionRepository.save(session);
        return session;
    }
}
