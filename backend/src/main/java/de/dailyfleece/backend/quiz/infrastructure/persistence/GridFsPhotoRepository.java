package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.bson.Document;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.stereotype.Repository;

@Repository
class GridFsPhotoRepository implements PhotoRepository {

    private final GridFsOperations operations;

    GridFsPhotoRepository(GridFsOperations operations) {
        this.operations = operations;
    }

    @Override
    public void store(Photo photo) {
        var metadata = new Document("_photoType", photo.photoType().name());
        operations.store(photo.data(), photo.filename(), null, metadata);
    }

    @Override
    public void deleteBySessionId(UUID sessionId) {
        operations.delete(Query.query(Criteria.where("filename").regex("^" + sessionId + "_")));
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
            var photoType = PhotoType.valueOf(metadata.getString("_photoType"));
            return Optional.of(
                    new Photo(sessionId, question, operations.getResource(file).getInputStream(), photoType));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load photo: " + Photo.filenameFor(sessionId, question), e);
        }
    }
}
