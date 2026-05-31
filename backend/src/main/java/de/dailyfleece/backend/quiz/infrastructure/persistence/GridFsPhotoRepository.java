package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoId;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import java.io.IOException;
import java.io.InputStream;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.bson.Document;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.stereotype.Repository;
import org.springframework.util.MimeType;

@Repository
class GridFsPhotoRepository implements PhotoRepository {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final GridFsOperations operations;

    GridFsPhotoRepository(GridFsOperations operations) {
        this.operations = operations;
    }

    @Override
    public PhotoId store(InputStream data, MimeType mimeType, UUID sessionId, String question) {
        PhotoId photoId = generatePhotoId();
        var metadata = new Document("photoId", photoId.value())
                .append("_contentType", mimeType.toString())
                .append("sessionId", sessionId.toString())
                .append("question", question);
        operations.store(data, sessionId + "_" + question, mimeType.toString(), metadata);
        return photoId;
    }

    @Override
    public Optional<Photo> load(PhotoId photoId) {
        var file = operations.findOne(
                Query.query(Criteria.where("metadata.photoId").is(photoId.value())));
        if (file == null) {
            return Optional.empty();
        }
        try {
            var metadata = file.getMetadata();
            if (metadata == null) {
                throw new IllegalStateException("GridFS file has no metadata for id: " + photoId.value());
            }
            var mimeType = MimeType.valueOf(metadata.getString("_contentType"));
            return Optional.of(new Photo(operations.getResource(file).getInputStream(), mimeType));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load photo: " + photoId.value(), e);
        }
    }

    private static PhotoId generatePhotoId() {
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        return new PhotoId(HexFormat.of().formatHex(bytes));
    }
}
