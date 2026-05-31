package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class LoadSessionPhotoUseCase {

    private final PhotoRepository photoRepository;

    public LoadSessionPhotoUseCase(PhotoRepository photoRepository) {
        this.photoRepository = photoRepository;
    }

    public Photo load(UUID sessionId, String question) {
        return photoRepository.load(sessionId, question).orElseThrow(() -> new SessionNotFound(sessionId));
    }
}
