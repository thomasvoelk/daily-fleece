package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import java.io.IOException;
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

    private final GridFsOperations operations;

    GridFsPhotoRepository(GridFsOperations operations) {
        this.operations = operations;
    }

    @Override
    public void store(Photo photo) {
        var metadata = new Document("_contentType", photo.mimeType().toString());
        operations.store(photo.data(), photo.filename(), photo.mimeType().toString(), metadata);
    }

    @Override
    public Optional<Photo> load(UUID sessionId, String question) {
        var file =
                operations.findOne(Query.query(Criteria.where("filename").is(Photo.filenameFor(sessionId, question))));
        if (file == null) {
            return Optional.empty();
        }
        try {
            var metadata = file.getMetadata();
            if (metadata == null) {
                throw new IllegalStateException(
                        "GridFS file has no metadata for: " + Photo.filenameFor(sessionId, question));
            }
            var mimeType = MimeType.valueOf(metadata.getString("_contentType"));
            return Optional.of(
                    new Photo(sessionId, question, operations.getResource(file).getInputStream(), mimeType));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load photo: " + Photo.filenameFor(sessionId, question), e);
        }
    }
}
