package de.dailyfleece.backend.quiz.infrastructure.persistence;

import com.mongodb.client.gridfs.model.GridFSFile;
import de.dailyfleece.backend.infrastructure.Generated;
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

    // GridFsResource#getInputStream() only returns an already-opened stream (verified via
    // GridFsTemplate#getResource, which eagerly calls GridFSBucket#openDownloadStream) and does not
    // itself perform I/O, so the catch below is unreachable via real infrastructure -- confirmed by
    // deliberately deleting a stored file's fs.chunks entries, which surfaces as an unchecked
    // MongoGridFSException on read, not this checked IOException (see df-0b86.3). Kept only because
    // the checked signature of InputStreamResource#getInputStream() forces a catch somewhere;
    // isolated into its own @Generated method so the jacoco gate excludes only this unreachable
    // path, not the rest of this class.
    @Generated
    private InputStream openStream(GridFSFile file, UUID sessionId, String question) {
        try {
            return operations.getResource(file).getInputStream();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load photo: " + Photo.filenameFor(sessionId, question), e);
        }
    }
}
