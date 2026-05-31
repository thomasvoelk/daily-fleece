package de.dailyfleece.backend.quiz.domain;

import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository {

    void store(Photo photo);

    Optional<Photo> load(UUID sessionId, String question);
}
