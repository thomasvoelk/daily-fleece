package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;

/** Creates a new Session for today with two host-supplied photos. */
@Service
public class CreateSessionUseCase {

    private final PhotoRepository photoRepository;
    private final SessionRepository sessionRepository;

    public CreateSessionUseCase(PhotoRepository photoRepository, SessionRepository sessionRepository) {
        this.photoRepository = photoRepository;
        this.sessionRepository = sessionRepository;
    }

    /** Creates and persists a new session with two host-supplied photos; throws if one already exists for the date. */
    public Session create(
            LocalDate date,
            UUID hostId,
            PlayerName hostDisplayName,
            InputStream q1Data,
            MimeType q1ContentType,
            InputStream q2Data,
            MimeType q2ContentType) {

        if (sessionRepository.findByDate(date).isPresent()) {
            throw new SessionAlreadyExists(date);
        }

        Session session = Session.create(date, hostId, hostDisplayName);
        photoRepository.store(new Photo(session.sessionId(), "q1", q1Data, q1ContentType));
        photoRepository.store(new Photo(session.sessionId(), "q2", q2Data, q2ContentType));
        sessionRepository.save(session);
        return session;
    }
}
