package de.dailyfleece.backend.quiz.infrastructure.persistence;

import com.mongodb.client.gridfs.model.GridFSFile;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import java.io.IOException;
import java.io.InputStream;
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
        var metadata = file.getMetadata();
        if (metadata == null) {
            throw new IllegalStateException(
                    "GridFS file has no metadata for: " + Photo.filenameFor(sessionId, question));
        }
        var photoType = PhotoType.valueOf(metadata.getString("_photoType"));
        return Optional.of(new Photo(sessionId, question, openStream(file, sessionId, question), photoType));
    }

    // No real GridFS state was found where GridFsResource#getInputStream() itself throws checked
    // IOException (see df-0b86.3, df-0b86.6): it only surfaces via verifyExists(), reachable only for
    // an "absent" resource obtained through GridFsTemplate#getResource(String), a call this class
    // never makes. Real reachability isn't the point of testing this catch, though: the method
    // signature says this can throw, so GridFsPhotoRepositoryOpenStreamFailureTest forces it via a
    // hand-written GridFsTemplate subclass (see df-0b86.6) to prove the wrap-and-rethrow is correct.
    private InputStream openStream(GridFSFile file, UUID sessionId, String question) {
        try {
            return operations.getResource(file).getInputStream();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load photo: " + Photo.filenameFor(sessionId, question), e);
        }
    }
}
