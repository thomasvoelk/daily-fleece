package de.dailyfleece.backend.quiz.domain;

import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;
import org.springframework.util.MimeType;

public interface PhotoRepository {

    PhotoId store(InputStream data, MimeType mimeType, UUID sessionId, String question);

    Optional<Photo> load(PhotoId photoId);
}
