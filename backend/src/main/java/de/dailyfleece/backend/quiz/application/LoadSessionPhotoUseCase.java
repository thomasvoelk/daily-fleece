package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoId;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class LoadSessionPhotoUseCase {

    private final SessionRepository sessionRepository;
    private final PhotoRepository photoRepository;

    public LoadSessionPhotoUseCase(SessionRepository sessionRepository, PhotoRepository photoRepository) {
        this.sessionRepository = sessionRepository;
        this.photoRepository = photoRepository;
    }

    public Photo load(UUID sessionId, String question) {
        var session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        PhotoId photoId = "q2".equals(question)
                ? session.photos().q2PhotoId()
                : session.photos().q1PhotoId();
        return photoRepository.load(photoId).orElseThrow(() -> new SessionNotFound(sessionId));
    }
}
