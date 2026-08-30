package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Loads the photo stored for a given session question. */
@Service
public class LoadSessionPhotoUseCase {

    private final PhotoRepository photoRepository;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public LoadSessionPhotoUseCase(PhotoRepository photoRepository) {
        this.photoRepository = photoRepository;
    }

    /** Returns the photo for the given session and question, or throws {@link SessionNotFound}. */
    @Observed
    public Photo load(
            @ObservationKeyValue(key = "session.id", cardinality = Cardinality.HIGH) UUID sessionId,
            @ObservationKeyValue(key = "voting.question", cardinality = Cardinality.LOW) String question) {
        return photoRepository.load(sessionId, question).orElseThrow(() -> new SessionNotFound(sessionId));
    }
}
