package de.dailyfleece.backend.quiz.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mongodb.client.gridfs.model.GridFSFile;
import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;

/**
 * GridFsPhotoRepository#openStream wraps a checked IOException from GridFsResource#getInputStream()
 * as IllegalStateException. No real GridFS state was found where getInputStream() itself throws (see
 * df-0b86.6) -- this test forces it with a hand-written GridFsTemplate subclass overriding only
 * getResource(GridFSFile); store/findOne still hit the real Testcontainers MongoDB (no Mockito, per
 * this repo's test conventions).
 */
@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class GridFsPhotoRepositoryOpenStreamFailureTest {

    @Autowired
    private MongoDatabaseFactory mongoDatabaseFactory;

    @Autowired
    private MongoConverter mongoConverter;

    private static final class BrokenGridFsResource extends GridFsResource {
        BrokenGridFsResource(GridFSFile file) {
            super(file, new ByteArrayInputStream(new byte[0]));
        }

        @Override
        public InputStream getInputStream() throws IOException {
            throw new IOException("broken stream");
        }
    }

    private final class FaultyGridFsTemplate extends GridFsTemplate {
        FaultyGridFsTemplate() {
            super(mongoDatabaseFactory, mongoConverter);
        }

        @Override
        public GridFsResource getResource(GridFSFile file) {
            return new BrokenGridFsResource(file);
        }
    }

    @Test
    void load_wraps_getInputStream_ioexception_as_illegalStateException() {
        UUID sessionId = UUID.randomUUID();
        var repository = new GridFsPhotoRepository(new FaultyGridFsTemplate());
        repository.store(new Photo(
                sessionId, "q1", new ByteArrayInputStream("data".getBytes(StandardCharsets.UTF_8)), PhotoType.JPEG));

        assertThatThrownBy(() -> repository.load(sessionId, "q1"))
                .isInstanceOf(IllegalStateException.class)
                .hasCauseInstanceOf(IOException.class);
    }
}
